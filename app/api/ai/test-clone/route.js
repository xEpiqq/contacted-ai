import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

// Simplified Zod schema for basic database selection (no follow-ups)
const DatabaseSelectionSchema = z.object({
  database: z.enum(['usa4_new_v2', 'otc1_new_v2', 'eap1_new_v2', 'deez_3_v3'])
});

// Simplified database selection system prompt (no follow-up logic)
const DB_SELECTION_PROMPT = `You are an expert system for selecting the most relevant database for a user's query.
You have access to information about four databases:

1. **usa4_new_v2**: US professionals and business contacts
2. **otc1_new_v2**: International professionals (outside USA)  
3. **eap1_new_v2**: Global B2B contacts with emphasis on verified emails
4. **deez_3_v3**: US local businesses

Selection rules:
- US professionals (or no location specified): usa4_new_v2
- International professionals: otc1_new_v2  
- Email-focused or global B2B: eap1_new_v2
- Local businesses/services: deez_3_v3
- Default: usa4_new_v2

Always return a database selection - never require follow-up.`;

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
  }

  try {
    const { description } = await request.json();

    if (!description) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
    }

    // Step 1: Determine database (simplified - no follow-ups)
    const dbSelectionResult = await determineDatabase(description);
    const dbRecommendation = dbSelectionResult.database;

    // Step 2: Route to appropriate flow based on database selection
    switch(dbRecommendation) {
      case "usa4_new_v2":
      case "otc1_new_v2":
      case "eap1_new_v2":
        // Use the general professionals route for all professional databases
        return await callFlow("/api/ai/professionals", { 
          description, 
          database: dbRecommendation,
          recommendedDatabase: dbRecommendation 
        });
      
      case "deez_3_v3":
        // TODO: Create local businesses flow
        return NextResponse.json({ 
          error: 'Local businesses flow not yet implemented.' 
        }, { status: 501 });
      
      default:
        // Default to USA professionals if no specific database recommendation
        return await callFlow("/api/ai/professionals", { 
          description, 
          database: "usa4_new_v2",
          recommendedDatabase: "usa4_new_v2" 
        });
    }

  } catch (error) {
    console.error('Router error:', error);
    let errorMessage = 'Failed to process your request.';
    if (error.response) {
      errorMessage = error.response.data.error.message || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Helper function to call a flow API
async function callFlow(flowPath, data) {
  try {
    const response = await fetch(new URL(flowPath, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Flow request failed with status ${response.status}`);
    }
    
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Failed to call flow ${flowPath}:`, error);
    throw error;
  }
}

// Simplified function to determine which database to use (no follow-ups)
async function determineDatabase(description) {
  try {
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: DatabaseSelectionSchema,
      system: DB_SELECTION_PROMPT,
      prompt: description,
      temperature: 0
    });

    return object;
  } catch (error) {
    console.error('Error in database selection:', error);
    // Default to USA database in case of any errors
    return { database: "usa4_new_v2" };
  }
}



 