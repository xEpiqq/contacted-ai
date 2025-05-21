import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert system for selecting the most relevant database for a user's query.
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

1. **Demographics**: None of our databases contain reliable information about race, ethnicity, religion, sexual orientation, political affiliation, or disability status. Queries for these attributes cannot be fulfilled.

2. **Non-Professional Attributes**: Our databases contain professional information only. We don't have data on personal interests, hobbies, marital status, or income level (though job titles may suggest salary ranges).

3. **Geographically-Limited Business Data**: The local business database (deez_3_v3) only covers US businesses. We cannot provide data on local businesses outside the US.

4. **Technical vs. Contact Information Balance**: The USA and international professional databases have strong LinkedIn and demographic coverage but weaker direct contact data (especially phone). The B2B database has stronger email/phone coverage but less demographic information.

5. **Business-to-Business Focus**: All of our databases are focused on B2B (business-to-business) contacts and not B2C (business-to-consumer). We do not have:
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
   
   E. Attribute Limitations: If a query specifically requests data attributes we don't have (e.g., demographics like race, religion, or personal attributes like income level or marital status).
   
   F. B2C Requests: When the query is clearly seeking consumer/individual data rather than business professionals (e.g., "homeowners in Florida," "single mothers in Chicago," "retired veterans"). For these requests, suggest B2B alternatives that might still be valuable, such as professionals in relevant industries or businesses serving those demographics.

   In these cases, instead of returning a database name, return a JSON object with the following structure:
   {
     "requiresFollowUp": true,
     "message": "Brief explanation of the limitation or issue",
     "options": [
       {
         "text": "First suggested option",
         "value": "Reformulated query for this option",
         "database": "Suggested database for this option or null if needs further processing"
       },
       {
         "text": "Second suggested option",
         "value": "Reformulated query for this option",
         "database": "Suggested database for this option or null if needs further processing"
       },
       {
         "text": "Third suggested option",
         "value": "Reformulated query for this option",
         "database": "Suggested database for this option or null if needs further processing"
       }
     ]
   }

For B2C requests specifically, suggest business alternatives that might help address their underlying need:

- For consumer demographic queries: Suggest relevant professionals who serve that demographic (e.g., "realtors in Florida" instead of "homeowners in Florida")
- For general population queries: Suggest local businesses in relevant categories (e.g., "grocery stores in Chicago" instead of "shoppers in Chicago")
- For personal interest groups: Suggest professionals in related fields (e.g., "fitness trainers and gym owners" instead of "fitness enthusiasts")

Always be transparent about what we can and cannot provide while suggesting useful professional/business alternatives.

Now analyze the user's query and either return a single database name (usa4_new_v2, otc1_new_v2, eap1_new_v2, deez_3_v3) as a simple string OR return the follow-up JSON object for cases requiring clarification.

Additional context if provided: [ADDITIONAL_CONTEXT]`;

export async function POST(request) {
  try {
    const requestData = await request.json();
    const { userQuery, followUpResponse } = requestData;
    
    if (!userQuery || userQuery.trim() === '') {
      return NextResponse.json(
        { error: 'User query is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    
    // Add any follow-up response to the system prompt if provided
    let prompt = SYSTEM_PROMPT;
    if (followUpResponse) {
      prompt = prompt.replace('[ADDITIONAL_CONTEXT]', 
        `The user's original query was "${userQuery}" and they provided additional information: "${followUpResponse}"`);
    } else {
      prompt = prompt.replace('[ADDITIONAL_CONTEXT]', '');
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-2025-04-14",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: userQuery }
      ],
      max_tokens: 500,
      temperature: 0,
    });

    const content = completion.choices[0].message.content.trim();
    const processingTime = Date.now() - startTime;
    
    // Try to parse the response as JSON for follow-up cases
    try {
      const jsonResponse = JSON.parse(content);
      
      // If it's a valid follow-up JSON structure
      if (jsonResponse.requiresFollowUp && jsonResponse.message && Array.isArray(jsonResponse.options)) {
        return NextResponse.json({
          requiresFollowUp: true,
          message: jsonResponse.message,
          options: jsonResponse.options,
          processingTime,
          stage: "database-selection"
        });
      }
    } catch (e) {
      // Not JSON, assume it's a simple database name
    }
    
    // If not JSON or not a valid follow-up structure, treat as a simple database name
    const databaseName = content.toLowerCase().trim();
    
    // Now we need to forward the query to the appropriate database API route
    const forwardQuery = async (dbRoute) => {
      try {
        // Make an internal API call to the appropriate database route
        const apiUrl = new URL(`/api/ai/${dbRoute}`, request.url).toString();
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userQuery }),
        });
        
        if (!response.ok) {
          throw new Error(`Database API responded with status: ${response.status}`);
        }
        
        const dbResponse = await response.json();
        
        // Return combined results
        return NextResponse.json({
          databaseName,
          dbResponse,
          processingTime,
          stage: "query-processing"
        });
      } catch (error) {
        console.error(`Error forwarding to ${dbRoute} API:`, error);
        return NextResponse.json(
          { error: `Failed to process query in ${dbRoute} database`, details: error.message },
          { status: 500 }
        );
      }
    };
    
    // Route to the appropriate database API based on the database name
    switch(databaseName) {
      case "usa4_new_v2":
        return forwardQuery("usa4");
      case "otc1_new_v2":
        return forwardQuery("otc1");
      case "eap1_new_v2":
        return forwardQuery("eap1");
      case "deez_3_v3":
        return forwardQuery("deez");
      default:
        // If the database name doesn't match any of our routes
        return NextResponse.json({
          databaseName,
          error: "Unknown database selected",
          processingTime
        });
    }
  } catch (error) {
    console.error('Error in database selection:', error);
    
    return NextResponse.json(
      { error: 'Failed to process the query', details: error.message },
      { status: 500 }
    );
  }
} 