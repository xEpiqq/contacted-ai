import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { esClient } from "@/utils/elasticsearch/client";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
  }

  try {
    const { description } = await request.json();

    if (!description) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
    }

    // Step 1: Determine target type (people or businesses)
    const targetTypeResponse = await determineTargetType(description);
    
    // Step 2: Based on target type, extract relevant criteria
    let extractionResponse;
    if (targetTypeResponse.targetType === "local_businesses") {
      extractionResponse = await extractBusinessCategories(description);
    } else {
      // For people, extract job titles, industry keywords, and location in parallel
      const [jobTitlesResponse, industryKeywordsResponse, locationResponse] = await Promise.all([
        extractJobTitles(description),
        extractIndustryKeywords(description),
        extractLocationInfo(description)
      ]);
      
      extractionResponse = {
        ...jobTitlesResponse,
        ...industryKeywordsResponse,
        ...locationResponse
      };
      
      // Step 3: Verification steps - we'll skip job title verification but keep others
      const verificationPromises = [];
      
      // For job titles: skip database verification, use AI-generated titles directly
      // We're not running verifyJobTitles() for job titles anymore
      
      // Step 4: If industry keywords were extracted, verify them against the database
      if (extractionResponse.industryKeywords && extractionResponse.industryKeywords.length > 0) {
        verificationPromises.push(verifyIndustryKeywords(extractionResponse.industryKeywords));
      }
      
      // Step 5: If location was extracted, verify it against the database
      if (extractionResponse.locationInfo && 
          extractionResponse.locationInfo.value && 
          extractionResponse.locationInfo.locationType !== "none") {
        verificationPromises.push(verifyLocation(extractionResponse.locationInfo));
      }
      
      // Wait for all verification processes to complete
      if (verificationPromises.length > 0) {
        const verificationResults = await Promise.all(verificationPromises);
        
        // Combine results
        const combinedResults = {
          ...targetTypeResponse,
          ...extractionResponse,
          // Set titleMatches to empty array to indicate no database matching was done
          titleMatches: []
        };
        
        // Skip setting jobTitlesVerification since we're not verifying
        let verificationIndex = 0;
        
        // Add industry keywords verification if available
        if (extractionResponse.industryKeywords && extractionResponse.industryKeywords.length > 0) {
          const industryKeywordsVerification = verificationResults[verificationIndex++];
          combinedResults.industryMatches = industryKeywordsVerification.matches;
          combinedResults.usedKeywords = industryKeywordsVerification.usedKeywords;
        }
        
        // Add location verification if available
        if (extractionResponse.locationInfo && 
            extractionResponse.locationInfo.value && 
            extractionResponse.locationInfo.locationType !== "none") {
          const locationVerification = verificationResults[verificationIndex];
          combinedResults.locationMatches = locationVerification.matches;
          // Note: We always use the AI-generated location for searching, not database matches
          // The winner in locationMatches is kept as the control (isControl: true)
        }
        
        return NextResponse.json(combinedResults);
      }
    }

    // Combine and return all results with empty titleMatches to indicate no verification
    return NextResponse.json({
      ...targetTypeResponse,
      ...extractionResponse,
      titleMatches: []
    });

  } catch (error) {
    console.error('API error:', error);
    let errorMessage = 'Failed to process your request.';
    if (error.response) {
      errorMessage = error.response.data.error.message || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function determineTargetType(description) {
  const targetTypeTools = [{
    type: "function",
    function: {
      name: "determine_target_type",
      description: "Determines if the user is looking for local businesses or individual people as their target audience.",
      parameters: {
        type: "object",
        properties: {
          target_type: {
            type: "string",
            enum: ["people", "local_businesses"],
            description: "Whether the target audience consists of individual people or local businesses"
          },
          confidence: {
            type: "number",
            description: "Confidence level in the classification, from 0.0 to 1.0"
          }
        },
        required: ["target_type", "confidence"],
      }
    }
  }];

  const targetTypeSystemPrompt = `You are an expert assistant that determines whether a user's target audience description refers to individual people (like professionals on LinkedIn) or local businesses (like car dealerships, restaurants, etc.).
If the description mentions professional roles, job titles, or individuals, classify as "people".
If the description mentions business establishments, stores, companies, or service providers, classify as "local_businesses".
If unclear, use your best judgment based on context clues.`;
  
  const targetTypeResponse = await openai.chat.completions.create({
    model: "gpt-4.1-2025-04-14",
    messages: [
      { role: "system", content: targetTypeSystemPrompt },
      { role: "user", content: `Please determine if the following target audience description refers to individual people or local businesses: "${description}"` }
    ],
    tools: targetTypeTools,
    tool_choice: { type: "function", function: { name: "determine_target_type" } },
  });

  const targetTypeMessage = targetTypeResponse.choices[0].message;
  if (targetTypeMessage.tool_calls && targetTypeMessage.tool_calls.length > 0) {
    const toolCall = targetTypeMessage.tool_calls[0];
    if (toolCall.function.name === "determine_target_type") {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        return {
          targetType: args.target_type,
          targetTypeConfidence: args.confidence
        };
      } catch (e) {
        console.error("Error parsing target type function arguments:", e);
        throw new Error('Failed to parse OpenAI function arguments.');
      }
    }
  }

  throw new Error('OpenAI did not return the expected function call.');
}

async function extractJobTitles(description) {
  const tools = [{
    type: "function",
    function: {
      name: "extract_contact_criteria",
      description: "Extracts job titles and industry keywords from a user's description of their target audience.",
      parameters: {
        type: "object",
        properties: {
          job_titles: {
            type: "array",
            items: { "type": "string" },
            description: "A list of relevant job titles for the target audience. Should be specific roles."
          }
        },
        required: ["job_titles"],
      }
    }
  }];

  const systemPrompt = `You are an expert assistant. Your task is to analyze the user's description of their target audience and extract/generate highly relevant job titles.

GUIDELINES:
1. Generate up to 10 highly relevant job titles that match the user's criteria
2. Think expansively about synonymous and related roles that people might have
3. Include common alternative titles for the same position (e.g., different companies use different titles for similar roles)
4. Consider industry-standard terminology variations across companies and sectors
5. Avoid overly broad titles (e.g., just "Manager" alone is too broad), unless the user has left it broad
6. Consider domain-specific variations within the field mentioned
7. Generate titles that will return the people the user actually wants - prioritize relevance over quantity
8. Don't generate irrelevant titles just to reach 10 - quality over quantity
9. Use proper capitalization and standard job title formatting

APPROACH:
- When a user mentions a specific role, think about:
  * Different titles for the same role
  * Related roles with similar responsibilities
  * Specializations within that role category
  * How the role might be titled in different industries or company sizes
  * Both technical and non-technical variants when applicable
  * Common abbreviations or alternative phrasings

Always adapt to the specific domain the user is asking about while thinking creatively about related roles.`;
  
  const userPrompt = `Please extract/generate job titles from the following description of a target audience: "${description}"
Generate a diverse set of up to 10 highly relevant job titles, including alternative titles and related roles.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-2025-04-14",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    tools: tools,
    tool_choice: { type: "function", function: { name: "extract_contact_criteria" } },
  });

  const message = response.choices[0].message;

  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolCall = message.tool_calls[0];
    if (toolCall.function.name === "extract_contact_criteria") {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        return {
          jobTitles: args.job_titles || []
        };
      } catch (e) {
        console.error("Error parsing function arguments:", e);
        throw new Error('Failed to parse OpenAI function arguments.');
      }
    }
  }

  throw new Error('OpenAI did not return the expected function call.');
}

async function extractIndustryKeywords(description) {
  const tools = [{
    type: "function",
    function: {
      name: "extract_industry_keywords",
      description: "Extracts industry keywords from a user's description of their target audience.",
      parameters: {
        type: "object",
        properties: {
          industry_keywords: {
            type: "array",
            items: { "type": "string" },
            description: "A list of relevant industry keywords or sectors for the target audience."
          }
        },
        required: ["industry_keywords"],
      }
    }
  }];

  const systemPrompt = `You are an expert assistant that extracts industry keywords from user search queries.

GUIDELINES:
1. If no industry is EXPLICITLY stated in the query, return an EMPTY ARRAY - do not infer or generate any industries
2. An empty array is strongly preferable to generating industries that aren't explicitly mentioned
3. Never default to implied industries - only extract what is clearly stated
4. If industries are explicitly mentioned, return only 1-3 of the MOST specific and relevant ones
5. Focus on the most precise industry terms that directly match the query
6. Always prefer fewer, more specific industries rather than many - quality over quantity
7. Make sure keywords are realistic industry terms that would appear in a database
8. Return proper case keywords (e.g., "Financial Services" not "financial services")
9. For queries like "software engineers" with no industry specified, return an empty array
10. Only return industries when they are clearly and explicitly part of the user's request`;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-2025-04-14",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Please extract ONLY explicitly stated industry keywords from the following description of a target audience (return an empty array if no industries are explicitly mentioned): "${description}"` }
    ],
    tools: tools,
    tool_choice: { type: "function", function: { name: "extract_industry_keywords" } },
  });

  const message = response.choices[0].message;

  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolCall = message.tool_calls[0];
    if (toolCall.function.name === "extract_industry_keywords") {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        return {
          industryKeywords: args.industry_keywords || []
        };
      } catch (e) {
        console.error("Error parsing industry keywords function arguments:", e);
        throw new Error('Failed to parse OpenAI function arguments for industry keywords.');
      }
    }
  }

  throw new Error('OpenAI did not return the expected function call for industry keywords.');
}

async function extractBusinessCategories(description) {
  const businessCategoryTools = [{
    type: "function",
    function: {
      name: "extract_business_categories",
      description: "Extracts business categories and location keywords for local businesses.",
      parameters: {
        type: "object",
        properties: {
          business_categories: {
            type: "array",
            items: { "type": "string" },
            description: "A list of business categories like 'Restaurants', 'Auto Repair', 'Dental Clinics', etc."
          },
          location_keywords: {
            type: "array",
            items: { "type": "string" },
            description: "A list of relevant location or geographical keywords for the target audience."
          }
        },
        required: ["business_categories", "location_keywords"],
      }
    }
  }];

  const businessCategoryPrompt = `You are an expert assistant. Your task is to analyze the user's description of their target audience for local businesses and extract specific business categories and location keywords.
Focus on identifying concrete business types and geographical indicators. For example, if the user says "car dealerships in San Francisco", business categories would be "Car Dealerships", "Auto Sales" and location keywords would be "San Francisco", "Bay Area".
If the user says "restaurants in college towns", business categories could be "Restaurants", "Cafes", "Dining Establishments" and location keywords "College Towns", "University Areas".
Be comprehensive but ensure the extracted terms are directly supported by the user's input.`;
  
  const businessUserPrompt = `Please extract business categories and location keywords from the following description of local businesses: "${description}"`;

  const businessResponse = await openai.chat.completions.create({
    model: "gpt-4.1-2025-04-14",
    messages: [
      { role: "system", content: businessCategoryPrompt },
      { role: "user", content: businessUserPrompt }
    ],
    tools: businessCategoryTools,
    tool_choice: { type: "function", function: { name: "extract_business_categories" } },
  });

  const businessMessage = businessResponse.choices[0].message;

  if (businessMessage.tool_calls && businessMessage.tool_calls.length > 0) {
    const toolCall = businessMessage.tool_calls[0];
    if (toolCall.function.name === "extract_business_categories") {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        return {
          businessCategories: args.business_categories || [],
          locationKeywords: args.location_keywords || []
        };
      } catch (e) {
        console.error("Error parsing business categories function arguments:", e);
        throw new Error('Failed to parse OpenAI function arguments.');
      }
    }
  }

  throw new Error('OpenAI did not return the expected function call.');
}

async function verifyJobTitles(jobTitles) {
  const tableName = "usa4_new_v2";
  const column = "Job title";
  
  // Keep track of titles that have already been selected as winners
  const usedTitles = new Set();

  // Process all titles sequentially to avoid title reuse
  const results = [];
  
  for (const title of jobTitles) {
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

  return { 
    matches: results,
    usedTitles: Array.from(usedTitles)
  };
}

async function verifyIndustryKeywords(industryKeywords) {
  const tableName = "usa4_new_v2";
  const column = "Industry";
  
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

async function extractLocationInfo(description) {
  const tools = [{
    type: "function",
    function: {
      name: "extract_location_info",
      description: "Extracts location information from a user's description of their target audience.",
      parameters: {
        type: "object",
        properties: {
          location_type: {
            type: "string",
            enum: ["city", "state", "postal_code", "metro", "region", "none"],
            description: "The type of location specified in the query."
          },
          value: {
            type: "string",
            description: "The location value extracted from the query."
          },
          confidence: {
            type: "number",
            description: "Confidence level in the extraction, from 0.0 to 1.0"
          }
        },
        required: ["location_type", "value", "confidence"],
      }
    }
  }];

  const systemPrompt = `You are an expert assistant that extracts location information from user queries.
Your task is to identify and extract the most specific geographic location mentioned in a user query.

GUIDELINES:
1. Extract only locations within the United States
2. If "United States" is the only location mentioned, do NOT extract it (use location_type: "none")
3. Prioritize the MOST SPECIFIC location type: postal_code > city > state
4. For city locations:
   - For prominent cities (e.g., "San Francisco", "New York", "Chicago"), just return the city name
   - For generic city names (e.g., "Springfield", "Riverside"), include the state (e.g., "Springfield, Illinois")
5. For postal codes (ZIP codes), return just the numeric code
6. If no US location is mentioned, set location_type to "none" and value to ""
7. Format locations properly with correct capitalization
8. Return confidence level between 0.0 and 1.0 based on how clearly the location is mentioned

EXAMPLES:
- "software engineers in San Francisco" → type: "city", value: "San Francisco"
- "attorneys in Springfield" → type: "city", value: "Springfield" (add the state if you can determine it)
- "dentists in Springfield, Missouri" → type: "city", value: "Springfield, Missouri"
- "businesses in 90210" → type: "postal_code", value: "90210"
- "marketing managers in Florida" → type: "state", value: "Florida"
- "salespeople in the Boston metro area" → type: "metro", value: "Boston"
- "developers in the united states" → type: "none", value: ""
- "engineers" (no location) → type: "none", value: ""`;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-2025-04-14",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Please extract location information from the following description of a target audience: "${description}"` }
    ],
    tools: tools,
    tool_choice: { type: "function", function: { name: "extract_location_info" } },
  });

  const message = response.choices[0].message;

  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolCall = message.tool_calls[0];
    if (toolCall.function.name === "extract_location_info") {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        return {
          locationInfo: {
            locationType: args.location_type || "none",
            value: args.value || "",
            confidence: args.confidence || 0
          }
        };
      } catch (e) {
        console.error("Error parsing location function arguments:", e);
        throw new Error('Failed to parse OpenAI function arguments for location.');
      }
    }
  }

  throw new Error('OpenAI did not return the expected function call for location extraction.');
}

async function verifyLocation(locationInfo) {
  const tableName = "usa4_new_v2";
  
  // Skip verification if location is not provided or is "none"
  if (!locationInfo || !locationInfo.value || locationInfo.locationType === "none") {
    return { matches: [] };
  }
  
  // Determine which columns to check based on the location type
  let locationColumns = [];
  let locationValue = locationInfo.value.trim();
  
  switch (locationInfo.locationType) {
    case "city":
      // For cities, check both Locality (city name only) and Location (city+state)
      // If the location has a comma (city, state), use Location field, otherwise use Locality
      if (locationValue.includes(",")) {
        locationColumns = ["Location"];
      } else {
        // For prominent cities we can try both specific and general columns
        locationColumns = ["Locality", "Location"]; 
      }
      break;
    case "state":
      locationColumns = ["Region"];
      break;
    case "postal_code":
      locationColumns = ["Postal Code"];
      break;
    case "metro":
      locationColumns = ["Metro"];
      break;
    case "region":
      locationColumns = ["Region"];
      break;
    default:
      locationColumns = ["Location", "Locality", "Region"];
  }
  
  try {
    // Count matches for each location column
    const matchPromises = locationColumns.map(async (column) => {
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
          return {
            column,
            matches: buckets.map(bucket => ({
              value: bucket.key,
              count: bucket.doc_count,
              isControl: false
            }))
          };
        }
      } else {
        // Return the exact match
        return {
          column,
          matches: [{
            value: locationValue,
            count: exactCount,
            isControl: false
          }]
        };
      }
      
      // No matches found for this column
      return {
        column,
        matches: []
      };
    });
    
    const matchResults = await Promise.all(matchPromises);
    
    // Find any matching results
    let bestMatch = null;
    let maxCount = 0;
    
    matchResults.forEach(result => {
      if (result.matches && result.matches.length > 0) {
        const totalCount = result.matches.reduce((sum, match) => sum + match.count, 0);
        if (totalCount > maxCount) {
          maxCount = totalCount;
          bestMatch = result;
        }
      }
    });
    
    // Create the control (AI-generated) location
    const controlLocation = {
      value: locationValue,
      count: maxCount > 0 ? maxCount : 0,
      isControl: true
    };
    
    // If we found matches, use them as alternates
    if (bestMatch) {
      // Always use the original AI-generated location as the winner
      // and the database matches as alternates
      return { 
        matches: [{
          value: locationValue,
          winner: controlLocation, // Always use the AI control as winner
          alternates: bestMatch.matches.filter(match => 
            match.value.toLowerCase() !== locationValue.toLowerCase()
          )
        }]
      };
    }
    
    // No matches found, just return the original location as control
    return { 
      matches: [{
        value: locationValue,
        winner: controlLocation,
        alternates: []
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