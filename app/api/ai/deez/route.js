import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert system that helps users formulate effective Elasticsearch queries for the DEEZ_3_V3 database.
This database contains comprehensive information on local businesses primarily within the USA.

## PRIMARY QUERY PARAMETERS

Most queries can be effectively satisfied with two key parameters:

1. **Business Category** - What type of business/service it is (83.6% coverage)
   - Field: "category"
   - Examples: "Auto Customization", "Retail", "Restaurant", "Law Firm", "Plumber"

2. **Location** - Where in the USA the business is located (99.6% coverage)
   - Fields: "city", "region" (state), "zip"
   - Examples: "Greensboro, NC", "Los Angeles, CA", "Chicago, IL"

## ELASTICSEARCH OPERATIONS

You can use these four operations for querying:

1. **Contains Match**: Field contains the value (most common)
   - Example: category CONTAINS "Restaurant"

2. **Exact Match**: Field equals the specific value exactly
   - Example: city EXACTLY MATCHES "Greensboro"

3. **Field IS EMPTY**: Field has no value
   - Example: email IS EMPTY

4. **Field IS NOT EMPTY**: Field has any value
   - Example: website IS NOT EMPTY

## ADDITIONAL USEFUL FIELDS

- **name (100.0% coverage)** - Business name
- **phone (100.0% coverage)** - Business phone number
- **email (51.3% coverage)** - Business email
- **website (70.7% coverage)** - Business website
- **address (99.2% coverage)** - Physical street address
- **uses_shopify (70.5% coverage)** - Whether the business uses Shopify
- **uses_wordpress (70.5% coverage)** - Whether the business uses WordPress
- **googlereviewscount (68.9% coverage)** - Number of Google reviews
- **googlestars (69.1% coverage)** - Google star rating

## DATABASE FIELDS AND COVERAGE

- **search_keyword (100.0% coverage)**:
    - Examples: [Car Dealership, 	facebook:]
- **name (100.0% coverage)**:
    - Examples: [Dino's Audio Video, Pages Past-Used & Rare Books, Approved Autos]
- **phone (100.0% coverage)**:
    - Examples: [13367637120, 13365741877, 13362970418]
- **email (51.3% coverage)**:
    - Examples: [pagespastbooks@gmail.com, bespoke@jaguarlandrover.com, nicecar1977@gmail.com]
- **website (70.7% coverage)**:
    - Examples: [http://dinos-av.com, https://pages-past-used-rare-books.business.site/, http://approved-autos.com/default.aspx]
- **(Source) (100.0% coverage)**:
    - Examples: [D7_Bulk_CSV_Car_Dealerships_200, 07306]
- **Source (0.0% coverage)**:
    - Examples: [No non-blank examples found]
- **address (99.2% coverage)**:
    - Examples: [3116 Battleground Ave, 1837 Spring Garden St, 5321 W Market St]
- **ads_adwords (0.0% coverage)**:
    - Examples: [No non-blank examples found]
- **ads_facebook (6.2% coverage)**:
    - Examples: [1.0]
- **ads_instagram (3.8% coverage)**:
    - Examples: [1.0]
- **ads_messenger (3.0% coverage)**:
    - Examples: [1.0]
- **ads_yelp (0.2% coverage)**:
    - Examples: [1.0]
- **category (83.6% coverage)**:
    - Examples: [Auto Customization, Retail, Vehicle Parts Shop]
- **city (99.6% coverage)**:
    - Examples: [Greensboro, Lexington, Thomasville]
- **country (99.8% coverage)**:
    - Examples: [US]
- **criteopixel (70.7% coverage)**:
    - Examples: [n]
- **domain_expiration (64.1% coverage)**:
    - Examples: [2025-03-23 00:00:00.000, 2024-04-03 00:00:00.000, 2024-03-23 00:00:00.000]
- **domain_nameserver (46.1% coverage)**:
    - Examples: [hostgator.com, share-dns.com, domaincontrol.com]
- **domain_registrar (46.1% coverage)**:
    - Examples: [Launchpad.com Inc., Gname.com Pte. Ltd., GoDaddy.com]
- **domain_registration (64.1% coverage)**:
    - Examples: [2014-03-23 00:00:00.000, 2021-04-03 00:00:00.000, 1995-03-22 00:00:00.000]
- **email_host (51.3% coverage)**:
    - Examples: [google.com, outlook.com, abchk.net]
- **facebook (12.6% coverage)**:
    - Examples: [https://www.facebook.com/landrover, https://www.facebook.com/cwnc.greensboro, https://www.facebook.com/352149204886926]
- **facebookpixel (70.7% coverage)**:
    - Examples: [n, y]
- **facebookreviewscount (20.0% coverage)**:
    - Examples: [88.0, 11.0, 9.0]
- **facebookstars (19.8% coverage)**:
    - Examples: [4.9, 5.0, 4.3]
- **g_maps (75.6% coverage)**:
    - Examples: [claimed, unclaimed]
- **g_maps_claimed (75.6% coverage)**:
    - Examples: [https://maps.google.com/maps/place/Dino's+Audio+Video/@36.11686706543,-79.838005065918,17z/data=!3m1!4b1!4m5!3m4!1s0x0:0x57935964FAC1AEB3!8m2!3d36.11686706543!4d-79.838005065918, https://maps.google.com/maps/place/Pages+Past-Used+&+Rare+Books/@36.0637550354,-79.823173522949,17z/data=!3m1!4b1!4m5!3m4!1s0x0:0x6ADB05AECCC97F86!8m2!3d36.0637550354!4d-79.823173522949, https://maps.google.com/maps/place/Land+Rover+Greensboro/@36.084945678711,-79.805366516113,17z/data=!3m1!4b1!4m5!3m4!1s0x0:0x4F028A162EA8AADF!8m2!3d36.084945678711!4d-79.805366516113]
- **google_rank (7.0% coverage)**:
    - Examples: [5.0, 15.0, 94.0]
- **googleanalytics (70.7% coverage)**:
    - Examples: [n, y]
- **googlepixel (70.7% coverage)**:
    - Examples: [n, y]
- **googlereviewscount (68.9% coverage)**:
    - Examples: [117.0, 38.0, 24.0]
- **googlestars (69.1% coverage)**:
    - Examples: [4.6, 4.3, 4.5]
- **instagram (18.0% coverage)**:
    - Examples: [https://www.instagram.com/dinos_av, https://www.instagram.com/landrover, https://www.instagram.com/nicecarhollywood]
- **instagram_average_comments (11.4% coverage)**:
    - Examples: [1.0, 89.0, 24.0]
- **instagram_average_likes (17.2% coverage)**:
    - Examples: [21.0, 1764.0, 8.0]
- **instagram_category (13.0% coverage)**:
    - Examples: [Auto Dealers, Home Services, Professional Services]
- **instagram_followers (18.0% coverage)**:
    - Examples: [2150.0, 869727.0, 45347.0]
- **instagram_following (17.2% coverage)**:
    - Examples: [446.0, 631.0, 39.0]
- **instagram_highlight_reel_count (12.0% coverage)**:
    - Examples: [23.0, 7.0, 4.0]
- **instagram_is_business_account (16.4% coverage)**:
    - Examples: [1.0]
- **instagram_is_verified (1.4% coverage)**:
    - Examples: [1.0]
- **instagram_media_count (14.4% coverage)**:
    - Examples: [499.0, 1776.0, 477.0]
- **instagram_name (18.0% coverage)**:
    - Examples: [Dino's Audio Video, Land Rover Discovery, Nice Car Inc.]
- **linkedin (14.6% coverage)**:
    - Examples: [https://www.linkedin.com/company/ivoiremotor-s.a, https://www.linkedin.com/company/get-a-car-inc, https://www.linkedin.com/company/premiere-performances-of-hong-kong]
- **linkedinanalytics (70.7% coverage)**:
    - Examples: [n, y]
- **mobilefriendly (70.7% coverage)**:
    - Examples: [y, n]
- **region (99.6% coverage)**:
    - Examples: [NC, Nc, AZ]
- **search_city (99.8% coverage)**:
    - Examples: [Greensboro, Chandler, St Petersburg]
- **seo_schema (70.7% coverage)**:
    - Examples: [n, y]
- **twitter (17.2% coverage)**:
    - Examples: [https://www.twitter.com/dno5577, https://www.twitter.com/landrover, https://www.twitter.com/nicecar1977]
- **uses_shopify (70.5% coverage)**:
    - Examples: [n, y]
- **uses_wordpress (70.5% coverage)**:
    - Examples: [n, y]
- **yelpreviewscount (9.0% coverage)**:
    - Examples: [121.0, 5.0, 41.0]
- **yelpstars (9.0% coverage)**:
    - Examples: [2.5, 5.0, 4.0]
- **zip (99.2% coverage)**:
    - Examples: [27408, 27403, 27409]

## SAMPLE QUERIES

1. Find plumbers in Boston, MA:
   - category CONTAINS "Plumber" OR "Plumbing"
   - city CONTAINS "Boston" 
   - region CONTAINS "MA"

2. Find auto repair shops in Dallas with good reviews:
   - category CONTAINS "Auto Repair" OR "Car Repair" OR "Vehicle Repair"
   - city CONTAINS "Dallas"
   - googlereviewscount > 20
   - googlestars >= 4.0

3. Find restaurants in Chicago that use WordPress:
   - category CONTAINS "Restaurant" OR "Dining"
   - city CONTAINS "Chicago"
   - uses_wordpress EXACT MATCH "y"

4. Find law firms in San Francisco with email contacts:
   - category CONTAINS "Law Firm" OR "Attorney" OR "Legal Services"
   - city CONTAINS "San Francisco"
   - email IS NOT EMPTY

## RESPONSE FORMAT

You MUST respond with a valid JSON object containing a 'fields' array of query parameters. Each field object should have 'field', 'operation', and 'value' properties.

For example, if a user asks "Find me hair salons in Atlanta with websites", you should generate:
{
  "fields": [
    {"field": "category", "operation": "CONTAINS", "value": "Hair Salon"},
    {"field": "city", "operation": "CONTAINS", "value": "Atlanta"},
    {"field": "website", "operation": "IS_NOT_EMPTY"}
  ]
}`;

export async function POST(request) {
  try {
    const requestData = await request.json();
    const { userQuery } = requestData;
    
    if (!userQuery || userQuery.trim() === '') {
      return NextResponse.json(
        { error: 'User query is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    
    // Define the function calling structure
    const tools = [{
      type: "function",
      function: {
        name: "generate_elasticsearch_query",
        description: "Generates an Elasticsearch query based on the user's description",
        parameters: {
          type: "object",
          properties: {
            fields: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                    description: "The database field name to query"
                  },
                  operation: {
                    type: "string",
                    enum: ["CONTAINS", "EXACT_MATCH", "IS_EMPTY", "IS_NOT_EMPTY"],
                    description: "The operation to perform on the field"
                  },
                  value: {
                    type: "string", 
                    description: "The value to search for (not required for IS_EMPTY/IS_NOT_EMPTY operations)"
                  }
                },
                required: ["field", "operation"]
              },
              description: "Array of field objects that define the query parameters"
            }
          },
          required: ["fields"]
        }
      }
    }];
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-2025-04-14",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userQuery }
      ],
      temperature: 0.2,
      tools: tools,
      tool_choice: { type: "function", function: { name: "generate_elasticsearch_query" } }
    });

    const message = completion.choices[0].message;
    const processingTime = Date.now() - startTime;
    
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      if (toolCall.function.name === "generate_elasticsearch_query") {
        try {
          const queryParams = JSON.parse(toolCall.function.arguments);
          
          return NextResponse.json({
            response: toolCall.function.arguments,
            queryParams: queryParams,
            database: "deez_3_v3",
            processingTime
          });
        } catch (error) {
          console.error('Error parsing function arguments:', error);
          return NextResponse.json(
            { error: 'Failed to parse query parameters', details: error.message },
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
    console.error('Error processing DEEZ query:', error);
    
    return NextResponse.json(
      { error: 'Failed to process the query', details: error.message },
      { status: 500 }
    );
  }
} 