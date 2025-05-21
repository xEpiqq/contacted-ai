import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { esClient } from "@/utils/elasticsearch/client";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Database selection system prompt from select-database route
const DB_SELECTION_PROMPT = `You are an expert system for selecting the most relevant database for a user's query.
You have access to information about four databases, identified by their internal names:

1.  **\`usa4_new_v2\`**:
    * **Focus**: Comprehensive data on professionals located **within the USA**.
    * **Contains**: Names, job titles, contact details, LinkedIn profiles, skills, company affiliations, industry, and US location specifics.
    * **Best for queries like**: "Find software engineers in California," "List VPs of Marketing in US tech companies," "Who are contacts at [US Company Name]?"
    * **Available Fields**: Full name, job title, emails (86.3%), phone numbers (36.2%), LinkedIn details (95%+), company info, location data (US only), skills (49.9%), gender (85.4%), industry data, and social media links for some contacts (Twitter, Facebook limited coverage).

2.  **\`otc1_new_v2\`**:
    * **Focus**: Comprehensive data on professionals located **exclusively outside of the USA**.
    * **Contains**: Names, job titles, contact details, LinkedIn profiles, skills, company affiliations, industry, and international location specifics (for any country except the USA).
    * **Best for queries like**: "Find project managers in Canada," "List contacts at [UK Company Name]," "Who are renewable energy experts in Germany?"
    * **Available Fields**: Full name, job title (64.1%), email (92.4%), limited phone numbers (2%), LinkedIn details (90%+), company info, international locations (no US data), skills (33.3%), gender (47.5%), industry data, and very limited social media information.

3.  **\`eap1_new_v2\`**:
    * **Focus**: A global B2B database of individual business contacts, with a strong emphasis on emails. This database can include contacts from any country, including the US.
    * **Contains**: Person's name, title, email, phone, company name, LinkedIn URL, global location, job function, and seniority.
    * **Best for queries like**: "I need email addresses of HR Managers for companies in the automotive sector worldwide," "Find Directors of Operations in manufacturing companies in Germany," "List business contacts at [Global Company Name]."
    * **Available Fields**: Person name, job title (99%), email (95.6%), phone numbers (82%), LinkedIn details (100%), company name, job function, seniority level, employment dates, and location information (cities, states, countries). Stronger focus on verified business emails compared to other databases.

4.  **\`deez_3_v3\`**:
    * **Focus**: Information on local businesses, primarily **within the USA**.
    * **Contains**: Business names, physical addresses, phone numbers, websites, business categories, and details about their online presence (social media, reviews, tech stack).
    * **Best for queries like**: "Find plumbers in Greensboro, NC," "List car dealerships in Arizona that use Shopify," "I need contact info for bookstores in St. Petersburg, FL."
    * **Available Fields**: Business name, phone (100%), email (51.3%), website (70.7%), address (99.2%), city/region/zip (99%+), business category (83.6%), social media links (Facebook, Instagram, Twitter, LinkedIn with varying coverage), online review data (Google/Yelp reviews and ratings), and website technology information (CMS, plugins, etc.).

IMPORTANT DATA LIMITATIONS TO UNDERSTAND:

1. **AVAILABLE USA4 DATABASE FIELDS (with coverage percentages)**: We offer the following data categories for filtering and searching:
   * **Personal Information**: 
     - Full name (100% coverage)
     - First Name (96% coverage)
     - Last Name (96.3% coverage)
     - Middle Name (5% coverage)
     - Middle Initial (11.4% coverage)
     - Gender (85.4% coverage)
   * **Professional Details**:
     - Job title (82.7% coverage)
     - Sub Role (25.2% coverage)
     - Summary (82.9% coverage)
     - Job Summary (14.8% coverage)
     - Industry (89.4% coverage)
     - Industry 2 (41% coverage)
     - Skills (49.9% coverage)
     - Years Experience (61.7% coverage)
     - Inferred Salary (61.7% coverage)
     - Start Date (46.6% coverage)
   * **Company Information**:
     - Company Name (77.3% coverage)
     - Company Size (53.6% coverage)
     - Company Industry (51.3% coverage)
     - Company Founded (38.9% coverage)
     - Company Website (42.2% coverage)
     - Company Linkedin Url (52% coverage)
     - Company Location data (38-50% coverage across fields)
   * **Contact Information**:
     - Emails (86.3% coverage)
     - Phone numbers (36.2% coverage)
     - Mobile (10.4% coverage)
   * **Location Data**:
     - Location (96% coverage)
     - Locality (96% coverage)
     - Region (96.3% coverage)
     - Metro (81.9% coverage)
     - Postal Code (21.6% coverage)
     - Location Geo (92.9% coverage)
     - Location Country (96.3% coverage)
     - Location Continent (95.8% coverage)
   * **Social Media**:
     - LinkedIn Url (95.4% coverage)
     - LinkedIn Username (96.3% coverage)
     - Linkedin Connections (94.2% coverage)
     - Facebook Username (22.9% coverage)
     - Facebook Url (22.9% coverage)
     - Twitter Username (3.1% coverage)
     - Twitter Url (2.9% coverage)
     - Github Username (0.8% coverage)
     - Github Url (1.2% coverage)
   * **Other**:
     - Interests (13.7% coverage)
     - Birth Year (7.5% coverage)
     - Birth Date (6.2% coverage)
     - Address Line 2 (1.2% coverage)
     - Street Address (23.9% coverage)

2. **Geographically-Limited Business Data**: The local business database (deez_3_v3) only covers US businesses. We cannot provide data on local businesses outside the US.

3. **Business-to-Business Focus**: All of our databases are focused on B2B (business-to-business) contacts and not B2C (business-to-consumer). We do not have:
   * Consumer marketing lists or general population data
   * Individual consumer demographic or purchase behavior data
   * Personal lifestyle or household information
   * Non-professional residential contact information

Based on the user's query:

1. Handle misspellings and partial queries: Assume the user is looking for real data even if their query has typos, is brief, or lacks detail.
   * Example: "software eginers" should be interpreted as "software engineers" and matched to a professional database.
   * If only a profession is mentioned without a location (e.g., "accountants"), assume USA unless clearly indicated otherwise.
   * Common misspellings of professions and locations should be interpreted correctly.

2. Identify the primary intention of the user's query:
   * Are they seeking individuals (professionals) or businesses?
   * Is there a geographical focus in the query? If none is explicitly stated, default to USA.
   * Are they looking specifically for contact information like emails (suggests eap1_new_v2)?
   * Are they looking for additional criteria like gender, company size, salary range, or experience? (USA database handles these well)

3. Selection rules:
   * If the query is about professionals in the USA (or no location specified): use \`usa4_new_v2\`
   * If the query is about professionals outside the USA: use \`otc1_new_v2\`
   * If the query specifically seeks email contacts or global B2B data: use \`eap1_new_v2\`
   * If the query is about local businesses or services (restaurants, shops, repair services, etc.): use \`deez_3_v3\`
   * Default to \`usa4_new_v2\` for ambiguous professional queries without clear location indicators

4. IMPORTANT - Follow-up required cases:
   In some scenarios, it's better to ask for clarification rather than selecting a potentially incorrect database. Some common scenarios:

   A. International Businesses: If the query is about local businesses in a non-US location (e.g., "plumbers in Taiwan", "restaurants in Singapore"), none of our databases are ideal. The 'deez_3_v3' database only contains US businesses.
   
   B. Ambiguous Entity Type: If it's unclear whether the user is looking for professionals or businesses (e.g., "solar contacts").
   
   C. Unclear Geography: If the query doesn't specify a location and could be either US or international.
   
   D. Complex Query: When the query contains multiple potentially conflicting requirements.
   
   E. Attribute Limitations: If a query specifically requests data attributes we don't have.
   
   F. B2C Requests: When the query is clearly seeking consumer/individual data rather than business professionals (e.g., "homeowners in Florida," "single mothers in Chicago," "retired veterans"). For these requests, suggest B2B alternatives that might still be valuable, such as professionals in relevant industries or businesses serving those demographics.

   In these cases, instead of returning a database name, return a JSON object with the following structure:
   {
     "requiresFollowUp": true,
     "message": "Brief explanation of the limitation or issue",
     "options": [
       {
         "text": "First suggested option",
         "value": "Reformulated query for this option",
         "database": "Suggested database for this option or null if needs further processing"
       },
       {
         "text": "Second suggested option",
         "value": "Reformulated query for this option",
         "database": "Suggested database for this option or null if needs further processing"
       },
       {
         "text": "Third suggested option",
         "value": "Reformulated query for this option",
         "database": "Suggested database for this option or null if needs further processing"
       }
     ]
   }

Now analyze the user's query and either return a single database name (usa4_new_v2, otc1_new_v2, eap1_new_v2, deez_3_v3) as a simple string OR return the follow-up JSON object for cases requiring clarification.`;

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
  }

  try {
    const { description, followUpResponse } = await request.json();

    if (!description) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
    }

    // Step 1: Determine database recommendation or follow-up needs
    let dbRecommendation = null;
    let requiresFollowUp = false;
    let followUpOptions = null;
    let followUpMessage = null;

    // Only perform database selection if there's no follow-up response
    // If there is a follow-up response, we've already done this step
    if (!followUpResponse) {
      const dbSelectionResult = await determineDatabase(description);
      
      // Check if the response is a follow-up request or a direct database recommendation
      if (typeof dbSelectionResult === 'string') {
        // It's a simple database name
        dbRecommendation = dbSelectionResult;
      } else if (dbSelectionResult.requiresFollowUp) {
        // It requires follow-up
        requiresFollowUp = true;
        followUpMessage = dbSelectionResult.message;
        followUpOptions = dbSelectionResult.options;
        
        // Return early with the follow-up request
        return NextResponse.json({
          requiresFollowUp,
          message: followUpMessage,
          options: followUpOptions,
          stage: "database-selection"
        });
      }
    }

    // Step 2: Check if the query might contain additional filter criteria (beyond job title, industry, location)
    // This is an asynchronous call but we'll process it in parallel with other extractions
    let additionalFiltersPromise = null;
    if (dbRecommendation === "usa4_new_v2" || !dbRecommendation) {
      // Only call the additional filters API for USA database (or if we're defaulting to it)
      additionalFiltersPromise = fetchAdditionalFilters(description);
    }

    // Step 3: Extract information based on database type
    let extractionResponse = {};
    
    // For deez_3_v3 (businesses), extract business categories
    if (dbRecommendation === "deez_3_v3") {
      extractionResponse = await extractBusinessCategories(description);
    } else {
      // For all other databases (professionals), extract job titles, industry keywords, and location in parallel
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
      
      // Step 4: Verification steps - we'll skip job title verification but keep others
      const verificationPromises = [];
      
      // Step 5: If industry keywords were extracted, verify them against the database
      if (extractionResponse.industryKeywords && extractionResponse.industryKeywords.length > 0) {
        verificationPromises.push(verifyIndustryKeywords(extractionResponse.industryKeywords));
      }
      
      // Step 6: If location was extracted, verify it against the database
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
          ...extractionResponse,
          // Set titleMatches to empty array to indicate no database matching was done
          titleMatches: [],
          // Add the database recommendation (but still using USA database)
          recommendedDatabase: dbRecommendation,
          actualDatabase: "usa4_new_v2" // We always use USA database regardless of recommendation
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
        
        // Wait for additional filters to complete if it was requested
        if (additionalFiltersPromise) {
          try {
            const additionalFiltersResponse = await additionalFiltersPromise;
            
            // Add additional filters data to the combined results if there are any
            if (additionalFiltersResponse && additionalFiltersResponse.hasAdditionalFilters) {
              combinedResults.additionalFilters = additionalFiltersResponse.additionalFilters;
              combinedResults.additionalFiltersMessage = additionalFiltersResponse.message;
              combinedResults.hasAdditionalFilters = true;
            } else {
              combinedResults.additionalFilters = [];
              combinedResults.hasAdditionalFilters = false;
            }
          } catch (error) {
            console.error("Error fetching additional filters:", error);
            combinedResults.additionalFilters = [];
            combinedResults.hasAdditionalFilters = false;
            combinedResults.additionalFiltersError = "Failed to process additional filter criteria.";
          }
        }
        
        return NextResponse.json(combinedResults);
      }
    }

    // Combine and return all results with empty titleMatches to indicate no verification
    const finalResponse = {
      ...extractionResponse,
      titleMatches: [],
      // Add the database recommendation (but still using USA database)
      recommendedDatabase: dbRecommendation,
      actualDatabase: "usa4_new_v2" // We always use USA database regardless of recommendation
    };
    
    // Wait for additional filters to complete if it was requested
    if (additionalFiltersPromise) {
      try {
        const additionalFiltersResponse = await additionalFiltersPromise;
        
        // Add additional filters data to the response if there are any
        if (additionalFiltersResponse && additionalFiltersResponse.hasAdditionalFilters) {
          finalResponse.additionalFilters = additionalFiltersResponse.additionalFilters;
          finalResponse.additionalFiltersMessage = additionalFiltersResponse.message;
          finalResponse.hasAdditionalFilters = true;
        } else {
          finalResponse.additionalFilters = [];
          finalResponse.hasAdditionalFilters = false;
        }
      } catch (error) {
        console.error("Error fetching additional filters:", error);
        finalResponse.additionalFilters = [];
        finalResponse.hasAdditionalFilters = false;
        finalResponse.additionalFiltersError = "Failed to process additional filter criteria.";
      }
    }
    
    return NextResponse.json(finalResponse);

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

// Helper function to call the additional filters extraction API
async function fetchAdditionalFilters(description) {
  try {
    // We need to use direct API access since this is a server-side API call
    const response = await fetch(new URL('/api/ai/extract-usa4-additional-filters', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch additional filters:", error);
    throw error;
  }
}

// New function to determine which database to use or if follow-up is needed
async function determineDatabase(description) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-2025-04-14",
      messages: [
        { role: "system", content: DB_SELECTION_PROMPT },
        { role: "user", content: description }
      ],
      max_tokens: 500,
      temperature: 0,
    });

    const content = completion.choices[0].message.content.trim();
    
    // Try to parse the response as JSON for follow-up cases
    try {
      const jsonResponse = JSON.parse(content);
      
      // If it's a valid follow-up JSON structure
      if (jsonResponse.requiresFollowUp && jsonResponse.message && Array.isArray(jsonResponse.options)) {
        return jsonResponse;
      }
    } catch (e) {
      // Not JSON, assume it's a simple database name
      return content.toLowerCase().trim();
    }
    
    // If parsing fails but it's not a simple string either, default to USA database
    return "usa4_new_v2";
  } catch (error) {
    console.error('Error in database selection:', error);
    // Default to USA database in case of any errors
    return "usa4_new_v2";
  }
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