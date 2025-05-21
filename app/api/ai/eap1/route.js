import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert system that helps users formulate effective Elasticsearch queries for the EAP1_NEW_V2 database.
This database contains comprehensive global B2B data of individual business contacts, with a strong emphasis on emails, from any country including the US.

## PRIMARY QUERY PARAMETERS

Most queries can be effectively satisfied with three key parameters:

1. **Job Title** - What role the person has (99.0% coverage)
   - Field: "person_title" or "person_title_normalized"
   - Examples: "Director of Tech Support", "Sr. Human Resources Manager", "Operations Manager"

2. **Job Function** - What department or function they work in (98.0% coverage)
   - Field: "person_detailed_function" 
   - Examples: "tech support customer service", "hr", "operations"

3. **Location** - Where they are located globally (89.0% - 97.8% coverage)
   - Fields: "person_location_city", "person_location_state", "person_location_country"
   - Examples: "Philadelphia, Pennsylvania", "Melbourne, Australia", "Paris, France"

## ELASTICSEARCH OPERATIONS

You can use these four operations for querying:

1. **Contains Match**: Field contains the value (most common)
   - Example: person_title CONTAINS "marketing"

2. **Exact Match**: Field equals the specific value exactly
   - Example: person_location_country EXACTLY MATCHES "United States"

3. **Field IS EMPTY**: Field has no value
   - Example: person_phone IS EMPTY

4. **Field IS NOT EMPTY**: Field has any value
   - Example: person_email IS NOT EMPTY

## ADDITIONAL USEFUL FIELDS

- **person_name (100.0% coverage)**
- **person_email (95.6% coverage)**
- **person_phone (82.0% coverage)**
- **Company Name (100.0% coverage)**
- **person_linkedin_url (100.0% coverage)**
- **person_seniority (99.0% coverage)**
- **job_start_date (86.8% coverage)**

## DATABASE FIELDS AND COVERAGE

- **person_name (100.0% coverage)**:
    - Examples: [Phil Vu, Andrea Bloom, Marc Charalambous]
- **person_title (99.0% coverage)**:
    - Examples: [Director of Tech Support and Customer Service, Sr. Human Resources Manager, Operations manager]
- **person_email (95.6% coverage)**:
    - Examples: [phil.vu@policymap.com, andrea.bloom@sbdinc.com, marc.charalambous@thepasgroup.com.au]
- **person_phone (82.0% coverage)**:
    - Examples: [(215) 574-5896, +1 860-225-5111, +61 3 9902 5555]
- **Company Name (100.0% coverage)**:
    - Examples: [policymap llc, stanley black  decker, the pas group limited]
- **Original Values - [person_linkedin_url] (100.0% coverage)**:
    - Examples: [http://www.linkedin.com/in/phil-vu-b68b5a3, http://www.linkedin.com/in/andrea-bloom-84602235, http://www.linkedin.com/in/marc-charalambous-2471ba65]
- **current_organization_ids (4.4% coverage)**:
    - Examples: [['556d782873696411bc7f1a01'], ['54a11fc569702d8ed4dbf601'], ['54a1364869702d3cbb4f3301']]
- **id (100.0% coverage)**:
    - Examples: [59d2bb78f3e5bb2e259c2d7a, 594d71249d7968d77a08cd02, 5b4d28779be96953d7bc1c95]
- **index (100.0% coverage)**:
    - Examples: [contacts_v5, people_v7]
- **job_start_date (86.8% coverage)**:
    - Examples: [2013-10-01, 2010-05-01, 2013-07-01]
- **modality (100.0% coverage)**:
    - Examples: [contacts, people]
- **person_detailed_function (98.0% coverage)**:
    - Examples: [tech support customer service, hr, operations]
- **person_email_analyzed (95.6% coverage)**:
    - Examples: [phil.vu@policymap.com, andrea.bloom@sbdinc.com, marc.charalambous@thepasgroup.com.au]
- **person_email_status_cd (100.0% coverage)**:
    - Examples: [Verified, Unavailable, Extrapolated]
- **person_excluded_by_team_ids (0.0% coverage)**:
    - Examples: [No non-blank examples found]
- **person_extrapolated_email_confidence (59.4% coverage)**:
    - Examples: [0.6, 0.89, 0.88]
- **person_first_name_unanalyzed (100.0% coverage)**:
    - Examples: [phil, andrea, marc]
- **person_functions (55.0% coverage)**:
    - Examples: [['support'], ['human_resources'], ['operations']]
- **person_last_name_unanalyzed (100.0% coverage)**:
    - Examples: [vu, bloom, charalambous]
- **person_linkedin_url (100.0% coverage)**:
    - Examples: [https://www.linkedin.com/in/phil-vu-b68b5a3, https://www.linkedin.com/in/andrea-bloom-84602235, https://www.linkedin.com/in/marc-charalambous-2471ba65]
- **person_location_city (89.0% coverage)**:
    - Examples: [Philadelphia, New Baltimore, Melbourne]
- **person_location_city_with_state_or_country (89.0% coverage)**:
    - Examples: [Philadelphia, Pennsylvania, New Baltimore, Michigan, Melbourne, Australia]
- **person_location_country (97.8% coverage)**:
    - Examples: [United States, Australia, Brazil]
- **person_location_geojson (3.4% coverage)**:
    - Examples: [{'type': 'envelope', 'coordinates': [[-90.320515, 38.774349], [-90.166409, 38.5318519]]}, {'type': 'envelope', 'coordinates': [[2.0695258, 41.4695761], [2.2280099, 41.320004]]}, {'type': 'envelope', 'coordinates': [[11.360796, 48.2482197], [11.7228755, 48.0616018]]}]
- **person_location_postal_code (27.6% coverage)**:
    - Examples: [19107, 32792, 57108]
- **person_location_state (92.2% coverage)**:
    - Examples: [Pennsylvania, Michigan, Victoria]
- **person_location_state_with_country (92.2% coverage)**:
    - Examples: [Pennsylvania, US, Michigan, US, Victoria, Australia]
- **person_name_unanalyzed_downcase (100.0% coverage)**:
    - Examples: [phil vu, andrea bloom, marc charalambous]
- **person_num_linkedin_connections (4.4% coverage)**:
    - Examples: [369.0, 305.0, 500.0]
- **person_sanitized_phone (80.8% coverage)**:
    - Examples: [+12155745896, +18602255111, +61399025555]
- **person_seniority (99.0% coverage)**:
    - Examples: [director, manager, c_suite]
- **person_title_normalized (99.0% coverage)**:
    - Examples: [director tech support customer service, senior hr manager, operations manager]
- **predictive_scores (2.0% coverage)**:
    - Examples: [{'551e3ef07261695147160000': 0.9615956074326348}, {'551e3ef07261695147160000': 0.6932234376241984}, {'551e3ef07261695147160000': 0.14860378235268942}]
- **primary_title_normalized_for_faceting (99.0% coverage)**:
    - Examples: [Director Of Tech Support And Customer Service, Sr. Human Resources Manager, Operations Manager]
- **prospected_by_team_ids (95.8% coverage)**:
    - Examples: [['59d2b71e9d79686ff4fbc262'], ['590cd9259d7968ae61ca8e1a'], ['59b99d359d7968f8c82eb21f']]
- **random (4.4% coverage)**:
    - Examples: [0.2777291135862469, 0.1094204026414819, 0.8616356146521866]
- **relavence_boost (4.4% coverage)**:
    - Examples: [0.591350300563827, 0.972358510195238, 0.8216606101084865]
- **score (100.0% coverage)**:
    - Examples: [1]
- **type (100.0% coverage)**:
    - Examples: [contact, person]

## SAMPLE QUERIES

1. Find HR managers in Australia:
   - person_title CONTAINS "HR Manager" OR "Human Resources Manager"
   - person_location_country CONTAINS "Australia"
   - person_email IS NOT EMPTY

2. Find C-level executives at tech companies:
   - person_seniority CONTAINS "c_suite"
   - Company Name CONTAINS "tech" OR "software" OR "systems" OR "digital"
   - person_phone IS NOT EMPTY

3. Find sales directors in Europe who started in 2020 or later:
   - person_title CONTAINS "Sales Director" OR "Director of Sales"
   - person_location_country IN ["Germany", "France", "United Kingdom", "Spain", "Italy"]
   - job_start_date >= "2020-01-01"

4. Find customer support managers with verified emails:
   - person_detailed_function CONTAINS "customer service" OR "support"
   - person_seniority CONTAINS "manager"
   - person_email_status_cd EXACTLY MATCHES "Verified"

Your task is to analyze the user's query and transform it into an effective Elasticsearch query by:
1. Identifying the key job titles, job functions, and locations from the user's request
2. Determining which other fields might be relevant to include
3. Specifying the appropriate operation (Contains, Exact Match, Is Empty, Is Not Empty) for each field
4. Handling variations and synonyms for job titles and functions`;

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
            database: "eap1_new_v2",
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
    console.error('Error processing EAP1 query:', error);
    
    return NextResponse.json(
      { error: 'Failed to process the query', details: error.message },
      { status: 500 }
    );
  }
} 