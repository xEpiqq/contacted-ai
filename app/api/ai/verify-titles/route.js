import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { esClient } from "@/utils/elasticsearch/client";

/**
 * POST /api/ai/verify-titles
 * Finds the most common matching titles in the database for each AI-generated job title.
 * Body: { titles: ["Software Engineer", "Product Manager", ...] }
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
    const { titles } = await request.json();

    if (!titles || !Array.isArray(titles) || titles.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid titles array" },
        { status: 400 }
      );
    }

    // 1) Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const tableName = "usa4_new_v2";
    const column = "Job title";
    
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
          
          fallbackBuckets.forEach(bucket => {
            if (!candidateMatches.some(match => match.title === bucket.key) && 
                bucket.key.toLowerCase() !== title.toLowerCase()) {
              candidateMatches.push({
                title: bucket.key,
                count: bucket.doc_count
              });
            }
          });
        }
        
        // Determine the winner
        // 1. Filter out titles that have already been used as winners
        const availableCandidates = candidateMatches.filter(
          match => !usedTitles.has(match.title.toLowerCase())
        );
        
        // 2. Decide the winner
        let winner = controlTitle;
        let alternates = [];
        
        // If control title has no matches, look for a better alternative
        if (controlTitle.count === 0 && availableCandidates.length > 0) {
          // Find the candidate with the highest count
          const bestCandidate = availableCandidates.reduce((best, current) => 
            current.count > best.count ? current : best, availableCandidates[0]);
          
          winner = bestCandidate;
        } 
        // If control has matches but a candidate has significantly more
        else if (controlTitle.count > 0 && availableCandidates.length > 0) {
          const bestCandidate = availableCandidates.reduce((best, current) => 
            current.count > best.count ? current : best, availableCandidates[0]);
          
          // If best candidate has at least 50% more matches than control, it wins
          if (bestCandidate.count > controlTitle.count * 1.5) {
            winner = bestCandidate;
          }
        }
        
        // Mark winner as used
        usedTitles.add(winner.title.toLowerCase());
        
        // Collect alternates (remaining candidates)
        alternates = candidateMatches
          .filter(match => match.title !== winner.title)
          .slice(0, 5); // Limit to top 5
        
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
    console.error("[Verify-Titles] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 