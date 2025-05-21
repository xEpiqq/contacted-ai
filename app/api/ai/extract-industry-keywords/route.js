import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extracts industry keywords from a user query
 * POST /api/ai/extract-industry-keywords
 * Body: { userQuery: string }
 * Returns: { keywords: string[] }
 */
export async function POST(request) {
  try {
    const { userQuery } = await request.json();
    
    if (!userQuery || userQuery.trim() === '') {
      return NextResponse.json(
        { error: 'User query is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert assistant that extracts industry keywords from user search queries.
Your task is to identify and generate industry keywords that would be relevant to the user's search query.

GUIDELINES:
1. Generate at least 5 industry keywords when possible, up to 10 for broad queries
2. Include variations and related industries that match the query intent
3. Make sure keywords are realistic industry terms that would appear in a database
4. Focus on precise, specific industries rather than generic descriptions
5. For vague queries, use your knowledge to infer likely industries
6. Return proper case keywords (e.g., "Financial Services" not "financial services")
7. The goal is to come up with as many keywords as possible without veering far from the user's prompt
8. Avoid including results that the user wouldn't want - stay relevant to their query

EXAMPLES:
- Input: "tech companies in california"
  Output: ["Technology", "Software Development", "Information Technology", "SaaS", "Cloud Computing", "Artificial Intelligence", "Fintech", "Cybersecurity"]

- Input: "doctors in new york"
  Output: ["Healthcare", "Medical Services", "Hospitals", "Private Practice", "Medical Research", "Primary Care", "Specialized Medicine"]

- Input: "marketing"
  Output: ["Marketing", "Digital Marketing", "Advertising", "Public Relations", "Market Research", "Brand Management", "Content Marketing", "Social Media Marketing", "Marketing Analytics"]`;

    // Define the function calling structure
    const tools = [{
      type: "function",
      function: {
        name: "extract_industry_keywords",
        description: "Extracts relevant industry keywords from a user query",
        parameters: {
          type: "object",
          properties: {
            keywords: {
              type: "array",
              items: {
                type: "string"
              },
              description: "List of industry keywords extracted from the query"
            }
          },
          required: ["keywords"]
        }
      }
    }];
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-2025-04-14",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery }
      ],
      temperature: 0.7, // Higher temperature for more creative keyword variations
      tools: tools,
      tool_choice: { type: "function", function: { name: "extract_industry_keywords" } }
    });

    const message = completion.choices[0].message;
    
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      if (toolCall.function.name === "extract_industry_keywords") {
        try {
          const result = JSON.parse(toolCall.function.arguments);
          return NextResponse.json({ keywords: result.keywords });
        } catch (error) {
          console.error('Error parsing function arguments:', error);
          return NextResponse.json(
            { error: 'Failed to parse extracted industry keywords', details: error.message },
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
    console.error('Error extracting industry keywords:', error);
    
    return NextResponse.json(
      { error: 'Failed to process the query', details: error.message },
      { status: 500 }
    );
  }
} 