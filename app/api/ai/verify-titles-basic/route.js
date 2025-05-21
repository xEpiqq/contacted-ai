import { NextResponse } from "next/server";
import { esClient } from "@/utils/elasticsearch/client";

/**
 * POST /api/ai/verify-titles-basic
 * Finds the most common matching titles in the database for each AI-generated job title.
 * Simplified version for the basic database selector.
 * Body: { titles: ["Software Engineer", "Product Manager", ...], database: "usa4_new_v2" | "deez_3_v3" }
 * Returns: { 
 *   matches: [
 *     { 
 *       title: "Software Engineer", 
 *       winner: { title: "Software Engineer", count: 69700, isControl: true },
 *       alternates: [
 *         { title: "Senior Software Engineer", count: 46000 },
 *         { title: "Full Stack Developer", count: 32000 }
 *       ]
 *     },
 *     ...
 *   ],
 *   usedTitles: ["Software Engineer", "Product Manager"] 
 * }
 */
export async function POST(request) {
  try {
    const { titles, database } = await request.json();

    if (!titles || !Array.isArray(titles) || titles.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid titles array" },
        { status: 400 }
      );
    }

    if (!database || (database !== "usa4_new_v2" && database !== "deez_3_v3")) {
      return NextResponse.json(
        { error: "Invalid database. Must be usa4_new_v2 or deez_3_v3" },
        { status: 400 }
      );
    }

    const tableName = database;
    // Different column names based on database
    const column = database === "usa4_new_v2" ? "Job title" : "category";
    
    // Keep track of titles that have already been selected as winners
    const usedTitles = new Set();

    // Process all titles sequentially to avoid title reuse
    const results = [];
    
    for (const title of titles) {
      try {
        // First check if the exact title exists and how many matches it has
        const exactMatchAgg = await esClient.search({
          index: tableName,
          size: 0,
          query: {
            match_phrase: {
              [`${column}.keyword`]: title,
            },
          },
          aggs: {
            count: {
              value_count: {
                field: `${column}.keyword`
              }
            }
          }
        });

        const exactCount = exactMatchAgg.hits.total.value;
        
        // Control is the AI-generated title
        let controlTitle = {
          title: title,
          count: exactCount || 0,
          isControl: true
        };
        
        // Break down the title into parts
        const titleWords = title.toLowerCase().split(/\s+/);

        // Build a specialized query for this job title
        const searchResponse = await esClient.search({
          index: tableName,
          size: 0,
          query: {
            bool: {
              should: [
                // Prefer exact phrase (boost highest)
                {
                  match_phrase: {
                    [column]: {
                      query: title,
                      boost: 10.0
                    }
                  }
                },
                // Titles containing all words in any order (high boost)
                {
                  bool: {
                    must: titleWords.map(word => ({
                      match: {
                        [column]: {
                          query: word,
                          operator: "and"
                        }
                      }
                    })),
                    boost: 5.0
                  }
                },
                // Most important keywords (for job type)
                ...(titleWords.length > 1 ? [{
                  match_phrase: {
                    [column]: {
                      query: titleWords.slice(-1)[0],
                      boost: 3.0
                    }
                  }
                }] : []),
                // For multi-word titles, try matching the domain/specialty
                ...(titleWords.length > 1 ? [{
                  match_phrase: {
                    [column]: {
                      query: titleWords.slice(0, -1).join(" "),
                      boost: 4.0
                    }
                  }
                }] : [])
              ],
              minimum_should_match: 1
            }
          },
          aggs: {
            title_matches: {
              terms: {
                field: `${column}.keyword`,
                size: 15, // Get more candidates
                order: { "_count": "desc" }
              }
            }
          }
        });

        // Extract the aggregation results
        const buckets = searchResponse.aggregations?.title_matches?.buckets || [];
        
        // Build the candidate matches array with counts
        let candidateMatches = buckets
          .filter(bucket => bucket.key.toLowerCase() !== title.toLowerCase()) // Filter out exact matches
          .map(bucket => ({
            title: bucket.key,
            count: bucket.doc_count
          }));
          
        // Add diverse candidates via a secondary search if needed
        if (candidateMatches.length < 5) {
          const fallbackResponse = await esClient.search({
            index: tableName,
            size: 0,
            query: {
              bool: {
                must: [
                  {
                    match: {
                      [column]: {
                        query: titleWords[titleWords.length - 1], // Last word, usually the role type
                        fuzziness: "AUTO"
                      }
                    }
                  }
                ],
                should: [
                  ...(titleWords.length > 1 ? titleWords.slice(0, -1).map(word => ({
                    match: {
                      [column]: {
                        query: word,
                        boost: 2.0
                      }
                    }
                  })) : [])
                ]
              }
            },
            aggs: {
              diverse_matches: {
                terms: {
                  field: `${column}.keyword`,
                  size: 10,
                  order: { "_count": "desc" }
                }
              }
            }
          });
          
          const fallbackBuckets = fallbackResponse.aggregations?.diverse_matches?.buckets || [];
          
          // Add these to our candidates
          fallbackBuckets.forEach(bucket => {
            // Only add if not already present and not exact match with our title
            if (bucket.key.toLowerCase() !== title.toLowerCase() && 
                !candidateMatches.some(m => m.title.toLowerCase() === bucket.key.toLowerCase())) {
              candidateMatches.push({
                title: bucket.key,
                count: bucket.doc_count
              });
            }
          });
        }
        
        // If there are no candidates but we have an exact match...
        if (candidateMatches.length === 0 && exactCount > 0) {
          // Use the control title as both control and winner (it's a perfect match)
          const winner = {
            ...controlTitle,
            matched: true
          };
          usedTitles.add(winner.title.toLowerCase());
          
          results.push({
            title,
            winner,
            alternates: []
          });
          continue;
        }
        
        // Filter out titles that have already been chosen as winners for other queries
        candidateMatches = candidateMatches.filter(m => !usedTitles.has(m.title.toLowerCase()));
        
        // Determine which title to use as winner
        let winner;
        let alternates = [];
        
        if (candidateMatches.length === 0) {
          // If no alternatives, use the control title
          winner = { ...controlTitle };
        } else {
          // Sort by count descending
          candidateMatches.sort((a, b) => b.count - a.count);
          
          // Choose the best match as winner if it's better than the control
          const bestMatch = candidateMatches[0];
          
          // If the control doesn't exist (count = 0) or the best match has more records
          if (controlTitle.count === 0 || bestMatch.count > controlTitle.count) {
            winner = { ...bestMatch, matched: true };
            alternates = [controlTitle, ...candidateMatches.slice(1)];
          } else {
            // Otherwise use the control as winner
            winner = { ...controlTitle, matched: true };
            alternates = candidateMatches;
          }
        }
        
        // Mark the winner as used
        usedTitles.add(winner.title.toLowerCase());
        
        // Limit alternates to top 5
        alternates = alternates.slice(0, 5);
        
        results.push({
          title,
          winner,
          alternates
        });
      } catch (error) {
        console.error(`Error matching title "${title}":`, error);
        results.push({
          title,
          winner: { title, count: 0, isControl: true },
          alternates: [],
          error: error.message
        });
      }
    }

    return NextResponse.json({ 
      matches: results,
      usedTitles: Array.from(usedTitles)
    });
  } catch (err) {
    console.error("[Verify-Titles-Basic] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 