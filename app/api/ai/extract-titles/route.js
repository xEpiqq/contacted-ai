import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extracts job titles from a user query
 * POST /api/ai/extract-titles
 * Body: { userQuery: string }
 * Returns: { titles: string[] }
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

    const systemPrompt = `You are an expert assistant that extracts potential job titles from user search queries.
Your task is to identify and generate job titles that would be relevant to the user's search query.

GUIDELINES:
1. Generate at least 5 job titles when possible, up to 10 for broad queries
2. Include variations and related roles that match the query intent
3. Make sure titles are realistic professional job titles that would appear in a database
4. Focus on precise, specific job titles rather than generic descriptions
5. For vague queries, use your knowledge to infer likely job titles
6. Return formal, proper case job titles (e.g., "Sales Manager" not "sales manager")

EXAMPLES:
- Input: "tech companies in california"
  Output: ["Software Engineer", "Product Manager", "Data Scientist", "UX Designer", "DevOps Engineer", "Frontend Developer", "Backend Developer", "QA Engineer"]

- Input: "doctors in new york"
  Output: ["Physician", "Medical Doctor", "Surgeon", "Cardiologist", "Family Doctor", "Internist", "Pediatrician", "Psychiatrist", "Radiologist"]

- Input: "marketing"
  Output: ["Marketing Manager", "Marketing Director", "Marketing Coordinator", "Digital Marketing Specialist", "Content Marketing Manager", "Social Media Manager", "Marketing Analyst", "Brand Manager", "SEO Specialist", "Marketing Consultant"]`;

    // Define the function calling structure
    const tools = [{
      type: "function",
      function: {
        name: "extract_job_titles",
        description: "Extracts relevant job titles from a user query",
        parameters: {
          type: "object",
          properties: {
            titles: {
              type: "array",
              items: {
                type: "string"
              },
              description: "List of job titles extracted from the query"
            }
          },
          required: ["titles"]
        }
      }
    }];
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-2025-04-14",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery }
      ],
      temperature: 0.7, // Higher temperature for more creative title variations
      tools: tools,
      tool_choice: { type: "function", function: { name: "extract_job_titles" } }
    });

    const message = completion.choices[0].message;
    
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      if (toolCall.function.name === "extract_job_titles") {
        try {
          const result = JSON.parse(toolCall.function.arguments);
          return NextResponse.json({ titles: result.titles });
        } catch (error) {
          console.error('Error parsing function arguments:', error);
          return NextResponse.json(
            { error: 'Failed to parse extracted job titles', details: error.message },
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
    console.error('Error extracting job titles:', error);
    
    return NextResponse.json(
      { error: 'Failed to process the query', details: error.message },
      { status: 500 }
    );
  }
} 