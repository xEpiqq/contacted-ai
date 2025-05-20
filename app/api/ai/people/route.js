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

    const tools = [{
      type: "function",
      function: {
        name: "extract_contact_criteria",
        description: "Extracts job titles and industry keywords from a user's description of their target audience.",
        parameters: {
          type: "object",
          properties: {
            job_titles: {
              type: "array",
              items: { "type": "string" },
              description: "A list of relevant job titles for the target audience. Should be specific roles."
            },
            industry_keywords: {
              type: "array",
              items: { "type": "string" },
              description: "A list of relevant industry keywords or sectors for the target audience."
            }
          },
          required: ["job_titles", "industry_keywords"],
        }
      }
    }];

    const systemPrompt = `You are an expert assistant. Your task is to analyze the user's description of their target audience and extract specific job titles and industry keywords.
Focus on identifying concrete roles and sectors. If the user says "tech people", try to break it down into job titles like "Software Engineer", "Product Manager" and industry keywords like "Technology", "SaaS".
If the user says "doctors in big hospitals", job titles could be "Physician", "Surgeon", "Medical Doctor" and industry keywords "Healthcare", "Hospitals".
Be comprehensive but ensure the extracted terms are directly supported by the user's input.`;
    
    const userPrompt = `Please extract job titles and industry keywords from the following description of a target audience: "${description}"`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-2025-04-14",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools: tools,
      tool_choice: { type: "function", function: { name: "extract_contact_criteria" } },
    });

    const message = response.choices[0].message;

    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      if (toolCall.function.name === "extract_contact_criteria") {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          return NextResponse.json({
            jobTitles: args.job_titles || [],
            industryKeywords: args.industry_keywords || []
          });
        } catch (e) {
          console.error("Error parsing function arguments:", e);
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