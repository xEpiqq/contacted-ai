import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

// Zod schema for additional filters response
const AdditionalFiltersSchema = z.object({
  additionalFilters: z.array(z.object({
    column: z.string(),
    condition: z.string(),
    values: z.array(z.string()),
    coverage: z.number().optional(),
    note: z.string().nullable().optional()
  })),
  hasAdditionalFilters: z.boolean(),
  message: z.string()
});

// Schema information for eap1_new_v2 database with coverage percentages
const EAP1_SCHEMA_INFO = `
Database Schema for EAP1 (Global B2B Contacts Database) with field coverage percentages:

- **person_name (100.0% coverage)**: - Examples: [Phil Vu, Andrea Bloom, Marc Charalambous]
- **person_title (99.0% coverage)**: - Examples: [Director of Tech Support and Customer Service, Sr. Human Resources Manager, Operations manager]
- **person_email (95.6% coverage)**: - Examples: [phil.vu@policymap.com, andrea.bloom@sbdinc.com, marc.charalambous@thepasgroup.com.au]
- **person_phone (82.0% coverage)**: - Examples: [(215) 574-5896, +1 860-225-5111, +61 3 9902 5555]
- **Company Name (100.0% coverage)**: - Examples: [policymap llc, stanley black  decker, the pas group limited]
- **Original Values - [person_linkedin_url] (100.0% coverage)**: - Examples: [http://www.linkedin.com/in/phil-vu-b68b5a3, http://www.linkedin.com/in/andrea-bloom-84602235, http://www.linkedin.com/in/marc-charalambous-2471ba65]
- **current_organization_ids (4.4% coverage)**: - Examples: [['556d782873696411bc7f1a01'], ['54a11fc469702d8ed4dbf601'], ['54a1364869702d3cbb4f3301']]
- **id (100.0% coverage)**: - Examples: [59d2bb78f3e5bb2e259c2d7a, 594d71249d7968d77a08cd02, 5b4d28779be96953d7bc1c95]
- **index (100.0% coverage)**: - Examples: [contacts_v5, people_v7]
- **job_start_date (86.8% coverage)**: - Examples: [2013-10-01, 2010-05-01, 2013-07-01]
- **modality (100.0% coverage)**: - Examples: [contacts, people]
- **person_detailed_function (98.0% coverage)**: - Examples: [tech support customer service, hr, operations]
- **person_email_analyzed (95.6% coverage)**: - Examples: [phil.vu@policymap.com, andrea.bloom@sbdinc.com, marc.charalambous@thepasgroup.com.au]
- **person_email_status_cd (100.0% coverage)**: - Examples: [Verified, Unavailable, Extrapolated]
- **person_excluded_by_team_ids (0.0% coverage)**: - Examples: [No non-blank examples found]
- **person_extrapolated_email_confidence (59.4% coverage)**: - Examples: [0.6, 0.89, 0.88]
- **person_first_name_unanalyzed (100.0% coverage)**: - Examples: [phil, andrea, marc]
- **person_functions (55.0% coverage)**: - Examples: [['support'], ['human_resources'], ['operations']]
- **person_last_name_unanalyzed (100.0% coverage)**: - Examples: [vu, bloom, charalambous]
- **person_linkedin_url (100.0% coverage)**: - Examples: [https://www.linkedin.com/in/phil-vu-b68b5a3, https://www.linkedin.com/in/andrea-bloom-84602235, https://www.linkedin.com/in/marc-charalambous-2471ba65]
- **person_location_city (89.0% coverage)**: - Examples: [Philadelphia, New Baltimore, Melbourne]
- **person_location_city_with_state_or_country (89.0% coverage)**: - Examples: [Philadelphia, Pennsylvania, New Baltimore, Michigan, Melbourne, Australia]
- **person_location_country (97.8% coverage)**: - Examples: [United States, Australia, Brazil]
- **person_location_geojson (3.4% coverage)**: - Examples: [{'type': 'envelope', 'coordinates': [[-90.320515, 38.774349], [-90.166409, 38.5318519]]}, {'type': 'envelope', 'coordinates': [[2.0695258, 41.4695761], [2.2280099, 41.320004]]}, {'type': 'envelope', 'coordinates': [[11.360796, 48.2482197], [11.7228755, 48.0616018]]}]
- **person_location_postal_code (27.6% coverage)**: - Examples: [19107, 32792, 57108]
- **person_location_state (92.2% coverage)**: - Examples: [Pennsylvania, Michigan, Victoria]
- **person_location_state_with_country (92.2% coverage)**: - Examples: [Pennsylvania, US, Michigan, US, Victoria, Australia]
- **person_name_unanalyzed_downcase (100.0% coverage)**: - Examples: [phil vu, andrea bloom, marc charalambous]
- **person_num_linkedin_connections (4.4% coverage)**: - Examples: [369.0, 305.0, 500.0]
- **person_sanitized_phone (80.8% coverage)**: - Examples: [+12155745896, +18602255111, +61399025555]
- **person_seniority (99.0% coverage)**: - Examples: [director, manager, c_suite]
- **person_title_normalized (99.0% coverage)**: - Examples: [director tech support customer service, senior hr manager, operations manager]
- **predictive_scores (2.0% coverage)**: - Examples: [{'551e3ef07261695147160000': 0.9615956074326348}, {'551e3ef07261695147160000': 0.6932234376241984}, {'551e3ef07261695147160000': 0.14860378235268942}]
- **primary_title_normalized_for_faceting (99.0% coverage)**: - Examples: [Director Of Tech Support And Customer Service, Sr. Human Resources Manager, Operations Manager]
- **prospected_by_team_ids (95.8% coverage)**: - Examples: [['59d2b71e9d79686ff4fbc262'], ['590cd9259d7968ae61ca8e1a'], ['59b99d359d7968f8c82eb21f']]
- **random (4.4% coverage)**: - Examples: [0.2777291135862469, 0.1094204026414819, 0.8616356146521866]
- **relavence_boost (4.4% coverage)**: - Examples: [0.591350300563827, 0.972358510195238, 0.8216606101084865]
- **score (100.0% coverage)**: - Examples: [1]
- **type (100.0% coverage)**: - Examples: [contact, person]
`;

// Additional filters extraction system prompt
const ADDITIONAL_FILTERS_PROMPT = `
You are an AI assistant specialized in extracting additional search filters from user descriptions for the EAP1 database (Global B2B Contacts Database).

IMPORTANT: Your task is to ONLY identify and extract parameters BEYOND the "big 3" standard filters:
1. DO NOT extract job titles - these are handled by another system
2. DO NOT extract industry information - these are handled by another system 
3. DO NOT extract location information - these are handled by another system

Focus EXCLUSIVELY on extracting additional filter parameters such as:
- Seniority level (person_seniority)
- Job functions (person_functions, person_detailed_function)
- Company name (Company Name)
- Email status (person_email_status_cd)
- Phone availability
- LinkedIn connections
- Job start date
- Email confidence scores
- Or any other parameters in the schema that are NOT job title, industry, or location

Follow these strict guidelines:
1. Use the MINIMUM number of additional filters needed to satisfy the user's request
2. Prioritize fields with higher coverage percentages when multiple options could satisfy the request
3. For each parameter, provide:
   - The exact database field name from the schema (use the exact case/spelling)
   - The condition type (contains, equals, etc.)
   - The extracted value(s)
4. Only include parameters that are explicitly mentioned or strongly implied in the user's query
5. Do NOT infer parameters that aren't clearly indicated by the user
6. Make sure all parameters extracted are found in the database schema provided
7. For fields with low coverage (<20%), include a warning note about potential limited results

If no additional parameters are identified, return:
{
  "additionalFilters": [],
  "hasAdditionalFilters": false,
  "message": "No additional filter criteria identified beyond job title, industry, and location."
}

If additional parameters are found, return them with proper validation and coverage information.
`;

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
  }

  try {
    const { description } = await request.json();

    if (!description) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
    }

    // Extract additional filters using AI SDK
    const result = await extractAdditionalFilters(description);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('EAP1 Additional filters extraction error:', error);
    let errorMessage = 'Failed to extract additional filters.';
    if (error.response) {
      errorMessage = error.response.data.error.message || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function extractAdditionalFilters(description) {
  const systemPrompt = `${ADDITIONAL_FILTERS_PROMPT}\n\n${EAP1_SCHEMA_INFO}`;

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: AdditionalFiltersSchema,
      system: systemPrompt,
      prompt: `Please analyze this description and extract any additional filter criteria beyond job title, industry, and location: "${description}"`,
      temperature: 0.1
    });

    // Add warning notes for low coverage fields
    const processedFilters = object.additionalFilters.map(filter => {
      if (filter.coverage && filter.coverage < 20 && !filter.note) {
        filter.note = `Low coverage field (${filter.coverage}%) - may result in limited matches`;
      }
      return filter;
    });

    return {
      additionalFilters: processedFilters,
      hasAdditionalFilters: object.hasAdditionalFilters,
      message: object.message
    };
  } catch (error) {
    console.error("Error calling AI SDK:", error);
    // Return a fallback response
    return {
      additionalFilters: [],
      hasAdditionalFilters: false,
      message: "Failed to extract additional filter criteria.",
      error: "Invalid response format from AI service."
    };
  }
} 