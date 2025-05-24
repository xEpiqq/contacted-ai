import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

// Zod schemas for the response structure
const BusinessTypesSchema = z.object({
  businessTypes: z.array(z.string()),
  message: z.string()
});

const LocationInfoSchema = z.object({
  hasLocation: z.boolean(),
  components: z.object({
    city: z.string().nullable(),
    state: z.string().nullable(),
    zip: z.string().nullable(),
    region: z.string().nullable(),
    country: z.string().nullable()
  }),
  message: z.string()
});

// Business types extraction system prompt
const BUSINESS_TYPES_PROMPT = `
You are an AI assistant specialized in extracting business types and categories from user descriptions for searching the DEEZ local businesses database.

Your task is to identify and extract business type KEYWORDS that would help find relevant local businesses. Focus on extracting the core business type or service, not full phrases.

Examples of good keyword extraction:
- "solar companies" → "solar"
- "car dealerships" → "car dealership" 
- "hair salons" → "hair salon"
- "restaurants in downtown" → "restaurant"
- "auto repair shops" → "auto repair"
- "dental offices" → "dental"
- "fitness centers" → "fitness"
- "coffee shops" → "coffee"
- "clothing stores" → "clothing"
- "real estate agents" → "real estate"

Guidelines:
1. Extract the core business type or service keyword, not the full phrase
2. Remove generic words like "companies", "businesses", "shops" when they don't add meaning
3. Keep specific descriptors that are important (e.g., "auto repair" not just "auto")
4. Be specific rather than generic (e.g., "auto repair" rather than just "automotive") 
5. Return 1-5 of the most relevant business type keywords
6. If no specific business types are mentioned, return an empty array
7. Use singular or common industry terms (e.g., "restaurant" not "restaurants")

Return a JSON object with:
- businessTypes: array of extracted business type keyword strings
- message: brief explanation of what was extracted
`;

// Location extraction system prompt (same as other flows but focused on local business context)
const LOCATION_PROMPT = `
You are an AI assistant specialized in extracting location information from user descriptions for local business searches.

Your task is to identify and extract location components that would help find local businesses in specific areas.

Extract location information in this priority order:
1. City names (e.g., "Boston", "Los Angeles", "Chicago")
2. State names or abbreviations (e.g., "California", "CA", "Texas", "TX")
3. ZIP codes (e.g., "90210", "10001")
4. Regions (e.g., "Bay Area", "Silicon Valley", "Northern California")
5. Country (mainly "US" or "United States" for this database)

Guidelines:
1. Be precise with location names
2. Prioritize specific cities over general regions
3. Include state information when available
4. Extract ZIP codes if mentioned
5. If no location is specified, assume US-wide search
6. Handle common location abbreviations and nicknames

Return a JSON object with:
- hasLocation: boolean indicating if any location was found
- components: object with city, state, zip, region, country fields (null if not found)
- message: brief explanation of what was extracted
`;

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
  }

  try {
    const { description, database } = await request.json();

    if (!description) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
    }

    // Ensure we're using the DEEZ database for local businesses
    const actualDatabase = database || "deez_3_v3";
    if (actualDatabase !== "deez_3_v3") {
      return NextResponse.json({ 
        error: 'Local businesses flow only supports deez_3_v3 database.' 
      }, { status: 400 });
    }

    // Extract business types (parallel processing)
    const [businessTypesResult, locationResult, additionalFiltersResult] = await Promise.all([
      extractBusinessTypes(description),
      extractLocationInfo(description),
      callAdditionalFiltersAPI(description)
    ]);

    // Build the complete response
    const response = {
      // Use businessTypes instead of jobTitles for local businesses
      businessTypes: businessTypesResult.businessTypes || [],
      
      // Keep locationInfo structure consistent with other flows
      locationInfo: locationResult,
      
      // Additional filters from the DEEZ-specific extractor
      hasAdditionalFilters: additionalFiltersResult.hasAdditionalFilters || false,
      additionalFilters: additionalFiltersResult.additionalFilters || [],
      
      // Database information
      actualDatabase: actualDatabase,
      recommendedDatabase: actualDatabase,
      
      // Processing messages
      messages: {
        businessTypes: businessTypesResult.message,
        location: locationResult.message,
        additionalFilters: additionalFiltersResult.message
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Local businesses flow error:', error);
    let errorMessage = 'Failed to process local businesses request.';
    if (error.response) {
      errorMessage = error.response.data.error.message || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Function to extract business types
async function extractBusinessTypes(description) {
  try {
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: BusinessTypesSchema,
      system: BUSINESS_TYPES_PROMPT,
      prompt: `Extract business types and categories from this description for local business search:\n\n"${description}"`,
      temperature: 0.1
    });

    return object;
  } catch (error) {
    console.error("Error extracting business types:", error);
    return {
      businessTypes: [],
      message: "Failed to extract business types."
    };
  }
}

// Function to extract location information
async function extractLocationInfo(description) {
  try {
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: LocationInfoSchema,
      system: LOCATION_PROMPT,
      prompt: `Extract location information from this description for local business search:\n\n"${description}"`,
      temperature: 0.1
    });

    return object;
  } catch (error) {
    console.error("Error extracting location info:", error);
    return {
      hasLocation: false,
      components: {
        city: null,
        state: null,
        zip: null,
        region: null,
        country: null
      },
      message: "Failed to extract location information."
    };
  }
}

// Function to call the DEEZ additional filters API
async function callAdditionalFiltersAPI(description) {
  try {
    const response = await fetch(new URL('/api/ai/extract-deez-additional-filters', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Additional filters API failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to call additional filters API:', error);
    return {
      additionalFilters: [],
      hasAdditionalFilters: false,
      message: "Failed to extract additional filter criteria."
    };
  }
} 