import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Ultra-lean system prompt for fast autocomplete functionality
const AUTOCOMPLETE_SYSTEM_PROMPT = `Complete the user's search query for a professional contact database. 
Output a complete phrase that starts with the user's text exactly as entered.
Must be a job title, possibly with industry or location info.
No explanation, just the completion.`;

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
  }

  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return NextResponse.json({ completion: "" }, { status: 200 });
    }

    // Use fastest available model for lowest latency
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano-2025-04-14",
      messages: [
        {
          role: "system",
          content: AUTOCOMPLETE_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: query
        }
      ],
      temperature: 0.1,    // Low temperature for predictable results
      max_tokens: 20,      // Very few tokens needed for completion
      presence_penalty: 0, // No penalty for using common phrases
      stream: false        // No streaming needed for such short completions
    });

    // Extract the completion text
    const completion = response.choices[0].message.content.trim();
    
    return NextResponse.json({ completion });

  } catch (error) {
    console.error('API error in autocomplete:', error);
    
    // Return an empty completion on error, to gracefully degrade the UX
    return NextResponse.json({ completion: "" }, { status: 200 });
  }
} 