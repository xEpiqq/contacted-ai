import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

// Zod schema for database selection response with follow-up support
const DatabaseSelectionSchema = z.union([
  z.object({
    requiresFollowUp: z.literal(true),
    message: z.string(),
    options: z.array(z.object({
      text: z.string(),
      value: z.string(),
      database: z.string().nullable()
    }))
  }),
  z.object({
    database: z.enum(['usa4_new_v2', 'otc1_new_v2', 'eap1_new_v2', 'deez_3_v3'])
  })
]);

// Comprehensive database selection system prompt with follow-up logic
const DB_SELECTION_WITH_FOLLOWUP_PROMPT = `You are an expert system for selecting the most relevant database for a user's query.
You have access to information about four databases, identified by their internal names:

1.  **\`usa4_new_v2\`**:
    * **Focus**: Comprehensive data on professionals located **within the USA**.
    * **Contains**: Names, job titles, contact details, LinkedIn profiles, skills, company affiliations, industry, and US location specifics.
    * **Best for queries like**: "Find software engineers in California," "List VPs of Marketing in US tech companies," "Who are contacts at [US Company Name]?"
    * **Available Fields**: Full name, job title, emails (86.3%), phone numbers (36.2%), LinkedIn details (95%+), company info, location data (US only), skills (49.9%), gender (85.4%), industry data, and social media links for some contacts (Twitter, Facebook limited coverage).

2.  **\`otc1_new_v2\`**:
    * **Focus**: Comprehensive data on professionals located **exclusively outside of the USA**.
    * **Contains**: Names, job titles, contact details, LinkedIn profiles, skills, company affiliations, industry, and international location specifics (for any country except the USA).
    * **Best for queries like**: "Find project managers in Canada," "List contacts at [UK Company Name]," "Who are renewable energy experts in Germany?"
    * **Available Fields**: Full name, job title (64.1%), email (92.4%), limited phone numbers (2%), LinkedIn details (90%+), company info, international locations (no US data), skills (33.3%), gender (47.5%), industry data, and very limited social media information.

3.  **\`eap1_new_v2\`**:
    * **Focus**: A global B2B database of individual business contacts, with a strong emphasis on emails. This database can include contacts from any country, including the US.
    * **Contains**: Person's name, title, email, phone, company name, LinkedIn URL, global location, job function, and seniority.
    * **Best for queries like**: "I need email addresses of HR Managers for companies in the automotive sector worldwide," "Find Directors of Operations in manufacturing companies in Germany," "List business contacts at [Global Company Name]."
    * **Available Fields**: Person name, job title (99%), email (95.6%), phone numbers (82%), LinkedIn details (100%), company name, job function, seniority level, employment dates, and location information (cities, states, countries). Stronger focus on verified business emails compared to other databases.

4.  **\`deez_3_v3\`**:
    * **Focus**: Information on local businesses, primarily **within the USA**.
    * **Contains**: Business names, physical addresses, phone numbers, websites, business categories, and details about their online presence (social media, reviews, tech stack).
    * **Best for queries like**: "Find plumbers in Greensboro, NC," "List car dealerships in Arizona that use Shopify," "I need contact info for bookstores in St. Petersburg, FL."
    * **Available Fields**: Business name, phone (100%), email (51.3%), website (70.7%), address (99.2%), city/region/zip (99%+), business category (83.6%), social media links (Facebook, Instagram, Twitter, LinkedIn with varying coverage), online review data (Google/Yelp reviews and ratings), and website technology information (CMS, plugins, etc.).

IMPORTANT DATA LIMITATIONS TO UNDERSTAND:

1. **AVAILABLE USA4 DATABASE FIELDS (with coverage percentages)**: We offer the following data categories for filtering and searching:
   * **Personal Information**: 
     - Full name (100% coverage)
     - First Name (96% coverage)
     - Last Name (96.3% coverage)
     - Middle Name (5% coverage)
     - Middle Initial (11.4% coverage)
     - Gender (85.4% coverage)
   * **Professional Details**:
     - Job title (82.7% coverage)
     - Sub Role (25.2% coverage)
     - Summary (82.9% coverage)
     - Job Summary (14.8% coverage)
     - Industry (89.4% coverage)
     - Industry 2 (41% coverage)
     - Skills (49.9% coverage)
     - Years Experience (61.7% coverage)
     - Inferred Salary (61.7% coverage)
     - Start Date (46.6% coverage)
   * **Company Information**:
     - Company Name (77.3% coverage)
     - Company Size (53.6% coverage)
     - Company Industry (51.3% coverage)
     - Company Founded (38.9% coverage)
     - Company Website (42.2% coverage)
     - Company Linkedin Url (52% coverage)
     - Company Location data (38-50% coverage across fields)
   * **Contact Information**:
     - Emails (86.3% coverage)
     - Phone numbers (36.2% coverage)
     - Mobile (10.4% coverage)
   * **Location Data**:
     - Location (96% coverage)
     - Locality (96% coverage)
     - Region (96.3% coverage)
     - Metro (81.9% coverage)
     - Postal Code (21.6% coverage)
     - Location Geo (92.9% coverage)
     - Location Country (96.3% coverage)
     - Location Continent (95.8% coverage)
   * **Social Media**:
     - LinkedIn Url (95.4% coverage)
     - LinkedIn Username (96.3% coverage)
     - Linkedin Connections (94.2% coverage)
     - Facebook Username (22.9% coverage)
     - Facebook Url (22.9% coverage)
     - Twitter Username (3.1% coverage)
     - Twitter Url (2.9% coverage)
     - Github Username (0.8% coverage)
     - Github Url (1.2% coverage)
   * **Other**:
     - Interests (13.7% coverage)
     - Birth Year (7.5% coverage)
     - Birth Date (6.2% coverage)
     - Address Line 2 (1.2% coverage)
     - Street Address (23.9% coverage)

2. **Geographically-Limited Business Data**: The local business database (deez_3_v3) only covers US businesses. We cannot provide data on local businesses outside the US.

3. **Business-to-Business Focus**: All of our databases are focused on B2B (business-to-business) contacts and not B2C (business-to-consumer). We do not have:
   * Consumer marketing lists or general population data
   * Individual consumer demographic or purchase behavior data
   * Personal lifestyle or household information
   * Non-professional residential contact information

Based on the user's query:

1. Handle misspellings and partial queries: Assume the user is looking for real data even if their query has typos, is brief, or lacks detail.
   * Example: "software eginers" should be interpreted as "software engineers" and matched to a professional database.
   * If only a profession is mentioned without a location (e.g., "accountants"), assume USA unless clearly indicated otherwise.
   * Common misspellings of professions and locations should be interpreted correctly.

2. Identify the primary intention of the user's query:
   * Are they seeking individuals (professionals) or businesses?
   * Is there a geographical focus in the query? If none is explicitly stated, default to USA.
   * Are they looking specifically for contact information like emails (suggests eap1_new_v2)?
   * Are they looking for additional criteria like gender, company size, salary range, or experience? (USA database handles these well)

3. Selection rules:
   * If the query is about professionals in the USA (or no location specified): use \`usa4_new_v2\`
   * If the query is about professionals outside the USA: use \`otc1_new_v2\`
   * If the query specifically seeks email contacts or global B2B data: use \`eap1_new_v2\`
   * If the query is about local businesses or services (restaurants, shops, repair services, etc.): use \`deez_3_v3\`
   * Default to \`usa4_new_v2\` for ambiguous professional queries without clear location indicators

4. IMPORTANT - Follow-up required cases:
   In some scenarios, it's better to ask for clarification rather than selecting a potentially incorrect database. Some common scenarios:

   A. International Businesses: If the query is about local businesses in a non-US location (e.g., "plumbers in Taiwan", "restaurants in Singapore"), none of our databases are ideal. The 'deez_3_v3' database only contains US businesses.
   
   B. Ambiguous Entity Type: If it's unclear whether the user is looking for professionals or businesses (e.g., "solar contacts").
   
   C. Unclear Geography: If the query doesn't specify a location and could be either US or international.
   
   D. Complex Query: When the query contains multiple potentially conflicting requirements.
   
   E. Attribute Limitations: If a query specifically requests data attributes we don't have.
   
   F. B2C Requests: When the query is clearly seeking consumer/individual data rather than business professionals (e.g., "homeowners in Florida," "single mothers in Chicago," "retired veterans"). For these requests, suggest B2B alternatives that might still be valuable, such as professionals in relevant industries or businesses serving those demographics.

   In these cases, instead of returning a simple database name, return a follow-up structure with:
   - requiresFollowUp: true
   - message: Brief explanation of the limitation or issue
   - options: Array of suggested alternatives with text, value, and database properties

Now analyze the user's query and either return a simple database object {database: "database_name"} OR return the follow-up object for cases requiring clarification.`;

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
  }

  try {
    const { description, followUpResponse } = await request.json();

    if (!description) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
    }

    // Step 1: Determine database recommendation or follow-up needs
    let dbRecommendation = null;

    // Only perform database selection if there's no follow-up response
    // If there is a follow-up response, we've already done this step
    if (!followUpResponse) {
      const dbSelectionResult = await determineDatabase(description);
      
      // Check if the response requires follow-up or has a direct database recommendation
      if (dbSelectionResult.requiresFollowUp) {
        // It requires follow-up - return early with the follow-up request
        return NextResponse.json({
          requiresFollowUp: true,
          message: dbSelectionResult.message,
          options: dbSelectionResult.options,
          stage: "database-selection"
        });
      } else {
        // It's a simple database recommendation
        dbRecommendation = dbSelectionResult.database;
      }
    } else {
      // Parse the follow-up response to determine the actual database
      // The followUpResponse should contain a database identifier
      if (followUpResponse === "usa4_new_v2" || followUpResponse === "otc1_new_v2" || 
          followUpResponse === "eap1_new_v2" || followUpResponse === "deez_3_v3") {
        dbRecommendation = followUpResponse;
      } else {
        // If the follow-up response doesn't match a database name, 
        // try to determine the database based on the response content
        const dbSelectionResult = await determineDatabase(`${description} ${followUpResponse}`);
        if (dbSelectionResult.requiresFollowUp) {
          // Should not happen after follow-up, but fallback to usa4_new_v2
          dbRecommendation = "usa4_new_v2";
        } else {
          dbRecommendation = dbSelectionResult.database;
        }
      }
    }

    // Step 2: Route to appropriate flow based on database selection
    switch(dbRecommendation) {
      case "usa4_new_v2":
      case "otc1_new_v2":
      case "eap1_new_v2":
        // Use the general professionals route for all professional databases
        return await callFlow("/api/ai/professionals", { 
          description, 
          database: dbRecommendation,
          followUpResponse, 
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
          followUpResponse, 
          recommendedDatabase: "usa4_new_v2" 
        });
    }

  } catch (error) {
    console.error('Database selection with follow-up error:', error);
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

// Function to determine which database to use or if follow-up is needed using AI SDK
async function determineDatabase(description) {
  try {
    const { object } = await generateObject({
      model: openai('gpt-4.1'),
      schema: DatabaseSelectionSchema,
      system: DB_SELECTION_WITH_FOLLOWUP_PROMPT,
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