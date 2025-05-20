import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
  }

  try {
    const { description } = await request.json();

    if (!description) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
    }

    const businessCategoryTools = [{
      type: "function",
      function: {
        name: "extract_business_categories",
        description: "Extracts business categories and location keywords for local businesses.",
        parameters: {
          type: "object",
          properties: {
            business_categories: {
              type: "array",
              items: { "type": "string" },
              description: "A list of business categories like 'Restaurants', 'Auto Repair', 'Dental Clinics', etc."
            },
            location_keywords: {
              type: "array",
              items: { "type": "string" },
              description: "A list of relevant location or geographical keywords for the target audience."
            }
          },
          required: ["business_categories", "location_keywords"],
        }
      }
    }];

    const businessCategoryPrompt = `You are an expert assistant. Your task is to analyze the user's description of their target audience for local businesses and extract specific business categories and location keywords.
Focus on identifying concrete business types and geographical indicators. For example, if the user says "car dealerships in San Francisco", business categories would be "Car Dealerships", "Auto Sales" and location keywords would be "San Francisco", "Bay Area".
If the user says "restaurants in college towns", business categories could be "Restaurants", "Cafes", "Dining Establishments" and location keywords "College Towns", "University Areas".
Be comprehensive but ensure the extracted terms are directly supported by the user's input.`;
    
    const businessUserPrompt = `Please extract business categories and location keywords from the following description of local businesses: "${description}"`;

    const businessResponse = await openai.chat.completions.create({
      model: "gpt-4.1-2025-04-14",
      messages: [
        { role: "system", content: businessCategoryPrompt },
        { role: "user", content: businessUserPrompt }
      ],
      tools: businessCategoryTools,
      tool_choice: { type: "function", function: { name: "extract_business_categories" } },
    });

    const businessMessage = businessResponse.choices[0].message;

    if (businessMessage.tool_calls && businessMessage.tool_calls.length > 0) {
      const toolCall = businessMessage.tool_calls[0];
      if (toolCall.function.name === "extract_business_categories") {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          return NextResponse.json({
            businessCategories: args.business_categories || [],
            locationKeywords: args.location_keywords || []
          });
        } catch (e) {
          console.error("Error parsing business categories function arguments:", e);
          return NextResponse.json({ error: 'Failed to parse OpenAI function arguments.' }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ error: 'OpenAI did not return the expected function call.' }, { status: 500 });

  } catch (error) {
    console.error('OpenAI API error:', error);
    let errorMessage = 'Failed to process your request with OpenAI.';
    if (error.response) {
      errorMessage = error.response.data.error.message || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 