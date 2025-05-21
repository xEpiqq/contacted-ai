import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert system that helps users determine which database would be most appropriate for their search query.
You must choose between two databases:

## DATABASE OPTIONS

1. **USA4_NEW_V2 (US Professionals Database)**
   - Contains: Individual professionals located in the United States
   - Best for: Finding specific professionals by job title, industry, or location within the US
   - Key fields: Job titles, skills, emails, LinkedIn profiles
   - Example queries: "Marketing directors in Chicago", "Software engineers in California with Python skills"

2. **DEEZ_3_V3 (US Local Businesses Database)**
   - Contains: Local businesses primarily within the United States
   - Best for: Finding local business establishments by category and location
   - Key fields: Business name, category, address, phone, website, reviews
   - Example queries: "Plumbers in Boston", "Italian restaurants in San Francisco with good reviews"

## RULES FOR SELECTION

1. For queries about INDIVIDUAL PROFESSIONALS in the US, select USA4_NEW_V2
   - Examples: "Dentists in New York", "Marketing managers in Texas", "Software developers in California"

2. For queries about LOCAL BUSINESSES or ESTABLISHMENTS in the US, select DEEZ_3_V3
   - Examples: "Auto repair shops in Chicago", "Coffee shops in Seattle", "Law firms in Miami"

## RESPONSE FORMAT

You MUST respond with a valid JSON object with the following structure:
{
  "database": "usa4_new_v2" OR "deez_3_v3",
  "explanation": "Brief explanation of why this database was selected"
}`;

export async function POST(request) {
  try {
    const requestData = await request.json();
    const { userQuery } = requestData;
    
    if (!userQuery || userQuery.trim() === '') {
      return NextResponse.json(
        { error: 'User query is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    
    // Define the function calling structure
    const tools = [{
      type: "function",
      function: {
        name: "select_database",
        description: "Selects the most appropriate database for the user's query",
        parameters: {
          type: "object",
          properties: {
            database: {
              type: "string",
              enum: ["usa4_new_v2", "deez_3_v3"],
              description: "The selected database"
            },
            explanation: {
              type: "string",
              description: "Brief explanation for why this database was selected"
            }
          },
          required: ["database", "explanation"]
        }
      }
    }];
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-2025-04-14",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userQuery }
      ],
      temperature: 0.1,
      tools: tools,
      tool_choice: { type: "function", function: { name: "select_database" } }
    });

    const message = completion.choices[0].message;
    const processingTime = Date.now() - startTime;
    
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      if (toolCall.function.name === "select_database") {
        try {
          const result = JSON.parse(toolCall.function.arguments);
          
          return NextResponse.json({
            response: result,
            database: result.database,
            explanation: result.explanation,
            processingTime
          });
        } catch (error) {
          console.error('Error parsing function arguments:', error);
          return NextResponse.json(
            { error: 'Failed to parse result', details: error.message },
            { status: 500 }
          );
        }
      }
    }
    
    return NextResponse.json(
      { error: 'OpenAI did not return the expected function call' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error processing database selection query:', error);
    
    return NextResponse.json(
      { error: 'Failed to process the query', details: error.message },
      { status: 500 }
    );
  }
} 