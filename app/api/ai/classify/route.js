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

    const targetTypeTools = [{
      type: "function",
      function: {
        name: "determine_target_type",
        description: "Determines if the user is looking for local businesses or individual people as their target audience.",
        parameters: {
          type: "object",
          properties: {
            target_type: {
              type: "string",
              enum: ["people", "local_businesses"],
              description: "Whether the target audience consists of individual people or local businesses"
            },
            confidence: {
              type: "number",
              description: "Confidence level in the classification, from 0.0 to 1.0"
            }
          },
          required: ["target_type", "confidence"],
        }
      }
    }];

    const targetTypeSystemPrompt = `You are an expert assistant that determines whether a user's target audience description refers to individual people (like professionals on LinkedIn) or local businesses (like car dealerships, restaurants, etc.).
If the description mentions professional roles, job titles, or individuals, classify as "people".
If the description mentions business establishments, stores, companies, or service providers, classify as "local_businesses".
If unclear, use your best judgment based on context clues.`;
    
    const targetTypeResponse = await openai.chat.completions.create({
      model: "gpt-4.1-2025-04-14",
      messages: [
        { role: "system", content: targetTypeSystemPrompt },
        { role: "user", content: `Please determine if the following target audience description refers to individual people or local businesses: "${description}"` }
      ],
      tools: targetTypeTools,
      tool_choice: { type: "function", function: { name: "determine_target_type" } },
    });

    const targetTypeMessage = targetTypeResponse.choices[0].message;
    if (targetTypeMessage.tool_calls && targetTypeMessage.tool_calls.length > 0) {
      const toolCall = targetTypeMessage.tool_calls[0];
      if (toolCall.function.name === "determine_target_type") {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          return NextResponse.json({
            targetType: args.target_type,
            targetTypeConfidence: args.confidence
          });
        } catch (e) {
          console.error("Error parsing target type function arguments:", e);
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