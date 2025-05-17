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

    // First determine if the target is people or local businesses
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

    let targetType = null;
    let targetTypeConfidence = 0;

    const targetTypeMessage = targetTypeResponse.choices[0].message;
    if (targetTypeMessage.tool_calls && targetTypeMessage.tool_calls.length > 0) {
      const toolCall = targetTypeMessage.tool_calls[0];
      if (toolCall.function.name === "determine_target_type") {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          targetType = args.target_type;
          targetTypeConfidence = args.confidence;
        } catch (e) {
          console.error("Error parsing target type function arguments:", e);
        }
      }
    }

    // Depending on the target type, choose which extraction to perform
    if (targetType === "local_businesses") {
      // Extract business categories for local businesses
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
              targetType: targetType || "unknown",
              targetTypeConfidence: targetTypeConfidence,
              businessCategories: args.business_categories || [],
              locationKeywords: args.location_keywords || []
            });
          } catch (e) {
            console.error("Error parsing business categories function arguments:", e);
            return NextResponse.json({ error: 'Failed to parse OpenAI function arguments.' }, { status: 500 });
          }
        }
      }
    } else {
      // Default to extracting job titles and industry keywords for people
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
              targetType: targetType || "unknown",
              targetTypeConfidence: targetTypeConfidence,
            jobTitles: args.job_titles || [],
            industryKeywords: args.industry_keywords || []
          });
        } catch (e) {
          console.error("Error parsing function arguments:", e);
          return NextResponse.json({ error: 'Failed to parse OpenAI function arguments.' }, { status: 500 });
          }
        }
      }
    }

    // Fallback or if no tool call was made as expected
    return NextResponse.json({ 
      targetType: targetType || "unknown",
      targetTypeConfidence: targetTypeConfidence,
      error: 'OpenAI did not return the expected function call.' 
    }, { status: 500 });

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