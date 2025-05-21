import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert system that helps users formulate effective Elasticsearch queries for the OTC1_NEW_V2 database.
This database contains comprehensive data on professionals located exclusively outside of the USA.

## PRIMARY QUERY PARAMETERS

Most queries can be effectively satisfied with three key parameters:

1. **Job Title** - What role the person has (64.1% coverage)
   - Field: "job_title"
   - Examples: "chief executive officer", "broadcast technician", "software developer"

2. **Industry** - What sector or field they work in (74.6% coverage)
   - Field: "industry" 
   - Examples: "banking", "public policy", "construction"

3. **Location** - Where outside the USA they are located (91.3% coverage)
   - Field: "location" (includes city, country)
   - Examples: "Istanbul, Turkey", "London, United Kingdom", "Toronto, Canada"

## ELASTICSEARCH OPERATIONS

You can use these four operations for querying:

1. **Contains Match**: Field contains the value (most common)
   - Example: industry CONTAINS "banking"

2. **Exact Match**: Field equals the specific value exactly
   - Example: location_country EXACTLY MATCHES "Turkey"

3. **Field IS EMPTY**: Field has no value
   - Example: phone_number IS EMPTY

4. **Field IS NOT EMPTY**: Field has any value
   - Example: linkedin_url IS NOT EMPTY

## ADDITIONAL USEFUL FIELDS

- **full_name (100.0% coverage)**
- **email (92.4% coverage)**
- **linkedin_url (91.3% coverage)**
- **skills (33.3% coverage)**
- **company_name (57.8% coverage)**
- **location_country (91.3% coverage)**
- **years_experience (46.2% coverage)**

## DATABASE FIELDS AND COVERAGE

- **full_name (100.0% coverage)**:
    - Examples: [yağız aksakaloğlu, asim aslan, olgun aydin]
- **job_title (64.1% coverage)**:
    - Examples: [akbank aksaray Å ubesiÌ, chief executive officer, broadcast technician]
- **email (92.4% coverage)**:
    - Examples: [yaaz3158@hotmail.com, asimas98@yahoo.com, olgun.aydin@akbank.com]
- **phone_number (2.0% coverage)**:
    - Examples: [+905555372142, +905054990999, 2018-12-01 00:00:00.000]
- **Original Values - [linkedin_url] (92.8% coverage)**:
    - Examples: [linkedin.com/in/yağız-aksakaloğlu-50a02744, linkedin.com/in/asim-aslan-20ba6a2a, linkedin.com/in/olgun-aydin-b68a3651]
- **address_line_2 (0.7% coverage)**:
    - Examples: [https://www.linkedin.com/in/ebru-yakin-3216a841, https://www.linkedin.com/in/senol-pehlivanoglu-a4b47a22, https://www.linkedin.com/in/taylan-samancı-0a0b9a21]
- **birth_date (0.7% coverage)**:
    - Examples: [ebru-yakin-3216a841, senol-pehlivanoglu-a4b47a22, taylan-samancı-0a0b9a21]
- **birth_year (1.1% coverage)**:
    - Examples: [1970, i̇zmir, i̇stanbul]
- **company_facebook_url (10.3% coverage)**:
    - Examples: [facebook.com/temavakfi, facebook.com/univerasocial, facebook.com/turkishairlines]
- **company_founded (24.1% coverage)**:
    - Examples: [1973, 1992, 1984]
- **company_industry (28.9% coverage)**:
    - Examples: [banking, broadcast media, packaging and containers]
- **company_linkedin_url (30.0% coverage)**:
    - Examples: [linkedin.com/company/akbank, linkedin.com/company/trtworld, linkedin.com/company/bak-ambalaj]
- **company_location_address_line_2 (0.0% coverage)**:
    - Examples: [No non-blank examples found]
- **company_location_continent (26.3% coverage)**:
    - Examples: [asia, europe, north america]
- **company_location_country (26.3% coverage)**:
    - Examples: [turkey, spain, united states]
- **company_location_geo (17.1% coverage)**:
    - Examples: [38.45,37.86, 41.03,28.98, 41.62,2.68]
- **company_location_locality (19.7% coverage)**:
    - Examples: [levent, i̇stanbul, i̇zmir]
- **company_location_metro (2.6% coverage)**:
    - Examples: [houston, texas, kalamazoo, michigan, i̇zmir]
- **company_location_name (27.1% coverage)**:
    - Examples: [levent, malatya, turkey, i̇stanbul, istanbul, turkey, turkey]
- **company_location_postal_code (2.6% coverage)**:
    - Examples: [77042, 49002, 2014-09]
- **company_location_region (20.3% coverage)**:
    - Examples: [malatya, istanbul, i̇zmir]
- **company_location_street_address (2.4% coverage)**:
    - Examples: [2101 citywest boulevard, 2825 airview boulevard, 13 esdoring street]
- **company_name (57.8% coverage)**:
    - Examples: [akbank, yasay, trt world]
- **company_size (29.7% coverage)**:
    - Examples: [10001+, 1001-5000, 501-1000]
- **company_twitter_url (11.0% coverage)**:
    - Examples: [twitter.com/temavakfi, twitter.com/bakertillytr, twitter.com/univerasocial]
- **company_website (25.0% coverage)**:
    - Examples: [akbank.com, trtworld.com, bakambalaj.com.tr]
- **countries (92.1% coverage)**:
    - Examples: [turkey, united states; turkey, nigeria; united states; turkey]
- **facebook_url (5.5% coverage)**:
    - Examples: [facebook.com/irem.p.can, facebook.com/berzanali, facebook.com/merih.gumussuyu]
- **facebook_username (5.5% coverage)**:
    - Examples: [irem.p.can, berzanali, merih.gumussuyu]
- **first_name (92.1% coverage)**:
    - Examples: [yağız, asim, olgun]
- **gender (47.5% coverage)**:
    - Examples: [male, female]
- **github_url (0.6% coverage)**:
    - Examples: [github.com/tanjuyayak, github.com/hasanbasritokgoz, github.com/gencebay]
- **github_username (0.6% coverage)**:
    - Examples: [tanjuyayak, hasanbasritokgoz, gencebay]
- **id (92.1% coverage)**:
    - Examples: [47304485.0, 47304486.0, 47304487.0]
- **industry (74.6% coverage)**:
    - Examples: [public policy, banking, construction]
- **industry_2 (19.7% coverage)**:
    - Examples: [media, health, education]
- **inferred_salary (30.4% coverage)**:
    - Examples: [45,000-55,000, <20,000, 20,000-25,000]
- **interests (12.0% coverage)**:
    - Examples: [yeni teknolojiler, sinema, futbol, görsel sanatlar, müzik, social services, education, environment, human rights, arts and culture, politics, science and technology, education, economic empowerment]
- **job_summary (5.5% coverage)**:
    - Examples: [Planning and carrying out curriculum and activities for bilingual class., sabıt kanat ve doner kanat ucusu yapabılır, Working At Department of psychiatry]
- **last_name (91.3% coverage)**:
    - Examples: [aksakaloğlu, aslan, aydin]
- **last_updated (62.6% coverage)**:
    - Examples: [2020-12-01 00:00:00.000, 2020-11-01 00:00:00.000, 2020-10-01 00:00:00.000]
- **last_updated_2 (86.7% coverage)**:
    - Examples: [2018-12-01 00:00:00.000, 2018-10-20 00:00:00.000, 2020-11-01 00:00:00.000]
- **linkedin_connections (87.7% coverage)**:
    - Examples: [0.0, 19.0, 2.0]
- **linkedin_url (91.3% coverage)**:
    - Examples: [https://www.linkedin.com/in/yağız-aksakaloğlu-50a02744, https://www.linkedin.com/in/asim-aslan-20ba6a2a, https://www.linkedin.com/in/olgun-aydin-b68a3651]
- **linkedin_username (91.3% coverage)**:
    - Examples: [yağız-aksakaloğlu-50a02744, asim-aslan-20ba6a2a, olgun-aydin-b68a3651]
- **locality (28.2% coverage)**:
    - Examples: [bursa, ankara, i̇stanbul]
- **location (91.3% coverage)**:
    - Examples: [bursa, bursa, turkey, turkey, aksaray, turkey]
- **location_continent (91.3% coverage)**:
    - Examples: [asia, europe, south america]
- **location_country (91.3% coverage)**:
    - Examples: [turkey, ukraine, venezuela]
- **location_geo (25.2% coverage)**:
    - Examples: [40.19,29.06, 39.91,32.84, 41.03,28.98]
- **metro (0.0% coverage)**:
    - Examples: [No non-blank examples found]
- **middle_initial (8.3% coverage)**:
    - Examples: [p, y, d]
- **middle_name (7.7% coverage)**:
    - Examples: [pelin, yalcin, koray]
- **mobile (0.0% coverage)**:
    - Examples: [No non-blank examples found]
- **postal_code (0.0% coverage)**:
    - Examples: [No non-blank examples found]
- **region (32.8% coverage)**:
    - Examples: [bursa, aksaray, ankara]
- **skills (33.3% coverage)**:
    - Examples: [logistics, business planning, business strategy, operations management, marketing, new business development, marketing strategy, supply chain, change management, customer service, strategic planning, food, renewable energy, food industry, broadcast, television, digital video, broadcast television, digital asset management, tapeless workflow, iptv, video, broadcast engineering, transcoding, streaming media, hd video, avid media composer, video editing, video servers, editing, vizrt, c#, vod, media production, multimedia, mpeg, encoding, new media, non linear editing, avid, video coding, orad, .net, wcf, asp.net, microsoft sql server, six sigma, quality management, apqp, sap, lean manufacturing, purchasing, industrial engineering, manufacturing engineering, root cause analysis, budget, iso, poka yoke, logistics, 5s, oee, automotive, production planning, supply chain management, supplier quality, fmea, engineering, strategic planning, minitab, quality system, factory, toyota production system, smed, change management, black belt, manufacturing, value stream mapping, manufacturing operations management, project planning, tqm, ts16949, operational excellence, kaizen, project management, product development, kanban, jit, process engineering, spc, supply chain, continuous improvement, mrp, dmaic, plant management, tpm]
- **start_date (32.4% coverage)**:
    - Examples: [1994, 2019-02, 2014-10]
- **street_address (0.0% coverage)**:
    - Examples: [No non-blank examples found]
- **sub_role (12.2% coverage)**:
    - Examples: [broadcasting, doctor, teacher]
- **summary (41.8% coverage)**:
    - Examples: [Expert of; business development with financial solution, investment & turnkey masshousing project, recycling, organic farms, proje sorumlusu / TOPUZLAR GRUP, broadcast engineer & .net software developer & MSCA-MCSE]
- **twitter_url (2.6% coverage)**:
    - Examples: [twitter.com/tanju_yayak, twitter.com/ilgenahmet, twitter.com/muhammedak01]
- **twitter_username (2.6% coverage)**:
    - Examples: [tanju_yayak, ilgenahmet, muhammedak01]
- **years_experience (46.2% coverage)**:
    - Examples: [32.0, 24.0, 10.0]

## SAMPLE QUERIES

1. Find software developers in London:
   - job_title CONTAINS "software developer" OR "software engineer"
   - location CONTAINS "London"

2. Find banking professionals in Turkey:
   - industry CONTAINS "banking"
   - location_country CONTAINS "Turkey"
   - linkedin_url IS NOT EMPTY

3. Find marketing directors with over 10 years experience:
   - job_title CONTAINS "marketing director" OR "director of marketing" 
   - years_experience > 10
   - email IS NOT EMPTY

4. Find C-level executives in tech companies in Europe:
   - job_title CONTAINS "CEO" OR "CTO" OR "CFO" OR "Chief"
   - industry CONTAINS "technology" OR "software" OR "IT"
   - location_continent CONTAINS "europe"

Your task is to analyze the user's query and transform it into an effective Elasticsearch query by:
1. Identifying the key job titles, industries, and locations from the user's request
2. Determining which other fields might be relevant to include
3. Specifying the appropriate operation (Contains, Exact Match, Is Empty, Is Not Empty) for each field
4. Handling variations and synonyms for job titles and industries`;

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
            database: "otc1_new_v2",
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
    console.error('Error processing OTC1 query:', error);
    
    return NextResponse.json(
      { error: 'Failed to process the query', details: error.message },
      { status: 500 }
    );
  }
} 