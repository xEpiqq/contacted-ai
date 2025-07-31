import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

// Zod schemas for structured data responses
const JobTitlesSchema = z.object({
  jobTitles: z.array(z.string())
});

const IndustryKeywordsSchema = z.object({
  industryKeywords: z.array(z.string())
});

const LocationComponentsSchema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  hasLocation: z.boolean()
});

const AdditionalFiltersScreeningSchema = z.object({
  needsAdditionalFilters: z.boolean(),
  reasoning: z.string()
});

// Database-specific column mappings
const DATABASE_MAPPINGS = {
  "usa4_new_v2": {
    location: {
      columns: ["Location", "Locality", "Region", "Postal Code", "Metro"],
      systemPrompt: "Extract location components for United States locations only",
      guidelines: [
        "Break down location mentions into component parts: city, state, zip, country, region",
        "For states, use full names (e.g., 'California' not 'CA')",
        "Examples: 'engineers in San Francisco, CA' → city: 'San Francisco', state: 'California'"
      ]
    },
    industry: {
      validationColumn: "Industry",
      systemPrompt: "Extract industry keywords from user search queries focused on business sectors and industries."
    },
    jobTitles: {
      systemPrompt: "Extract job titles for USA professionals database."
    },
    additionalFiltersRoute: "/api/ai/extract-usa4-additional-filters"
  },
  "eap1_new_v2": {
    location: {
      columns: ["person_location_city", "person_location_state", "person_location_country", "person_location_postal_code"],
      systemPrompt: "Extract location components for global B2B contacts",
      guidelines: [
        "Focus on city, state/region, country components",
        "Support international locations",
        "Examples: 'managers in Sydney, Australia' → city: 'Sydney', country: 'Australia'"
      ]
    },
    industry: {
      validationColumn: "person_detailed_function",
      systemPrompt: "Extract industry keywords and job functions for global B2B contacts."
    },
    jobTitles: {
      systemPrompt: "Extract job titles for global B2B contacts and email database."
    },
    additionalFiltersRoute: "/api/ai/extract-eap1-additional-filters"
  },
  "otc1_new_v2": {
    location: {
      columns: ["location", "locality", "region", "location_country"],
      systemPrompt: "Extract location components for international professionals",
      guidelines: [
        "Support international locations with focus on country, region, and locality",
        "Examples: 'engineers in Istanbul, Turkey' → locality: 'Istanbul', country: 'Turkey'"
      ]
    },
    industry: {
      validationColumn: "industry",
      systemPrompt: "Extract industry keywords for international professionals database."
    },
    jobTitles: {
      systemPrompt: "Extract job titles for international professionals database."
    },
    additionalFiltersRoute: "/api/ai/extract-otc1-additional-filters"
  }
};

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
  }

  try {
    const { description, database, followUpResponse, recommendedDatabase } = await request.json();

    if (!description) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
    }

    if (!database) {
      return NextResponse.json({ error: 'Database parameter is required.' }, { status: 400 });
    }

    // Validate database
    const dbConfig = DATABASE_MAPPINGS[database];
    if (!dbConfig) {
      return NextResponse.json({ error: `Unsupported database: ${database}` }, { status: 400 });
    }

    // Step 1: Extract job titles, industry, location, and screen for additional filters in parallel
    const [jobTitlesResponse, industryKeywordsResponse, locationResponse, needsAdditionalFilters] = await Promise.all([
      extractJobTitles(description, dbConfig.jobTitles.systemPrompt),
      extractIndustryKeywords(description, dbConfig.industry.systemPrompt),
      extractLocationInfo(description, dbConfig.location),
      screenForAdditionalFilters(description, database)
    ]);
    
    const extractionResponse = {
      ...jobTitlesResponse,
      ...industryKeywordsResponse,
      ...locationResponse
    };
    
    // Step 2: Build the combined results without database validation
    let combinedResults = {
      ...extractionResponse,
      // Add the database information
      database: database,
      recommendedDatabase: recommendedDatabase,
      actualDatabase: database
    };
    
    // Step 3: Only fetch additional filters if screening indicates they're needed
    if (needsAdditionalFilters) {
      try {
        const additionalFiltersResponse = await fetchAdditionalFilters(description, dbConfig.additionalFiltersRoute);
        
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
    } else {
      // No additional filters needed based on screening
      combinedResults.additionalFilters = [];
      combinedResults.hasAdditionalFilters = false;
    }
    
    return NextResponse.json(combinedResults);

  } catch (error) {
    console.error('Professionals flow error:', error);
    let errorMessage = 'Failed to process your request.';
    if (error.response) {
      errorMessage = error.response.data.error.message || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Helper function to call the appropriate additional filters extraction API
async function fetchAdditionalFilters(description, route) {
  try {
    const response = await fetch(new URL(route, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'), {
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

async function extractJobTitles(description, customSystemPrompt) {
  const systemPrompt = `You are an expert assistant. Your task is to analyze the user's description of their target audience and extract/generate highly relevant job titles.

${customSystemPrompt}

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
10. IMPORTANT: Return ONLY the job title itself - do NOT append organization types or industry information to the title
    - INCORRECT: "Owner, Marketing Agency" (don't include the organization type)
    - CORRECT: "Owner" (just the job title)
    - INCORRECT: "Software Engineer, Fintech" (don't include the industry)
    - CORRECT: "Software Engineer" (just the job title)

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

  try {
    const { object } = await generateObject({
      model: openai('gpt-4.1'),
      schema: JobTitlesSchema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3
    });

    return { jobTitles: object.jobTitles };
  } catch (error) {
    console.error("Error extracting job titles:", error);
    return { jobTitles: [] };
  }
}

async function extractIndustryKeywords(description, customSystemPrompt) {
  const systemPrompt = `You are an expert assistant that extracts industry keywords from user search queries.

${customSystemPrompt}

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
  
  try {
    const { object } = await generateObject({
      model: openai('gpt-4.1'),
      schema: IndustryKeywordsSchema,
      system: systemPrompt,
      prompt: `Please extract ONLY explicitly stated industry keywords from the following description of a target audience (return an empty array if no industries are explicitly mentioned): "${description}"`,
      temperature: 0
    });

    return { industryKeywords: object.industryKeywords };
  } catch (error) {
    console.error("Error extracting industry keywords:", error);
    return { industryKeywords: [] };
  }
}

async function extractLocationInfo(description, locationConfig) {
  const guidelinesText = locationConfig.guidelines.map((g, i) => `${i + 4}. ${g}`).join('\n');
  
  const systemPrompt = `You are an expert assistant that extracts location components from user queries.

${locationConfig.systemPrompt}

GUIDELINES:
1. Break down location mentions into component parts: city, state, zip, country, region
2. For each component, use only the most relevant keyword - avoid long multi-word phrases
3. If no location is mentioned, set hasLocation to false
${guidelinesText}
4. Use proper capitalization and clean, simple terms
5. Don't include additional qualifiers - just the core location term`;

  try {
    const { object } = await generateObject({
      model: openai('gpt-4.1'),
      schema: LocationComponentsSchema,
      system: systemPrompt,
      prompt: `Extract location components from: "${description}"`,
      temperature: 0
    });

    // Build location filters for all available database columns
    const locationFilters = [];
    
    if (object.hasLocation) {
      const availableColumns = locationConfig.columns;
      
      // Map components to appropriate columns based on database
      if (object.city) {
        // Find city-related columns
        const cityColumns = availableColumns.filter(col => 
          col.toLowerCase().includes('city') || 
          col.toLowerCase().includes('locality') ||
          col === 'Location' ||
          col === 'Metro'
        );
        
        cityColumns.forEach(column => {
          locationFilters.push({
            column: column,
            value: object.city,
            type: "city"
          });
        });
      }
      
      if (object.state) {
        // Find state-related columns
        const stateColumns = availableColumns.filter(col => 
          col.toLowerCase().includes('state') || 
          col.toLowerCase().includes('region') ||
          col === 'Location'
        );
        
        stateColumns.forEach(column => {
          locationFilters.push({
            column: column,
            value: object.state,
            type: "state"
          });
        });
      }
      
      if (object.zip) {
        // Find postal code columns
        const zipColumns = availableColumns.filter(col => 
          col.toLowerCase().includes('postal') || 
          col.toLowerCase().includes('zip')
        );
        
        zipColumns.forEach(column => {
          locationFilters.push({
            column: column,
            value: object.zip,
            type: "zip"
          });
        });
      }
      
      if (object.country) {
        // Find country columns
        const countryColumns = availableColumns.filter(col => 
          col.toLowerCase().includes('country')
        );
        
        countryColumns.forEach(column => {
          locationFilters.push({
            column: column,
            value: object.country,
            type: "country"
          });
        });
      }
      
      if (object.region) {
        // Find region/metro columns
        const regionColumns = availableColumns.filter(col => 
          col.toLowerCase().includes('metro') ||
          col.toLowerCase().includes('region') ||
          col === 'Location'
        );
        
        regionColumns.forEach(column => {
          locationFilters.push({
            column: column,
            value: object.region,
            type: "region"
          });
        });
      }
    }
    
    return {
      locationInfo: {
        hasLocation: object.hasLocation,
        components: {
          city: object.city,
          state: object.state,
          zip: object.zip,
          country: object.country,
          region: object.region
        },
        locationFilters: locationFilters
      }
    };
  } catch (error) {
    console.error("Error extracting location info:", error);
    return {
      locationInfo: {
        hasLocation: false,
        components: {},
        locationFilters: []
      }
    };
  }
}

async function screenForAdditionalFilters(description, database) {
  const systemPrompt = `You are an AI assistant that determines whether a user query requires additional filter extraction beyond job titles, industry, and location.

Analyze the user's description and determine if it contains additional criteria that would require specialized filter extraction such as:
- Gender preferences
- Company size requirements
- Specific company names
- Skills or experience requirements
- Education levels
- Seniority levels
- Any other specific attributes beyond the basic job title, industry, and location

Return a boolean indicating whether additional filter extraction is needed, along with brief reasoning.`;

  try {
    const { object } = await generateObject({
      model: openai('gpt-4.1'),
      schema: AdditionalFiltersScreeningSchema,
      system: systemPrompt,
      prompt: `Does this query need additional filter extraction beyond job titles, industry, and location?\n\nQuery: "${description}"`,
      temperature: 0
    });

    return object.needsAdditionalFilters;
  } catch (error) {
    console.error("Error screening for additional filters:", error);
    return false; // Default to not needing additional filters on error
  }
} 