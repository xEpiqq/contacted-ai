import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextResponse } from 'next/server';


const DATABASE_MAPPINGS = {
  "usa4_new_v2": {
    jobTitleColumn: "Job title",
    locationColumns: ["Location", "Locality", "Region", "Postal Code", "Metro"],
    industryColumn: "Industry",
    additionalFiltersRoute: "/api/ai/extract-usa4-additional-filters",
    locationPrompt: `
      FOR LOCATION (USA Professionals Database):
      Available columns: Locality (96.0%), Region (96.3%), Metro (81.9%), Postal Code (21.6%)
      - Extract city, state, country components using clean, simple terms
      - For multiple cities: combine with "or" (e.g., "New York or Los Angeles") → maps to Locality column
      - For multiple states: combine with "or" (e.g., "California or Texas") → maps to Region column  
      - If user specifies just "United States" without city/state, still extract as country (no filter will be applied)
      - AVOID postal codes unless specifically requested (low coverage)
      - Set hasLocation to true if any location is mentioned, false otherwise
    `
  },
  "eap1_new_v2": {
    jobTitleColumn: "person_title",
    locationColumns: ["person_location_city", "person_location_state", "person_location_country", "person_location_postal_code"],
    industryColumn: "person_detailed_function",
    additionalFiltersRoute: "/api/ai/extract-eap1-additional-filters",
    locationPrompt: `
      FOR LOCATION (Global B2B Contacts Database):
      Available columns: person_location_city, person_location_state, person_location_country, person_location_postal_code
      - Extract city, state, country components using clean, simple terms
      - Focus on country-level filtering for international contacts
      - Cities and states when specified for better targeting
      - Set hasLocation to true if any location is mentioned, false otherwise
    `
  },
  "otc1_new_v2": {
    jobTitleColumn: "job_title",
    locationColumns: ["location", "locality", "region", "location_country"],
    industryColumn: "industry",
    additionalFiltersRoute: "/api/ai/extract-otc1-additional-filters",
    locationPrompt: `
      FOR LOCATION (International Professionals Database):
      Available columns: location, locality, region, location_country
      - Extract city, state, country components using clean, simple terms
      - Focus on country-level filtering for international professionals
      - Use locality for cities, location_country for countries
      - Set hasLocation to true if any location is mentioned, false otherwise
    `
  },
  "deez_3_v3": {
    jobTitleColumn: null, // Local businesses don't have individual job titles
    businessTypeColumn: "search_keyword", // For business types instead of job titles
    locationColumns: ["location", "locality", "region"],
    industryColumn: "category",
    additionalFiltersRoute: "/api/ai/extract-deez-additional-filters",
    locationPrompt: `
      FOR LOCATION (US Local Businesses Database):
      Available columns: location, locality, region
      - Extract city, state, country components using clean, simple terms
      - Focus on city/locality for local business targeting
      - Use region for state-level filtering
      - Set hasLocation to true if any location is mentioned, false otherwise
    `
  }
};

// Database selection schema
const DatabaseSelectionSchema = z.object({
  needsFollowUp: z.boolean(),
  followUpReason: z.string().optional(),
  database: z.enum(['usa4_new_v2', 'otc1_new_v2', 'eap1_new_v2', 'deez_3_v3']).optional(),
  needsAdditionalFilters: z.boolean().optional()
});

// Extraction schema
const ExtractionSchema = z.object({
  jobTitles: z.array(z.string()),
  industryKeywords: z.array(z.string()),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  hasLocation: z.boolean()
});



// Helper function to call the appropriate additional filters extraction API
async function fetchAdditionalFilters(description, route) {
  const response = await fetch(new URL(route, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ description }),
  });
  
  return await response.json();
}

// Helper function to create location filters specifically for usa4_new_v2
function createUSA4LocationFilters(extraction) {
  const locationFilters = [];
  
  // Don't add location filters if no location was extracted
  if (!extraction.hasLocation) {
    return locationFilters;
  }
  
  const city = extraction.city?.toLowerCase().trim();
  const state = extraction.state?.toLowerCase().trim(); 
  const country = extraction.country?.toLowerCase().trim();
  
  // Rule: If they specify "united states", don't add additional filter since usa4 database selection is sufficient
  if (country === 'united states' || country === 'usa' || country === 'us') {
    // Only add state/city if they specified more specific location
    if (!city && !state) {
      return locationFilters; // Just "united states" - no additional filter needed
    }
  }
  
  // Handle city/cities - map to Locality column (96.0% coverage)
  if (city) {
    // Handle multiple cities (e.g., "New York or Los Angeles")
    const cities = city.split(/\s+(?:or|and)\s+|\s*,\s*/)
      .map(c => c.trim())
      .filter(c => c.length > 0);
    
    if (cities.length > 0) {
      locationFilters.push({
        column: "Locality",
        tokens: cities
      });
    }
  }
  
  // Handle state/states - map to Region column (96.3% coverage) 
  if (state) {
    // Handle multiple states (e.g., "California or Texas")
    const states = state.split(/\s+(?:or|and)\s+|\s*,\s*/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    if (states.length > 0) {
      locationFilters.push({
        column: "Region", 
        tokens: states
      });
    }
  }
  
  // Note: We don't use Postal Code unless specifically requested (21.6% coverage)
  // Note: We don't use Metro automatically - it's similar to Location but with different format
  
  return locationFilters;
}

// Helper function to create location filters for eap1_new_v2 (Global B2B Contacts)
function createEAP1LocationFilters(extraction) {
  const locationFilters = [];
  
  if (!extraction.hasLocation) {
    return locationFilters;
  }
  
  const city = extraction.city?.toLowerCase().trim();
  const state = extraction.state?.toLowerCase().trim(); 
  const country = extraction.country?.toLowerCase().trim();
  
  // For global B2B, prioritize country-level filtering
  if (country) {
    locationFilters.push({
      column: "person_location_country",
      tokens: [country]
    });
  }
  
  // Add state if specified
  if (state) {
    locationFilters.push({
      column: "person_location_state",
      tokens: [state]
    });
  }
  
  // Add city if specified
  if (city) {
    const cities = city.split(/\s+(?:or|and)\s+|\s*,\s*/)
      .map(c => c.trim())
      .filter(c => c.length > 0);
    
    if (cities.length > 0) {
      locationFilters.push({
        column: "person_location_city",
        tokens: cities
      });
    }
  }
  
  return locationFilters;
}

// Helper function to create location filters for otc1_new_v2 (International Professionals)
function createOTC1LocationFilters(extraction) {
  const locationFilters = [];
  
  if (!extraction.hasLocation) {
    return locationFilters;
  }
  
  const city = extraction.city?.toLowerCase().trim();
  const state = extraction.state?.toLowerCase().trim(); 
  const country = extraction.country?.toLowerCase().trim();
  
  // For international professionals, prioritize country
  if (country) {
    locationFilters.push({
      column: "location_country",
      tokens: [country]
    });
  }
  
  // Add locality (city) if specified
  if (city) {
    const cities = city.split(/\s+(?:or|and)\s+|\s*,\s*/)
      .map(c => c.trim())
      .filter(c => c.length > 0);
    
    if (cities.length > 0) {
      locationFilters.push({
        column: "locality",
        tokens: cities
      });
    }
  }
  
  // Add region (state) if specified
  if (state) {
    const states = state.split(/\s+(?:or|and)\s+|\s*,\s*/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    if (states.length > 0) {
      locationFilters.push({
        column: "region",
        tokens: states
      });
    }
  }
  
  return locationFilters;
}

// Helper function to create location filters for deez_3_v3 (US Local Businesses)
function createDEEZLocationFilters(extraction) {
  const locationFilters = [];
  
  if (!extraction.hasLocation) {
    return locationFilters;
  }
  
  const city = extraction.city?.toLowerCase().trim();
  const state = extraction.state?.toLowerCase().trim(); 
  const country = extraction.country?.toLowerCase().trim();
  
  // For local businesses, focus on city/locality first
  if (city) {
    const cities = city.split(/\s+(?:or|and)\s+|\s*,\s*/)
      .map(c => c.trim())
      .filter(c => c.length > 0);
    
    if (cities.length > 0) {
      locationFilters.push({
        column: "locality",
        tokens: cities
      });
    }
  }
  
  // Add region (state) if specified
  if (state) {
    const states = state.split(/\s+(?:or|and)\s+|\s*,\s*/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    if (states.length > 0) {
      locationFilters.push({
        column: "region",
        tokens: states
      });
    }
  }
  
  return locationFilters;
}

// Helper function to create pre-formatted filters from AI extraction results
function createFiltersFromExtraction(extraction, locationInfo, dbConfig, database, additionalFilters = []) {
  const filters = [];
  
  // Job Titles / Business Types
  if (database === "deez_3_v3") {
    // For local businesses, use businessTypes with businessTypeColumn
    if (extraction.jobTitles && extraction.jobTitles.length > 0 && dbConfig.businessTypeColumn) {
      filters.push({
        column: dbConfig.businessTypeColumn,
        condition: "contains",
        tokens: extraction.jobTitles, // AI uses jobTitles field for business types too
        pendingText: "",
        subop: filters.length === 0 ? "" : "AND"
      });
    }
  } else {
    // For professional databases, use jobTitles
    if (extraction.jobTitles && extraction.jobTitles.length > 0 && dbConfig.jobTitleColumn) {
      filters.push({
        column: dbConfig.jobTitleColumn,
        condition: "contains",
        tokens: extraction.jobTitles,
        pendingText: "",
        subop: filters.length === 0 ? "" : "AND"
      });
    }
  }
  
  // Industry Keywords (skip for DEEZ since business types are handled above)
  if (database !== "deez_3_v3" && extraction.industryKeywords && extraction.industryKeywords.length > 0 && dbConfig.industryColumn) {
    filters.push({
      column: dbConfig.industryColumn,
      condition: "contains", 
      tokens: extraction.industryKeywords,
      pendingText: "",
      subop: filters.length === 0 ? "" : "AND"
    });
  }
  
  // Location Info
  if (database === "usa4_new_v2") {
    // Use specialized USA4 location handling
    const usa4LocationFilters = createUSA4LocationFilters(extraction);
    usa4LocationFilters.forEach(locationFilter => {
      filters.push({
        column: locationFilter.column,
        condition: "contains",
        tokens: locationFilter.tokens,
        pendingText: "",
        subop: filters.length === 0 ? "" : "AND"
      });
    });
  } else if (database === "eap1_new_v2") {
    const eap1LocationFilters = createEAP1LocationFilters(extraction);
    eap1LocationFilters.forEach(locationFilter => {
      filters.push({
        column: locationFilter.column,
        condition: "contains",
        tokens: locationFilter.tokens,
        pendingText: "",
        subop: filters.length === 0 ? "" : "AND"
      });
    });
  } else if (database === "otc1_new_v2") {
    const otc1LocationFilters = createOTC1LocationFilters(extraction);
    otc1LocationFilters.forEach(locationFilter => {
      filters.push({
        column: locationFilter.column,
        condition: "contains",
        tokens: locationFilter.tokens,
        pendingText: "",
        subop: filters.length === 0 ? "" : "AND"
      });
    });
  } else if (database === "deez_3_v3") {
    const deezLocationFilters = createDEEZLocationFilters(extraction);
    deezLocationFilters.forEach(locationFilter => {
      filters.push({
        column: locationFilter.column,
        condition: "contains",
        tokens: locationFilter.tokens,
        pendingText: "",
        subop: filters.length === 0 ? "" : "AND"
      });
         });
   }
  
  // Additional Filters
  if (additionalFilters && additionalFilters.length > 0) {
    additionalFilters.forEach(filter => {
      filters.push({
        column: filter.column,
        condition: "contains",
        tokens: Array.isArray(filter.values) ? filter.values : [filter.values],
        pendingText: "",
        subop: filters.length === 0 ? "" : "AND"
      });
    });
  }
  
  // If no filters were created, add an empty one
  if (filters.length === 0) {
    filters.push({
      column: "",
      condition: "contains",
      tokens: [],
      pendingText: "",
      subop: ""
    });
  }
  
  return filters;
}

// Database-specific extraction prompts
function getExtractionPrompt(database) {
  let basePrompt;
  
  if (database === "deez_3_v3") {
    // Local businesses prompt
    basePrompt = `
      You are a content extractor for local business searches. Extract relevant search criteria from the user's query. When generating keywords,
      keep in mind that all of the local business data was scraped from google maps.

      Extract core business type keywords that would help find local businesses. Focus on the service/business type, not full phrases.
      Examples: "solar companies" → ["solar"], "auto repair shops" → ["auto repair"], "restaurants" → ["restaurant"]
      Guidelines: Remove generic words like "companies", "businesses", "shops". Keep specific descriptors. Use 1-5 keywords max.

      FOR INDUSTRY KEYWORDS:
      Skip industry keywords for local businesses - business types cover this. Return empty array.
    `;
  } else {
    // Professionals prompt  
    basePrompt = `
      You are a content extractor. Extract relevant search criteria from the user's query.

      FOR JOB TITLES:
      Translate the query into job title keywords for searching LinkedIn users. Generate terms that would appear as actual professional titles. Aim for 10 keywords max. Use "contains" search logic - avoid redundant terms.

      FOR INDUSTRY KEYWORDS:
      Extract 1-2 industry keywords (preferably 1 word) that represent the industry the user is targeting. Only if explicitly stated/implied. Don't be redundant with job titles.

      Where relevant is key. Don't be redundant (producing industry keyword where search would clearly be covered by job title alone)

      If i was looking for "carpenters" for example, job titles would be sufficient, and the industry keyword "carpentry" would be redundant. If industry explicitly stated / implied, then go ahead.
    `;
  }

  // Get location prompt from database mappings
  const dbConfig = DATABASE_MAPPINGS[database] || DATABASE_MAPPINGS["usa4_new_v2"];
  const locationPrompt = dbConfig.locationPrompt || "";

  return basePrompt + locationPrompt + `

    Return jobTitles array, industryKeywords array, city, state, country, and hasLocation boolean.
  `;
}

export async function POST(request) {
  const { description } = await request.json();

    // Step 1: Database Selection
    const { object: dbSelection } = await generateObject({
      model: openai('gpt-4.1'),
      schema: DatabaseSelectionSchema,
      system: `
        CRITICAL FIELD RULES:
        - If needsFollowUp = true: ONLY return needsFollowUp and followUpReason (omit database and needsAdditionalFilters)
        - If needsFollowUp = false: ONLY return needsFollowUp, database, and needsAdditionalFilters (omit followUpReason)

        DATABASES:
        - usa4_new_v2: US professionals
        - otc1_new_v2: International professionals  
        - eap1_new_v2: Global B2B contacts
        - deez_3_v3: US local businesses
Okay so
        SET needsFollowUp = true if: B2C data requests, non-US local businesses, or unclear professional vs business type (eg "solar contacts")
        Make the follow up reason short, concise, simple, actionable, friendly, no jargon, 1 sentence. Reject b2c data requests and non-us local biz requests.
        ask for clarification in other cases.

        For normal queries: Select database + set needsAdditionalFilters = true if query has gender/company size/skills/experience, etc, requirements beyond basic job/industry/location
        also, frequently, the user may be looking for people that work at a specific company. This would be a good additional filter.
        `,
      prompt: `USERS QUERY: "${description}"`,
      temperature: 0
    });

  // If follow-up is needed, return early with follow-up reason
  if (dbSelection.needsFollowUp) {
    return NextResponse.json({
      needsFollowUp: true,
      followUpReason: dbSelection.followUpReason
    });
  }

  // Get database-specific column configuration
  const dbConfig = DATABASE_MAPPINGS[dbSelection.database];

  // Step 2: Content Extraction
  const { object: extraction } = await generateObject({
    model: openai('gpt-4.1'),
    schema: ExtractionSchema,
    system: getExtractionPrompt(dbSelection.database),
    prompt: `USERS QUERY: "${description}"`,
    temperature: 0.3
  });

  // Location validation no longer needed - all databases now have specialized handlers
  let locationInfo = {
    hasLocation: false,
    components: { city: "", state: "", zip: "", country: "", region: "" },
    locationFilters: []
  };

  // Build the base response
  let combinedResults = {
    needsFollowUp: false,
    database: dbSelection.database,
    recommendedDatabase: dbSelection.database,
    actualDatabase: dbSelection.database,
    filters: [],
    hasAdditionalFilters: false,
    additionalFiltersMessage: null
  };

  // Step 3: Fetch additional filters if database selection indicates they're needed
  let additionalFiltersData = [];
  if (dbSelection.needsAdditionalFilters) {
    const additionalFiltersResponse = await fetchAdditionalFilters(description, dbConfig.additionalFiltersRoute);
    
    // Add additional filters data to the combined results if there are any
    if (additionalFiltersResponse && additionalFiltersResponse.hasAdditionalFilters) {
      additionalFiltersData = additionalFiltersResponse.additionalFilters;
      combinedResults.additionalFiltersMessage = additionalFiltersResponse.message;
      combinedResults.hasAdditionalFilters = true;
    }
  }

  // Create pre-formatted filters using the helper function
  combinedResults.filters = createFiltersFromExtraction(
    extraction, 
    locationInfo, 
    dbConfig, 
    dbSelection.database, 
    additionalFiltersData
  );

  return NextResponse.json(combinedResults);
}