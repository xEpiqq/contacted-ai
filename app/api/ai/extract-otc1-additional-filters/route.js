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

const OTC1_SCHEMA_INFO = `
  Database Schema for OTC1 (International professionals db) with field coverage percentages:

  - **full_name	(100.00% coverage)**: - Examples:	[yağız aksakaloğlu, asim aslan, olgun aydin]
  - **job_title	(64.09% coverage)**: - Examples:	[akbank aksaray Å ubesiÌ, chief executive officer, broadcast technician]
  - **email	(92.45% coverage)**: - Examples:	[yaaz3158@hotmail.com, asimas98@yahoo.com, olgun.aydin@akbank.com]
  - **phone_number	(2.03% coverage)**: - Examples:	[+905555372142, +905054990999, 2018-12-01 00:00:00.000]
  - **Original Values - [linkedin_url]	(92.82% coverage)**: - Examples:	[linkedin.com/in/yağız-aksakaloğlu-50a02744, linkedin.com/in/asim-aslan-20ba6a2a, linkedin.com/in/olgun-aydin-b68a3651]
  - **address_line_2	(0.74% coverage)**: - Examples:	[https://www.linkedin.com/in/ebru-yakin-3216a841, https://www.linkedin.com/in/senol-pehlivanoglu-a4b47a22, https://www.linkedin.com/in/taylan-samancı-0a0b9a21]
  - **birth_date	(0.74% coverage)**: - Examples:	[ebru-yakin-3216a841, senol-pehlivanoglu-a4b47a22, taylan-samancı-0a0b9a21]
  - **birth_year	(1.10% coverage)**: - Examples:	[1970, i̇zmir, i̇stanbul]
  - **company_facebook_url	(10.31% coverage)**: - Examples:	[facebook.com/temavakfi, facebook.com/univerasocial, facebook.com/turkishairlines]
  - **company_founded	(24.13% coverage)**: - Examples:	[1973, 1992, 1984]
  - **company_industry	(28.91% coverage)**: - Examples:	[banking, broadcast media, packaging and containers]
  - **company_linkedin_url	(30.02% coverage)**: - Examples:	[linkedin.com/company/akbank, linkedin.com/company/trtworld, linkedin.com/company/bak-ambalaj]
  - **company_location_address_line_2	(0.00% coverage)**: - Examples:	[https://www.linkedin.com/in/ebru-yakin-3216a841, https://www.linkedin.com/in/senol-pehlivanoglu-a4b47a22, https://www.linkedin.com/in/taylan-samancı-0a0b9a21]
  - **company_location_continent	(26.34% coverage)**: - Examples:	[asia, europe, north america]
  - **company_location_country	(26.34% coverage)**: - Examples:	[turkey, spain, united states]
  - **company_location_geo	(17.13% coverage)**: - Examples:	[38.45,37.86, 41.03,28.98, 41.62,2.68]
  - **company_location_locality	(17.06% coverage)**: - Examples:	[i̇zmir, i̇stanbul, ankara]
  - **company_location_metro	(6.88% coverage)**: - Examples:	[i̇stanbul, ankara, i̇zmir]
  - **company_location_name	(26.34% coverage)**: - Examples:	[izmir, turkey, i̇stanbul, turkey, ankara, turkey]
  - **company_location_postal_code	(13.92% coverage)**: - Examples:	[35620, 34330, 06560]
  - **company_location_region	(21.03% coverage)**: - Examples:	[i̇zmir, i̇stanbul, ankara]
  - **company_location_street_address	(7.91% coverage)**: - Examples:	[barbaros mah. begonya sok. no:3, esentepe, 1453 sk no:9]
  - **company_name	(67.57% coverage)**: - Examples:	[akbank, trt, bak ambalaj]
  - **company_size	(30.13% coverage)**: - Examples:	[10001+, 1001-5000, 501-1000]
  - **company_twitter_url	(9.07% coverage)**: - Examples:	[twitter.com/temavakfi, twitter.com/univerasocial, twitter.com/turkishairlines]
  - **company_website	(37.74% coverage)**: - Examples:	[akbank.com, trt.net.tr, https://www.google.com/search?q=bakambalaj.com.tr]
  - **countries	(92.89% coverage)**: - Examples:	[turkey, "aydin, turkey", "i̇zmir, turkey"]
  - **facebook_url	(3.29% coverage)**: - Examples:	[facebook.com/asimas98, facebook.com/olgun.aydin, facebook.com/profile.php?id=100008560862086]
  - **facebook_username	(3.29% coverage)**: - Examples:	[asimas98, olgun.aydin, profile.php?id=100008560862086]
  - **first_name	(99.96% coverage)**: - Examples:	[yağız, asim, olgun]
  - **gender	(58.75% coverage)**: - Examples:	[male, female]
  - **github_url	(0.81% coverage)**: - Examples:	[github.com/asimas98, github.com/mustafayilmaz, github.com/metin]
  - **github_username	(0.81% coverage)**: - Examples:	[asimas98, mustafayilmaz, metin]
  - **id	(100.00% coverage)**: - Examples:	[47304485, 47304486, 47304487]
  - **industry	(99.96% coverage)**: - Examples:	[public policy, defense & space, banking]
  - **industry_2	(0.00% coverage)**: - Examples:	[]
  - **inferred_salary	(12.03% coverage)**: - Examples:	[<$50k, $50k-$100k, $100k-$150k]
  - **interests	(0.18% coverage)**: - Examples:	[economic development, social services, civil rights and social action]
  - **job_summary	(1.81% coverage)**: - Examples:	[technical lead at vestel defense industry co. location ankara, turkey industry defense & space, general manager at ankara hiltonsa location ankara, turkey industry hospitality, general manager at hilton worldwide location ankara, turkey industry hospitality]
  - **last_name	(99.93% coverage)**: - Examples:	[aksakaloğlu, aslan, aydin]
  - **last_updated	(86.85% coverage)**: - Examples:	[2018-12-01 00:00:00.000, 2020-03-01 00:00:00.000, 2024-03-01 00:00:00.000]
  - **last_updated_2	(96.16% coverage)**: - Examples:	[2018-12-01 00:00:00.000, 2020-03-01 00:00:00.000, 2018-12-01 00:00:00.000]
  - **linkedin_connections	(100.00% coverage)**: - Examples:	[0, 16, 500]
  - **linkedin_url	(92.82% coverage)**: - Examples:	[https://www.linkedin.com/in/yağız-aksakaloğlu-50a02744, https://www.linkedin.com/in/asim-aslan-20ba6a2a, https://www.linkedin.com/in/olgun-aydin-b68a3651]
  - **linkedin_username	(92.82% coverage)**: - Examples:	[yağız-aksakaloğlu-50a02744, asim-aslan-20ba6a2a, olgun-aydin-b68a3651]
  - **locality	(37.26% coverage)**: - Examples:	["aydin, turkey", "i̇zmir, turkey", ankara]
  - **location	(92.89% coverage)**: - Examples:	[turkey, "aydin, turkey", "i̇zmir, turkey"]
  - **location_continent	(92.89% coverage)**: - Examples:	[asia, europe, middle east]
  - **location_country	(92.89% coverage)**: - Examples:	[turkey]
  - **location_geo	(37.26% coverage)**: - Examples:	[37.8380,27.8456, 38.4127,27.1384, 39.9208,32.8541]
  - **metro	(29.54% coverage)**: - Examples:	[aydin, i̇zmir, ankara]
  - **middle_initial	(2.50% coverage)**: - Examples:	[a, m, i]
  - **middle_name	(2.61% coverage)**: - Examples:	[ali, mustafa, i̇brahim]
  - **mobile	(1.95% coverage)**: - Examples:	[905555372142, 905054990999, 905353520550]
  - **postal_code	(2.11% coverage)**: - Examples:	[09100, 35660, 34840]
  - **region	(37.26% coverage)**: - Examples:	[aydin, i̇zmir, ankara]
  - **skills	(23.94% coverage)**: - Examples:	[c++, java, c, "vestel savunma sanayii", "vestel defense industry", "military specifications"]
  - **start_date	(23.13% coverage)**: - Examples:	[2011-06-01, 1999-01-01, 2004-03-01]
  - **street_address	(0.70% coverage)**: - Examples:	[efeler, adnan menderes blv., karşıyaka]
  - **sub_role	(17.63% coverage)**: - Examples:	[management, other, c-suite]
  - **summary	(22.83% coverage)**: - Examples:	["specialties: c++, java, c", "technical lead at vestel defense industry co.", "vestel savunma sanayii"]
  - **twitter_url	(5.30% coverage)**: - Examples:	[twitter.com/asimas98, twitter.com/olgunaydin, twitter.com/berk_ozturk]
  - **twitter_username	(5.30% coverage)**: - Examples:	[asimas98, olgunaydin, berk_ozturk]
  - **years_experience	(23.32% coverage)**: - Examples:	[13, 25, 20]
`;

// Additional filters extraction system prompt  
const ADDITIONAL_FILTERS_PROMPT = `
You are an AI assistant specialized in extracting additional search filters from user descriptions for the OTC1 database (International Professionals Database).

IMPORTANT: Your task is to ONLY identify and extract parameters BEYOND the "big 3" standard filters:
1. DO NOT extract job titles - these are handled by another system
2. DO NOT extract industry information - these are handled by another system 
3. DO NOT extract location information - these are handled by another system

Focus EXCLUSIVELY on extracting additional filter parameters such as:
- Gender
- Company size
- Company name  
- Skills
- Experience level
- Seniority
- Education
- Or any other parameters in the schema that are NOT job title, industry, or location

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
8. If the user is requesting data that we do not have, do not include any additional filters.

The response should be a JSON object with an "additionalFilters" array containing the identified parameters.

If no additional parameters are identified, return:
{
  "additionalFilters": [],
  "hasAdditionalFilters": false,
  "message": "No additional filter criteria identified beyond job title, industry, and location."
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

    // Extract additional filters using AI SDK
    const result = await extractAdditionalFilters(description);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('OTC1 Additional filters extraction error:', error);
    let errorMessage = 'Failed to extract additional filters.';
    if (error.response) {
      errorMessage = error.response.data.error.message || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function extractAdditionalFilters(description) {
  const systemPrompt = `${ADDITIONAL_FILTERS_PROMPT}\n\n${OTC1_SCHEMA_INFO}`;

  try {
    const { object } = await generateObject({
      model: openai('gpt-4.1'),
      schema: AdditionalFiltersSchema,
      system: systemPrompt,
      prompt: `Please analyze this description and extract any additional filter criteria beyond job title, industry, and location for the OTC1 international professionals database: "${description}"`,
      temperature: 0.1
    });

    // Add warning notes for low coverage fields
    const processedFilters = object.additionalFilters.map(filter => {
      if (filter.coverage && filter.coverage < 20 && !filter.note) {
        filter.note = `Low coverage field (${filter.coverage}%) - may result in limited matches`;
      }
      return filter;
    });

    return {
      additionalFilters: processedFilters,
      hasAdditionalFilters: object.hasAdditionalFilters,
      message: object.message
    };
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