import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert system that helps users formulate effective Elasticsearch queries for the USA4_NEW_V2 database.
This database contains comprehensive data on professionals located within the USA.

## PRIMARY QUERY PARAMETERS

Most queries can be effectively satisfied with three key parameters:

1. **Job Title** - What role the person has (82.7% coverage)
   - Field: "Job title"
   - Examples: "software engineer", "marketing director", "nurse practitioner"

2. **Industry** - What sector or field they work in (89.4% coverage)
   - Field: "Industry" 
   - Examples: "healthcare", "technology", "education", "finance"

3. **Location** - Where in the USA they are located (96.0% coverage)
   - Field: "Location" (includes city, state, country)
   - Examples: "San Francisco, California", "New York", "Chicago, Illinois"

## ELASTICSEARCH OPERATIONS

You can use these four operations for querying:

1. **Contains Match**: Field contains the value (most common)
   - Example: Industry CONTAINS "healthcare"

2. **Exact Match**: Field equals the specific value exactly
   - Example: Location EXACTLY MATCHES "Louisville, Kentucky, United States"

3. **Field IS EMPTY**: Field has no value
   - Example: Phone numbers IS EMPTY

4. **Field IS NOT EMPTY**: Field has any value
   - Example: LinkedIn Url IS NOT EMPTY

## ADDITIONAL USEFUL FIELDS

- **Full name (100.0% coverage)**
- **Emails (86.3% coverage)**
- **Phone numbers (36.2% coverage)**
- **LinkedIn Url (95.4% coverage)**
- **Skills (49.9% coverage)**
- **Gender (85.4% coverage)**
- **Company Name (77.3% coverage)**

## DATABASE FIELDS AND COVERAGE

- **Full name (100.0% coverage)**:
    - Examples: [lisa rice, melissa schellenberger, pam coe]
- **Job title (82.7% coverage)**:
    - Examples: [client care coordinator, nurse practitioner, regional data and improvement strategist]
- **Emails (86.3% coverage)**:
    - Examples: [lisa.rice@shaneco.com, melissa_schellenberger@yahoo.com, mschellenberger@gmail.com, mschellenberger@hotmail.com, pam.coe@education.ky.gov, pam.coe@kentucky.gov]
- **Phone numbers (36.2% coverage)**:
    - Examples: [+15026496466, +16512708005, +18122828974, +15028964501, +12705352044, +18592500766]
- **Company Size (53.6% coverage)**:
    - Examples: [501-1000, 11-50, 1-10]
- **Years Experience (61.7% coverage)**:
    - Examples: [11, 19, 33]
- **Twitter Username (3.1% coverage)**:
    - Examples: [pivierone, doug07838, susnjnes4judge]
- **Twitter Url (2.9% coverage)**:
    - Examples: [twitter.com/pivierone, twitter.com/doug07838, twitter.com/susnjnes4judge]
- **Summary (82.9% coverage)**:
    - Examples: [CSA II Shane Company, APRN at Norton Cancer Institute, Regional Data and Improvement Strategist at Kentucky Department of Education]
- **Sub Role (25.2% coverage)**:
    - Examples: [nursing, project_management, lawyer]
- **Street Address (23.9% coverage)**:
    - Examples: [823 west maxwell street, 4602 deerfield circle, 139 stonewall path]
- **Start Date (46.6% coverage)**:
    - Examples: [2017, 2012-07, 2019-04]
- **Skills (49.9% coverage)**:
    - Examples: [customer service, microsoft office, microsoft word, research, teamwork, front office, sales, hospitality management, teaching, event planning, budgets, powerpoint, public speaking, team building, training, hospitality industry, leadership, microsoft excel, strategic planning, outlook, time management, community outreach, inventory management, marketing, social media, communication, personal development, life skills, cpr certified, staff development, higher education, community outreach, program evaluation, special education, program development, educational leadership, curriculum development, instructional design, educational technology, teacher training, grant writing, teaching, curriculum design, grants, adult education, e learning]
- **Region (96.3% coverage)**:
    - Examples: [kentucky, iowa, united states]
- **Postal Code (21.6% coverage)**:
    - Examples: [40508, 40068, 40324]
- **Mobile (10.4% coverage)**:
    - Examples: [15026496466, 12705352044, 16063710889]
- **Original Values - [LinkedIn Url] (96.3% coverage)**:
    - Examples: [linkedin.com/in/lisa-rice-971bb26b, linkedin.com/in/melissa-schellenberger-44879a35, linkedin.com/in/pam-coe-37a29213]
- **Middle Name (5.0% coverage)**:
    - Examples: [lou, house kingdom, kathy]
- **Middle Initial (11.4% coverage)**:
    - Examples: [h, l, k]
- **Metro (81.9% coverage)**:
    - Examples: [louisville, kentucky, lexington, kentucky, bowling green, kentucky]
- **Location Geo (92.9% coverage)**:
    - Examples: [38.25,-85.75, 37.98,-84.47, 36.99,-86.44]
- **Location Country (96.3% coverage)**:
    - Examples: [united states, calico, sweeney]
- **Location Continent (95.8% coverage)**:
    - Examples: [north america, Opportunity of a life-time to treat individuals; using evidenced based treatment, Hazelden training, a great team to live my passion., * Manage all building automation systems designs, installations, operations, maintenance and upgrades campus wide.\n* Develop and manage a retro commissioning program. Communicate results of this program with senior management.\n* Identify energy savings opportunities and make recommendations to achieve more energy efficient operation.]
- **Location (96.0% coverage)**:
    - Examples: [louisville, kentucky, united states, lexington, kentucky, united states, bowling green, kentucky, united states]
- **Locality (96.0% coverage)**:
    - Examples: [louisville, lexington, bowling green]
- **Linkedin Connections (94.2% coverage)**:
    - Examples: [170, 80, 499]
- **LinkedIn Username (96.3% coverage)**:
    - Examples: [lisa-rice-971bb26b, melissa-schellenberger-44879a35, pam-coe-37a29213]
- **LinkedIn Url (95.4% coverage)**:
    - Examples: [https://www.linkedin.com/in/lisa-rice-971bb26b, https://www.linkedin.com/in/melissa-schellenberger-44879a35, https://www.linkedin.com/in/pam-coe-37a29213]
- **Last Updated (92.3% coverage)**:
    - Examples: [2020-09-01 00:00:00.000, 2020-07-01 00:00:00.000, 2020-04-01 00:00:00.000]
- **Last Name (96.3% coverage)**:
    - Examples: [rice, schellenberger, coe]
- **Job Summary (14.8% coverage)**:
    - Examples: [Internal Medicine/Family Practice, biological medicine, cancer and chronic disease management, nutritional and wellness counseling, weight loss center, Direct all aspects of non-profit organization providing recovery-based housing and support services to adults with serious mental illness. Accountable for strategic planning, human resources, finance management, program development and expansion, and policy making., Coordinates operations of the Center for eLearning in efforts to serve division chairs and faculty in the course scheduling process, and ensure that the quality of online courses is maintained. Coordinate fulltime and part-time facilitator assignments for online course, oversees contract management and performs periodic course checks to ensure continuity of instruction. Manage budget for the Center for eLearning, to include tracking expenses and provide routine analysis of expenses and available funding.]
- **Interests (13.7% coverage)**:
    - Examples: [new technology, classic literature, art, scuba diving, architecture, engineering, theater, children, computers, human biology, drug development, pharmaceutics, environment, education, science and technology, sports, health, sweepstakes, investing, exercise, electronics]
- **Inferred Salary (61.7% coverage)**:
    - Examples: [55,000-70,000, 70,000-85,000, 100,000-150,000]
- **Industry 2 (41.0% coverage)**:
    - Examples: [health, operations, legal]
- **Industry (89.4% coverage)**:
    - Examples: [retail, hospital & health care, education management]
- **Github Username (0.8% coverage)**:
    - Examples: [twitter.com/swdesignpros, midwestwebdeveloper, twitter.com/lifespringinc]
- **Github Url (1.2% coverage)**:
    - Examples: [sherwin williams, github.com/midwestwebdeveloper, lifespring health systems]
- **Gender (85.4% coverage)**:
    - Examples: [female, male, 101 prospect avenue northeast]
- **First Name (96.0% coverage)**:
    - Examples: [lisa, melissa, pam]
- **Facebook Username (22.9% coverage)**:
    - Examples: [pam.coe, carly.carver.12, holly.roach.9]
- **Facebook Url (22.9% coverage)**:
    - Examples: [facebook.com/pam.coe, facebook.com/carly.carver.12, facebook.com/holly.roach.9]
- **Countries (96.1% coverage)**:
    - Examples: [united states, new zealand; philippines; united states, united states; australia]
- **Company Website (42.2% coverage)**:
    - Examples: [state.ky.us, covenanthealthclinic.com, psbdlaw.com]
- **Company Twitter Url (25.8% coverage)**:
    - Examples: [twitter.com/cedarlakeky, twitter.com/lashgroup, twitter.com/stelizabethnky]
- **Company Name (77.3% coverage)**:
    - Examples: [university of louisville physicians, kentucky department of education, covenant health clinic]
- **Company Location Street Address (38.3% coverage)**:
    - Examples: [401 east chestnut street, 500 mero street, 200 south 5th street]
- **Company Location Region (45.9% coverage)**:
    - Examples: [kentucky, georgia, south carolina]
- **Company Location Postal Code (38.2% coverage)**:
    - Examples: [40202, 40601, 40502]
- **Company Location Name (50.7% coverage)**:
    - Examples: [louisville, kentucky, united states, frankfort, kentucky, united states, georgia, united states]
- **Company Location Metro (38.7% coverage)**:
    - Examples: [louisville, kentucky, lexington, kentucky, charlotte, north carolina]
- **Company Location Locality (43.4% coverage)**:
    - Examples: [louisville, frankfort, lexington]
- **Company Location Geo (42.2% coverage)**:
    - Examples: [38.25,-85.75, 38.20,-84.87, 37.98,-84.47]
- **Company Location Country (50.1% coverage)**:
    - Examples: [united states, australia, brazil]
- **Company Location Continent (49.9% coverage)**:
    - Examples: [north america, oceania, south america]
- **Company Location Address Line 2 (6.0% coverage)**:
    - Examples: [suite 404, suite 120, suite 200]
- **Company Linkedin Url (52.0% coverage)**:
    - Examples: [linkedin.com/company/university-of-louisville-physicians, linkedin.com/company/kentucky-department-of-education, linkedin.com/company/covenant-health-clinic]
- **Company Industry (51.3% coverage)**:
    - Examples: [hospital & health care, education management, medical practice]
- **Company Founded (38.9% coverage)**:
    - Examples: [2011.0, 1997.0, 2015.0]
- **Company Facebook Url (23.1% coverage)**:
    - Examples: [facebook.com/kydeptofed, facebook.com/cedarlakeinc, facebook.com/lashgroup.abc]
- **Birth Year (7.5% coverage)**:
    - Examples: [1971.0, 1980.0, 1934.0]
- **Birth Date (6.2% coverage)**:
    - Examples: [1971-07-18, 1980-01-16, 1934-08-15]
- **Address Line 2 (1.2% coverage)**:
    - Examples: [apartment 2, apartment 101, apartment h]

## SAMPLE QUERIES

1. Find software engineers in San Francisco:
   - Job title CONTAINS "software engineer"
   - Location CONTAINS "San Francisco"

2. Find HR directors at healthcare companies:
   - Job title CONTAINS "HR director" OR "human resources director"
   - Industry CONTAINS "healthcare" OR "hospital"
   - LinkedIn Url IS NOT EMPTY

3. Find marketing professionals with social media skills in New York:
   - Job title CONTAINS "marketing"
   - Skills CONTAINS "social media"
   - Location CONTAINS "New York"

4. Find senior executives in the finance industry:
   - Job title CONTAINS "CFO" OR "Chief Financial Officer" OR "VP Finance" OR "Finance Director"
   - Industry CONTAINS "finance" OR "banking" OR "investment"
   - Location IS NOT EMPTY

## RESPONSE FORMAT

You MUST respond with a valid JSON object containing a 'fields' array of query parameters. Each field object should have 'field', 'operation', and 'value' properties.

For example, if a user asks "Find me software engineers in California who know Python", you should generate:
{
  "fields": [
    {"field": "Job title", "operation": "CONTAINS", "value": "software engineer"},
    {"field": "Location", "operation": "CONTAINS", "value": "California"},
    {"field": "Skills", "operation": "CONTAINS", "value": "python"}
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
            database: "usa4_new_v2",
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
    console.error('Error processing USA4 query:', error);
    
    return NextResponse.json(
      { error: 'Failed to process the query', details: error.message },
      { status: 500 }
    );
  }
} 