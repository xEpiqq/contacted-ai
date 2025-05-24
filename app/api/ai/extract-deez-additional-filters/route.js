import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

// Zod schema for additional filters response
const AdditionalFiltersSchema = z.object({
  additionalFilters: z.array(z.object({
    column: z.string(),
    condition: z.string(),
    values: z.array(z.string()),
    coverage: z.number().optional(),
    note: z.string().nullable().optional()
  })),
  hasAdditionalFilters: z.boolean(),
  message: z.string()
});

// Schema information for deez_3_v3 database with coverage percentages
const DEEZ_SCHEMA_INFO = `
Database Schema for DEEZ (US Local Businesses Database) with field coverage percentages:

- **search_keyword (100.0% coverage)**: - Examples: [Car Dealership, facebook:]
- **name (100.0% coverage)**: - Examples: [Dino's Audio Video, Pages Past-Used & Rare Books, Approved Autos]
- **phone (100.0% coverage)**: - Examples: [13367637120, 13365741877, 13362970418]
- **email (51.3% coverage)**: - Examples: [pagespastbooks@gmail.com, bespoke@jaguarlandrover.com, nicecar1977@gmail.com]
- **website (70.7% coverage)**: - Examples: [http://dinos-av.com, https://pages-past-used-rare-books.business.site/, http://approved-autos.com/default.aspx]
- **address (99.2% coverage)**: - Examples: [3116 Battleground Ave, 1837 Spring Garden St, 5321 W Market St]
- **category (83.6% coverage)**: - Examples: [Auto Customization, Retail, Vehicle Parts Shop]
- **city (99.6% coverage)**: - Examples: [Greensboro, Lexington, Thomasville]
- **country (99.8% coverage)**: - Examples: [US]
- **region (99.6% coverage)**: - Examples: [NC, Nc, AZ]
- **search_city (99.8% coverage)**: - Examples: [Greensboro, Chandler, St Petersburg]
- **zip (99.2% coverage)**: - Examples: [27408, 27403, 27409]
- **ads_facebook (6.2% coverage)**: - Examples: [1.0]
- **ads_instagram (3.8% coverage)**: - Examples: [1.0]
- **ads_messenger (3.0% coverage)**: - Examples: [1.0]
- **ads_yelp (0.2% coverage)**: - Examples: [1.0]
- **domain_expiration (64.1% coverage)**: - Examples: [2025-03-23 00:00:00.000, 2024-04-03 00:00:00.000, 2024-03-23 00:00:00.000]
- **domain_nameserver (46.1% coverage)**: - Examples: [hostgator.com, share-dns.com, domaincontrol.com]
- **domain_registrar (46.1% coverage)**: - Examples: [Launchpad.com Inc., Gname.com Pte. Ltd., GoDaddy.com]
- **domain_registration (64.1% coverage)**: - Examples: [2014-03-23 00:00:00.000, 2021-04-03 00:00:00.000, 1995-03-22 00:00:00.000]
- **email_host (51.3% coverage)**: - Examples: [google.com, outlook.com, abchk.net]
- **facebook (12.6% coverage)**: - Examples: [https://www.facebook.com/landrover, https://www.facebook.com/cwnc.greensboro, https://www.facebook.com/352149204886926]
- **facebookpixel (70.7% coverage)**: - Examples: [n, y]
- **facebookreviewscount (20.0% coverage)**: - Examples: [88.0, 11.0, 9.0]
- **facebookstars (19.8% coverage)**: - Examples: [4.9, 5.0, 4.3]
- **g_maps (75.6% coverage)**: - Examples: [claimed, unclaimed]
- **g_maps_claimed (75.6% coverage)**: - Examples: [https://maps.google.com/maps/place/Dino's+Audio+Video/@36.11686706543,-79.838005065918,17z/data=!3m1!4b1!4m5!3m4!1s0x0:0x57935964FAC1AEB3!8m2!3d36.11686706543!4d-79.838005065918]
- **google_rank (7.0% coverage)**: - Examples: [5.0, 15.0, 94.0]
- **googleanalytics (70.7% coverage)**: - Examples: [n, y]
- **googlepixel (70.7% coverage)**: - Examples: [n, y]
- **googlereviewscount (68.9% coverage)**: - Examples: [117.0, 38.0, 24.0]
- **googlestars (69.1% coverage)**: - Examples: [4.6, 4.3, 4.5]
- **instagram (18.0% coverage)**: - Examples: [https://www.instagram.com/dinos_av, https://www.instagram.com/landrover, https://www.instagram.com/nicecarhollywood]
- **instagram_average_comments (11.4% coverage)**: - Examples: [1.0, 89.0, 24.0]
- **instagram_average_likes (17.2% coverage)**: - Examples: [21.0, 1764.0, 8.0]
- **instagram_category (13.0% coverage)**: - Examples: [Auto Dealers, Home Services, Professional Services]
- **instagram_followers (18.0% coverage)**: - Examples: [2150.0, 869727.0, 45347.0]
- **instagram_following (17.2% coverage)**: - Examples: [446.0, 631.0, 39.0]
- **instagram_highlight_reel_count (12.0% coverage)**: - Examples: [23.0, 7.0, 4.0]
- **instagram_is_business_account (16.4% coverage)**: - Examples: [1.0]
- **instagram_is_verified (1.4% coverage)**: - Examples: [1.0]
- **instagram_media_count (14.4% coverage)**: - Examples: [499.0, 1776.0, 477.0]
- **instagram_name (18.0% coverage)**: - Examples: [Dino's Audio Video, Land Rover Discovery, Nice Car Inc.]
- **linkedin (14.6% coverage)**: - Examples: [https://www.linkedin.com/company/ivoiremotor-s.a, https://www.linkedin.com/company/get-a-car-inc, https://www.linkedin.com/company/premiere-performances-of-hong-kong]
- **linkedinanalytics (70.7% coverage)**: - Examples: [n, y]
- **mobilefriendly (70.7% coverage)**: - Examples: [y, n]
- **seo_schema (70.7% coverage)**: - Examples: [n, y]
- **twitter (17.2% coverage)**: - Examples: [https://www.twitter.com/dno5577, https://www.twitter.com/landrover, https://www.twitter.com/nicecar1977]
- **uses_shopify (70.5% coverage)**: - Examples: [n, y]
- **uses_wordpress (70.5% coverage)**: - Examples: [n, y]
- **yelpreviewscount (9.0% coverage)**: - Examples: [121.0, 5.0, 41.0]
- **yelpstars (9.0% coverage)**: - Examples: [2.5, 5.0, 4.0]
`;

// Additional filters extraction system prompt for local businesses
const ADDITIONAL_FILTERS_PROMPT = `
You are an AI assistant specialized in extracting additional search filters from user descriptions for the DEEZ database (US Local Businesses Database).

IMPORTANT: Your task is to ONLY identify and extract parameters BEYOND the "big 2" standard filters for local businesses:
1. DO NOT extract business types/categories - these are handled by another system (search_keyword and category fields)
2. DO NOT extract location information - these are handled by another system (city, region, zip fields)

Focus EXCLUSIVELY on extracting additional filter parameters such as:
- Business name (exact business names mentioned)
- Email hosting providers (if specific email providers mentioned)
- Social media presence (Facebook, Instagram, LinkedIn, Twitter)
- Review ratings and counts (Google stars, Facebook stars, Yelp stars)
- Technology usage (Shopify, WordPress, Google Analytics)
- Domain information (registration dates, nameservers)
- Online advertising presence (Facebook ads, Instagram ads, etc.)
- Website features (mobile-friendly, SEO schema)
- Or any other parameters in the schema that are NOT business type or location

Follow these strict guidelines:
1. Use the MINIMUM number of additional filters needed to satisfy the user's request
2. Prioritize fields with higher coverage percentages when multiple options could satisfy the request
3. For each parameter, provide:
   - The exact database field name from the schema (use the exact case/spelling)
   - The condition type (contains, equals, etc.)
   - The extracted value(s)
4. Only include parameters that are explicitly mentioned or strongly implied in the user's query
5. Do NOT infer parameters that aren't clearly indicated by the user
6. Make sure all parameters extracted are found in the database schema provided
7. For fields with low coverage (<20%), include a warning note about potential limited results

If no additional parameters are identified, return:
{
  "additionalFilters": [],
  "hasAdditionalFilters": false,
  "message": "No additional filter criteria identified beyond business type and location."
}

If additional parameters are found, return them with proper validation and coverage information.
`;

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
  }

  try {
    const { description } = await request.json();

    if (!description) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
    }

    // Extract additional filters beyond business type and location
    const additionalFiltersResponse = await extractAdditionalFilters(description);
    
    // If successful, return the additional filters
    return NextResponse.json(additionalFiltersResponse);

  } catch (error) {
    console.error('API error in extract-deez-additional-filters:', error);
    let errorMessage = 'Failed to process your request.';
    if (error.response) {
      errorMessage = error.response.data.error.message || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Function to extract additional filters beyond business type and location
async function extractAdditionalFilters(description) {
  const systemPrompt = `${ADDITIONAL_FILTERS_PROMPT}\n\n${DEEZ_SCHEMA_INFO}`;

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: AdditionalFiltersSchema,
      system: systemPrompt,
      prompt: `Extract additional filter parameters (beyond business type and location) from this description for searching the DEEZ local businesses database:\n\n"${description}"`,
      temperature: 0.1
    });

    return object;
  } catch (error) {
    console.error("Error calling AI SDK:", error);
    // Return a fallback response
    return {
      additionalFilters: [],
      hasAdditionalFilters: false,
      message: "Failed to extract additional filter criteria.",
      error: "Invalid response format from AI service."
    };
  }
} 