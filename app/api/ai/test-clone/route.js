import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextResponse } from 'next/server';


//1. ADD SUPPORT FOR DEEZ DATABASE (SO FAR JUST OPTIMIZED FOR THE OTHER 3)

//2. GIVE IT TOOL ACCESS (TESTING HOW MANY RESULTS WE GET WITH EACH PART OF THE QUERY)
//3. ABILITY TO REDO THE WHOLE THING WITH NEW CONTEXT (IF THE RESULTS WE GOT ARE TOO SMALL) / ALSO SEE HOW MANY RESULTS
// IT MIGHT GET WITH A DIFFERENT DB (SO MAYBE WE CHOOSE THE DIFFERENT DB INSTEAD)

//4. IMPLEMENT THE LOCATION STUFF FULLY
//5. MAKE SURE THAT VALIDATE LOCATION IS ACTUALLY WORKING PROPERLY (DOUBT IT IS)
// somehow its selecting the proper column name for job title depending on the DB. 
// dont think its handled within this route though... interesting.

//6. Explicity have all cases in which we would need to follow up. Like every possible filter category (factor
// out the sames ones accross db, for example if called "gender" in one db and "sex" in another)

//// VISUAL SHIZ BUT ILL STILL PUT IT IN HERE
// DRAWERS MUST BE A FIXED LENGTH
// CREDITS SCREEN JUST LOOKS BAD
// IF YOU OPEN THE MODAL WITH MANAGE BILLING AND SIGN OUT IT DOES NOT AUTO-CLOSE IF YOU CLICK OFF
// GUIDE COULD USE SOME MORE COMPLETE HELPFUL INFORMATION, AND PERHAPS SHOULD ALWAYS BE OPEN (DOES USER KNOW 
// THEY CAN REQUEST ADDITIONAL INFO AND STUFF? DO THEY KNOW IT MIGHT LIMIT RESULTS THOUGH?)
// ON RESULTS SCREEN: ALL MODALS LOOK BAD AND FILTERS DRAWER IS NOT ABOVE NAV BAR

const DATABASE_MAPPINGS = {
  "usa4_new_v2": {
    locationColumns: ["Location", "Locality", "Region", "Postal Code", "Metro"],
    industryColumn: "Industry",
    additionalFiltersRoute: "/api/ai/extract-usa4-additional-filters"
  },
  "eap1_new_v2": {
    locationColumns: ["person_location_city", "person_location_state", "person_location_country", "person_location_postal_code"],
    industryColumn: "person_detailed_function",
    additionalFiltersRoute: "/api/ai/extract-eap1-additional-filters"
  },
  "otc1_new_v2": {
    locationColumns: ["location", "locality", "region", "location_country"],
    industryColumn: "industry",
    additionalFiltersRoute: "/api/ai/extract-otc1-additional-filters"
  },
  "deez_3_v3": {
    locationColumns: ["location", "locality", "region"],
    industryColumn: "category",
    additionalFiltersRoute: "/api/ai/extract-deez-additional-filters"
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
    system: `
      You are a content extractor. Extract relevant search criteria from the user's query.

      FOR JOB TITLES:
      Translate the query into job title keywords for searching LinkedIn users. Generate terms that would appear as actual professional titles. Aim for 10 keywords max. Use "contains" search logic - avoid redundant terms.

      FOR INDUSTRY KEYWORDS:
      Extract 1-2 industry keywords (preferably 1 word) that represent the industry the user is targeting. Only if explicitly stated/implied. Don't be redundant with job titles.

      Where relevant is key. Don't be redundant (producing industry keyword where search would clearly be covered by job title alone)

      If i was looking for "carpenters" for example, job titles would be sufficient, and the industry keyword "carpentry" would be redundant. If industry explicitly stated / implied, then go ahead.

      FOR LOCATION:
      Extract location components: city, state, country. Use clean, simple terms. Set hasLocation to true if any location is mentioned, false otherwise.

      Return jobTitles array, industryKeywords array, city, state, country, and hasLocation boolean.
      `,
    prompt: `USERS QUERY: "${description}"`,
    temperature: 0.3
  });

  // Validate location if extracted
  let locationInfo = {
    hasLocation: false,
    components: { city: "", state: "", zip: "", country: "", region: "" },
    locationFilters: []
  };

  if (extraction.hasLocation) {
    const locationValidation = await fetch(new URL('/api/ai/validate-location', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        database: dbSelection.database,
        locationColumns: dbConfig.locationColumns,
        locationComponents: {
          city: extraction.city || "",
          state: extraction.state || "",
          country: extraction.country || ""
        }
      })
    });
    
    locationInfo = await locationValidation.json();
  }

  // Build the base response
  let combinedResults = {
    needsFollowUp: false,
    jobTitles: extraction.jobTitles,
    industryKeywords: extraction.industryKeywords,
    locationInfo: locationInfo,
    database: dbSelection.database,
    recommendedDatabase: dbSelection.database,
    actualDatabase: dbSelection.database,
    additionalFilters: [],
    hasAdditionalFilters: false
  };

  // Step 3: Fetch additional filters if database selection indicates they're needed
  if (dbSelection.needsAdditionalFilters) {
    const additionalFiltersResponse = await fetchAdditionalFilters(description, dbConfig.additionalFiltersRoute);
    
    // Add additional filters data to the combined results if there are any
    if (additionalFiltersResponse && additionalFiltersResponse.hasAdditionalFilters) {
      combinedResults.additionalFilters = additionalFiltersResponse.additionalFilters;
      combinedResults.additionalFiltersMessage = additionalFiltersResponse.message;
      combinedResults.hasAdditionalFilters = true;
    }
  }

  return NextResponse.json(combinedResults);
}