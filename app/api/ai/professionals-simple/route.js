import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const CombinedExtractionSchema = z.object({
  jobTitles: z.array(z.string()),
  industryKeywords: z.array(z.string()),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  hasLocation: z.boolean()
});

export async function POST(request) {
  const { description, database, recommendedDatabase } = await request.json();

    const { object } = await generateObject({
    model: openai('gpt-4.1'),
    schema: CombinedExtractionSchema,
    system: `
        You are a triple-purpose extractor. Extract job titles, industry keywords, AND location components from the user's query, where relevant.

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

  if (object.hasLocation) {
    const locationValidation = await fetch(new URL('/api/ai/validate-location', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        database: database,
        locationComponents: {
          city: object.city || "",
          state: object.state || "",
          country: object.country || ""
        }
      })
    });
    
    if (locationValidation.ok) {
      locationInfo = await locationValidation.json();
    }
  }

  return NextResponse.json({
    jobTitles: object.jobTitles,
    industryKeywords: object.industryKeywords,
    locationInfo: locationInfo,
    database: database,
    recommendedDatabase: recommendedDatabase,
    actualDatabase: database,
    additionalFilters: [],
    hasAdditionalFilters: false
  });
} 