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

// Additional filters extraction system prompt  
const ADDITIONAL_FILTERS_PROMPT = `
You are an AI assistant specialized in extracting additional search filters from user descriptions for the OTC1 database (International Professionals Database).

IMPORTANT: Your task is to ONLY identify and extract parameters BEYOND the "big 3" standard filters:
1. DO NOT extract job titles - these are handled by another system
2. DO NOT extract industry information - these are handled by another system 
3. DO NOT extract location information - these are handled by another system

Focus EXCLUSIVELY on extracting additional filter parameters such as:
- Gender
- Company size
- Company name  
- Skills
- Experience level
- Seniority
- Education
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

The response should be a JSON object with an "additionalFilters" array containing the identified parameters.

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
    console.error('OTC1 Additional filters extraction error:', error);
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
  try {
    const { object } = await generateObject({
      model: openai('gpt-4.1'),
      schema: AdditionalFiltersSchema,
      system: ADDITIONAL_FILTERS_PROMPT,
      prompt: `Please analyze this description and extract any additional filter criteria beyond job title, industry, and location for the OTC1 international professionals database: "${description}"`,
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