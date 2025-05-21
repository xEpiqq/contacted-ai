import { NextResponse } from "next/server";
import { esClient } from "@/utils/elasticsearch/client";

/**
 * POST /api/ai/verify-industries
 * Finds the most common matching industries in the database for each AI-generated industry keyword.
 * Body: { keywords: ["Technology", "Financial Services", ...] }
 * Returns: { 
 *   matches: [
 *     { 
 *       keyword: "Technology", 
 *       winner: { keyword: "Technology", count: 69700, isControl: true },
 *       alternates: [
 *         { keyword: "Information Technology", count: 46000 },
 *         { keyword: "Computer Software", count: 32000 }
 *       ]
 *     },
 *     ...
 *   ],
 *   usedKeywords: ["Technology", "Financial Services"] 
 * }
 */
export async function POST(request) {
  try {
    const { keywords } = await request.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid keywords array" },
        { status: 400 }
      );
    }

    const tableName = "usa4_new_v2";
    const column = "Industry";
    
    // Keep track of keywords that have already been selected as winners
    const usedKeywords = new Set();

    // Process all keywords sequentially to avoid keyword reuse
    const results = [];
    
    for (const keyword of keywords) {
      try {
        // First check if the exact keyword exists and how many matches it has
        const exactMatchAgg = await esClient.search({
          index: tableName,
          size: 0,
          query: {
            match_phrase: {
              [`${column}.keyword`]: keyword,
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
        
        // Control is the AI-generated keyword
        let controlKeyword = {
          keyword: keyword,
          count: exactCount || 0,
          isControl: true
        };
        
        // Break down the keyword into parts for search
        const keywordWords = keyword.toLowerCase().split(/\s+/);

        // Build a specialized query for this industry keyword
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
                      query: keyword,
                      boost: 10.0
                    }
                  }
                },
                // Industries containing all words in any order (high boost)
                {
                  bool: {
                    must: keywordWords.map(word => ({
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
                // For multi-word industries, try partial matches
                ...(keywordWords.length > 1 ? [
                  {
                    match: {
                      [column]: {
                        query: keywordWords.join(" "),
                        fuzziness: "AUTO",
                        boost: 3.0
                      }
                    }
                  }
                ] : [])
              ],
              minimum_should_match: 1
            }
          },
          aggs: {
            keyword_matches: {
              terms: {
                field: `${column}.keyword`,
                size: 15, // Get more candidates
                order: { "_count": "desc" }
              }
            }
          }
        });

        // Extract the aggregation results
        const buckets = searchResponse.aggregations?.keyword_matches?.buckets || [];
        
        // Build the candidate matches array with counts
        let candidateMatches = buckets
          .filter(bucket => bucket.key.toLowerCase() !== keyword.toLowerCase()) // Filter out exact matches
          .map(bucket => ({
            keyword: bucket.key,
            count: bucket.doc_count
          }));
          
        // Add diverse candidates via a secondary search if needed
        if (candidateMatches.length < 5) {
          const fallbackResponse = await esClient.search({
            index: tableName,
            size: 0,
            query: {
              match: {
                [column]: {
                  query: keyword,
                  fuzziness: "AUTO"
                }
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
            if (!candidateMatches.some(match => match.keyword === bucket.key) && 
                bucket.key.toLowerCase() !== keyword.toLowerCase()) {
              candidateMatches.push({
                keyword: bucket.key,
                count: bucket.doc_count
              });
            }
          });
        }
        
        // If there are no candidates but we have an exact match...
        if (candidateMatches.length === 0 && exactCount > 0) {
          // Use the control keyword as both control and winner (it's a perfect match)
          const winner = {
            ...controlKeyword,
            matched: true
          };
          usedKeywords.add(winner.keyword.toLowerCase());
          
          results.push({
            keyword,
            winner,
            alternates: []
          });
          continue;
        }
        
        // Filter out keywords that have already been chosen as winners for other queries
        candidateMatches = candidateMatches.filter(m => !usedKeywords.has(m.keyword.toLowerCase()));
        
        // Determine which keyword to use as winner
        let winner;
        let alternates = [];
        
        if (candidateMatches.length === 0) {
          // If no alternatives, use the control keyword
          winner = { ...controlKeyword };
        } else {
          // Sort by count descending
          candidateMatches.sort((a, b) => b.count - a.count);
          
          // Choose the best match as winner if it's better than the control
          const bestMatch = candidateMatches[0];
          
          // If the control doesn't exist (count = 0) or the best match has more records
          if (controlKeyword.count === 0 || bestMatch.count > controlKeyword.count) {
            winner = { ...bestMatch, matched: true };
            alternates = [controlKeyword, ...candidateMatches.slice(1)];
          } else {
            // Otherwise use the control as winner
            winner = { ...controlKeyword, matched: true };
            alternates = candidateMatches;
          }
        }
        
        // Mark the winner as used
        usedKeywords.add(winner.keyword.toLowerCase());
        
        // Limit alternates to top 5
        alternates = alternates.slice(0, 5);
        
        results.push({
          keyword,
          winner,
          alternates
        });
      } catch (error) {
        console.error(`Error matching keyword "${keyword}":`, error);
        results.push({
          keyword,
          winner: { keyword, count: 0, isControl: true },
          alternates: [],
          error: error.message
        });
      }
    }

    return NextResponse.json({ 
      matches: results,
      usedKeywords: Array.from(usedKeywords)
    });
  } catch (err) {
    console.error("[Verify-Industries] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 