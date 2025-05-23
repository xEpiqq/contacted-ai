import { NextResponse } from 'next/server';
import { esClient } from "@/utils/elasticsearch/client";

export async function POST(request) {
  try {
    const { database, column, values, type } = await request.json();

    if (!database || !column || !values || !Array.isArray(values)) {
      return NextResponse.json({ 
        error: 'Database, column, and values array are required.' 
      }, { status: 400 });
    }

    if (type === "industry") {
      const results = await verifyIndustryKeywords(values, database, column);
      return NextResponse.json(results);
    } else if (type === "location") {
      const results = await verifyLocation(values[0], database, column); // Location expects single value
      return NextResponse.json(results);
    } else {
      return NextResponse.json({ 
        error: 'Type must be either "industry" or "location".' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Database validation error:', error);
    return NextResponse.json({ 
      error: 'Failed to validate against database.' 
    }, { status: 500 });
  }
}

async function verifyIndustryKeywords(industryKeywords, tableName, column) {
  // Keep track of keywords that have already been selected as winners
  const usedKeywords = new Set();

  // Process all keywords sequentially to avoid keyword reuse
  const results = [];
  
  for (const keyword of industryKeywords) {
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

  return { 
    matches: results,
    usedKeywords: Array.from(usedKeywords)
  };
}

async function verifyLocation(locationValue, tableName, column) {
  // Skip verification if location is not provided
  if (!locationValue || !locationValue.trim()) {
    return { matches: [] };
  }
  
  locationValue = locationValue.trim();
  
  try {
    const exactQuery = {
      match_phrase: {
        [`${column}.keyword`]: locationValue
      }
    };
    
    const fuzzyQuery = {
      match: {
        [column]: {
          query: locationValue,
          fuzziness: "AUTO" 
        }
      }
    };
    
    // First try exact match
    const exactResponse = await esClient.search({
      index: tableName,
      size: 0,
      query: exactQuery,
      aggs: {
        count: {
          value_count: {
            field: `${column}.keyword`
          }
        }
      }
    });
    
    const exactCount = exactResponse.hits.total.value;
    
    // If exact match fails, try fuzzy match for approximate locations
    let matches = [];
    if (exactCount === 0) {
      const fuzzyResponse = await esClient.search({
        index: tableName,
        size: 0,
        query: fuzzyQuery,
        aggs: {
          location_matches: {
            terms: {
              field: `${column}.keyword`,
              size: 5,
              order: { "_count": "desc" }
            }
          }
        }
      });
      
      const buckets = fuzzyResponse.aggregations?.location_matches?.buckets || [];
      
      // Return best fuzzy matches and their counts
      if (buckets.length > 0) {
        matches = buckets.map(bucket => ({
          value: bucket.key,
          count: bucket.doc_count,
          isControl: false
        }));
      }
    } else {
      // Return the exact match
      matches = [{
        value: locationValue,
        count: exactCount,
        isControl: false
      }];
    }
    
    // Create the control (AI-generated) location
    const controlLocation = {
      value: locationValue,
      count: exactCount > 0 ? exactCount : 0,
      isControl: true
    };
    
    // Always use the original AI-generated location as the winner
    // and the database matches as alternates
    return { 
      matches: [{
        value: locationValue,
        winner: controlLocation, // Always use the AI control as winner
        alternates: matches.filter(match => 
          match.value.toLowerCase() !== locationValue.toLowerCase()
        )
      }]
    };
    
  } catch (error) {
    console.error(`Error verifying location "${locationValue}":`, error);
    return { 
      matches: [{
        value: locationValue,
        winner: {
          value: locationValue,
          count: 0,
          isControl: true
        },
        alternates: [],
        error: error.message
      }]
    };
  }
} 