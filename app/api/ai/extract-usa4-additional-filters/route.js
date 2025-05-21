import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { esClient } from "@/utils/elasticsearch/client";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Schema information for usa4_new_v2 database with coverage percentages
const USA4_SCHEMA_INFO = `
Database Schema for USA4 (U.S. Professionals Database) with field coverage percentages:

- **Full name (100.0% coverage)**: - Examples: [lisa rice, melissa schellenberger, pam coe]
- **Job title (82.7% coverage)**: - Examples: [client care coordinator, nurse practitioner, regional data and improvement strategist]
- **Emails (86.3% coverage)**: - Examples: [lisa.rice@shaneco.com, melissa_schellenberger@yahoo.com, mschellenberger@gmail.com, mschellenberger@hotmail.com, pam.coe@education.ky.gov, pam.coe@kentucky.gov]
- **Phone numbers (36.2% coverage)**: - Examples: [+15026496466, +16512708005, +18122828974, +15028964501, +12705352044, +18592500766]
- **Company Size (53.6% coverage)**: - Examples: [501-1000, 11-50, 1-10]
- **Years Experience (61.7% coverage)**: - Examples: [11, 19, 33]
- **Twitter Username (3.1% coverage)**: - Examples: [pivierone, doug07838, susnjnes4judge]
- **Twitter Url (2.9% coverage)**: - Examples: [twitter.com/pivierone, twitter.com/doug07838, twitter.com/susnjnes4judge]
- **Summary (82.9% coverage)**: - Examples: [CSA II Shane Company, APRN at Norton Cancer Institute, Regional Data and Improvement Strategist at Kentucky Department of Education]
- **Sub Role (25.2% coverage)**: - Examples: [nursing, project_management, lawyer]
- **Street Address (23.9% coverage)**: - Examples: [823 west maxwell street, 4602 deerfield circle, 139 stonewall path]
- **Start Date (46.6% coverage)**: - Examples: [2017, 2012-07, 2019-04]
- **Skills (49.9% coverage)**: - Examples: [customer service, microsoft office, microsoft word, research, teamwork, front office, sales, hospitality management, teaching, event planning, budgets, powerpoint, public speaking, team building, training, hospitality industry, leadership, microsoft excel, strategic planning, outlook, time management, community outreach, inventory management, marketing, social media, communication, personal development, life skills, cpr certified, staff development, higher education, community outreach, program evaluation, special education, program development, educational leadership, curriculum development, instructional design, educational technology, teacher training, grant writing, teaching, curriculum design, grants, adult education, e learning]
- **Region (96.3% coverage)**: - Examples: [kentucky, iowa, united states]
- **Postal Code (21.6% coverage)**: - Examples: [40508, 40068, 40324]
- **Mobile (10.4% coverage)**: - Examples: [15026496466, 12705352044, 16063710889]
- **Original Values - [LinkedIn Url] (96.3% coverage)**: - Examples: [linkedin.com/in/lisa-rice-971bb26b, linkedin.com/in/melissa-schellenberger-44879a35, linkedin.com/in/pam-coe-37a29213]
- **Middle Name (5.0% coverage)**: - Examples: [lou, house kingdom, kathy]
- **Middle Initial (11.4% coverage)**: - Examples: [h, l, k]
- **Metro (81.9% coverage)**: - Examples: [louisville, kentucky, lexington, kentucky, bowling green, kentucky]
- **Location Geo (92.9% coverage)**: - Examples: [38.25,-85.75, 37.98,-84.47, 36.99,-86.44]
- **Location Country (96.3% coverage)**: - Examples: [united states, calico, sweeney]
- **Location Continent (95.8% coverage)**: - Examples: [north america, Opportunity of a life-time to treat individuals; using evidenced based treatment, Hazelden training, a great team to live my passion., * Manage all building automation systems designs, installations, operations, maintenance and upgrades campus wide.\n* Develop and manage a retro commissioning program. Communicate results of this program with senior management.\n* Identify energy savings opportunities and make recommendations to achieve more energy efficient operation.]
- **Location (96.0% coverage)**: - Examples: [louisville, kentucky, united states, lexington, kentucky, united states, bowling green, kentucky, united states]
- **Locality (96.0% coverage)**: - Examples: [louisville, lexington, bowling green]
- **Linkedin Connections (94.2% coverage)**: - Examples: [170, 80, 499]
- **LinkedIn Username (96.3% coverage)**: - Examples: [lisa-rice-971bb26b, melissa-schellenberger-44879a35, pam-coe-37a29213]
- **LinkedIn Url (95.4% coverage)**: - Examples: [https://www.linkedin.com/in/lisa-rice-971bb26b, https://www.linkedin.com/in/melissa-schellenberger-44879a35, https://www.linkedin.com/in/pam-coe-37a29213]
- **Last Updated (92.3% coverage)**: - Examples: [2020-09-01 00:00:00.000, 2020-07-01 00:00:00.000, 2020-04-01 00:00:00.000]
- **Last Name (96.3% coverage)**: - Examples: [rice, schellenberger, coe]
- **Job Summary (14.8% coverage)**: - Examples: [Internal Medicine/Family Practice, biological medicine, cancer and chronic disease management, nutritional and wellness counseling, weight loss center, Direct all aspects of non-profit organization providing recovery-based housing and support services to adults with serious mental illness. Accountable for strategic planning, human resources, finance management, program development and expansion, and policy making., Coordinates operations of the Center for eLearning in efforts to serve division chairs and faculty in the course scheduling process, and ensure that the quality of online courses is maintained. Coordinate fulltime and part-time facilitator assignments for online course, oversees contract management and performs periodic course checks to ensure continuity of instruction. Manage budget for the Center for eLearning, to include tracking expenses and provide routine analysis of expenses and available funding.]
- **Interests (13.7% coverage)**: - Examples: [new technology, classic literature, art, scuba diving, architecture, engineering, theater, children, computers, human biology, drug development, pharmaceutics, environment, education, science and technology, sports, health, sweepstakes, investing, exercise, electronics]
- **Inferred Salary (61.7% coverage)**: - Examples: [55,000-70,000, 70,000-85,000, 100,000-150,000]
- **Industry 2 (41.0% coverage)**: - Examples: [health, operations, legal]
- **Industry (89.4% coverage)**: - Examples: [retail, hospital & health care, education management]
- **Github Username (0.8% coverage)**: - Examples: [twitter.com/swdesignpros, midwestwebdeveloper, twitter.com/lifespringinc]
- **Github Url (1.2% coverage)**: - Examples: [sherwin williams, github.com/midwestwebdeveloper, lifespring health systems]
- **Gender (85.4% coverage)**: - Examples: [female, male, 101 prospect avenue northeast]
- **First Name (96.0% coverage)**: - Examples: [lisa, melissa, pam]
- **Facebook Username (22.9% coverage)**: - Examples: [pam.coe, carly.carver.12, holly.roach.9]
- **Facebook Url (22.9% coverage)**: - Examples: [facebook.com/pam.coe, facebook.com/carly.carver.12, facebook.com/holly.roach.9]
- **Countries (96.1% coverage)**: - Examples: [united states, new zealand; philippines; united states, united states; australia]
- **Company Website (42.2% coverage)**: - Examples: [state.ky.us, covenanthealthclinic.com, psbdlaw.com]
- **Company Twitter Url (25.8% coverage)**: - Examples: [twitter.com/cedarlakeky, twitter.com/lashgroup, twitter.com/stelizabethnky]
- **Company Name (77.3% coverage)**: - Examples: [university of louisville physicians, kentucky department of education, covenant health clinic]
- **Company Location Street Address (38.3% coverage)**: - Examples: [401 east chestnut street, 500 mero street, 200 south 5th street]
- **Company Location Region (45.9% coverage)**: - Examples: [kentucky, georgia, south carolina]
- **Company Location Postal Code (38.2% coverage)**: - Examples: [40202, 40601, 40502]
- **Company Location Name (50.7% coverage)**: - Examples: [louisville, kentucky, united states, frankfort, kentucky, united states, georgia, united states]
- **Company Location Metro (38.7% coverage)**: - Examples: [louisville, kentucky, lexington, kentucky, charlotte, north carolina]
- **Company Location Locality (43.4% coverage)**: - Examples: [louisville, frankfort, lexington]
- **Company Location Geo (42.2% coverage)**: - Examples: [38.25,-85.75, 38.20,-84.87, 37.98,-84.47]
- **Company Location Country (50.1% coverage)**: - Examples: [united states, australia, brazil]
- **Company Location Continent (49.9% coverage)**: - Examples: [north america, oceania, south america]
- **Company Location Address Line 2 (6.0% coverage)**: - Examples: [suite 404, suite 120, suite 200]
- **Company Linkedin Url (52.0% coverage)**: - Examples: [linkedin.com/company/university-of-louisville-physicians, linkedin.com/company/kentucky-department-of-education, linkedin.com/company/covenant-health-clinic]
- **Company Industry (51.3% coverage)**: - Examples: [hospital & health care, education management, medical practice]
- **Company Founded (38.9% coverage)**: - Examples: [2011.0, 1997.0, 2015.0]
- **Company Facebook Url (23.1% coverage)**: - Examples: [facebook.com/kydeptofed, facebook.com/cedarlakeinc, facebook.com/lashgroup.abc]
- **Birth Year (7.5% coverage)**: - Examples: [1971.0, 1980.0, 1934.0]
- **Birth Date (6.2% coverage)**: - Examples: [1971-07-18, 1980-01-16, 1934-08-15]
- **Address Line 2 (1.2% coverage)**: - Examples: [apartment 2, apartment 101, apartment h]
`;

// Additional filters extraction system prompt
const ADDITIONAL_FILTERS_PROMPT = `
You are an AI assistant specialized in extracting additional search filters from user descriptions for the USA4 database (U.S. Professionals Database).

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

The response should be a JSON object with an "additionalFilters" array containing the identified parameters.

Example response format:
{
  "additionalFilters": [
    {
      "column": "Gender",
      "condition": "equals",
      "values": ["female"],
      "coverage": 85.4,
      "note": null
    },
    {
      "column": "Company Size",
      "condition": "contains",
      "values": ["11-50", "51-200"],
      "coverage": 53.6,
      "note": null
    }
  ],
  "hasAdditionalFilters": true,
  "message": "Found 2 additional filter criteria beyond job title, industry, and location."
}

If no additional parameters are identified, return:
{
  "additionalFilters": [],
  "hasAdditionalFilters": false,
  "message": "No additional filter criteria identified beyond job title, industry, and location."
}
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

    // Extract additional filters beyond job title, industry, and location
    const additionalFiltersResponse = await extractAdditionalFilters(description);
    
    // If successful, return the additional filters
    return NextResponse.json(additionalFiltersResponse);

  } catch (error) {
    console.error('API error in extract-usa4-additional-filters:', error);
    let errorMessage = 'Failed to process your request.';
    if (error.response) {
      errorMessage = error.response.data.error.message || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Function to extract additional filters beyond job title, industry, and location
async function extractAdditionalFilters(description) {
  const messages = [
    {
      role: "system",
      content: `${ADDITIONAL_FILTERS_PROMPT}\n\n${USA4_SCHEMA_INFO}`
    },
    {
      role: "user",
      content: `Extract additional filter parameters (beyond job title, industry, and location) from this description for searching the USA4 database:\n\n"${description}"`
    }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: messages,
      temperature: 0.1, // Low temperature for consistent, accurate extractions
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    // Get the extracted parameters from the AI response
    const content = response.choices[0].message.content;
    
    try {
      // Parse the JSON response
      const parsedResponse = JSON.parse(content);
      
      // Validate filters against database (for fields with sufficient coverage)
      if (parsedResponse.additionalFilters && parsedResponse.additionalFilters.length > 0) {
        const validatedFilters = await validateFiltersWithDatabase(parsedResponse.additionalFilters);
        parsedResponse.additionalFilters = validatedFilters;
        
        // Update the message based on validation results
        const validFilterCount = validatedFilters.filter(f => f.matchFound).length;
        if (validFilterCount === 0 && parsedResponse.additionalFilters.length > 0) {
          parsedResponse.message = "Additional filter criteria were identified, but they may not yield optimal results as exact matches were not found in the database.";
        } else if (validFilterCount < parsedResponse.additionalFilters.length) {
          parsedResponse.message = `Found ${validFilterCount} validated additional filter criteria beyond job title, industry, and location. Some criteria may have limited matches.`;
        }
      }
      
      return parsedResponse;
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      // Return a fallback response
      return {
        additionalFilters: [],
        hasAdditionalFilters: false,
        message: "Failed to extract additional filter criteria.",
        error: "Invalid response format from AI service."
      };
    }
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error;
  }
}

// Function to validate extracted filters against the database
async function validateFiltersWithDatabase(filters) {
  const validatedFilters = [];
  
  for (const filter of filters) {
    // Skip validation for low coverage fields (<20%) to avoid unnecessary database calls
    if (filter.coverage < 20) {
      filter.matchFound = false;
      filter.validatedValues = [];
      filter.note = `Field has low coverage (${filter.coverage}%), validation skipped to avoid false negatives.`;
      validatedFilters.push(filter);
      continue;
    }
    
    // Map the API filter column name to the Elasticsearch field name
    const esFieldName = mapColumnToESField(filter.column);
    
    if (!esFieldName) {
      filter.matchFound = false;
      filter.validatedValues = [];
      filter.note = "Could not map to a valid database field.";
      validatedFilters.push(filter);
      continue;
    }
    
    try {
      // For each value, check if it exists in the database
      const validatedValues = [];
      let matchFound = false;
      
      for (const value of filter.values) {
        // Construct a simple term query to check if the value exists
        const query = {
          term: {
            [esFieldName]: value.toLowerCase() // Lowercase for case-insensitive matching
          }
        };
        
        // Execute the query
        const { count } = await esClient.count({
          index: "usa4_new_v2",
          query: query
        });
        
        if (count > 0) {
          validatedValues.push(value);
          matchFound = true;
        }
      }
      
      // Update the filter with validation results
      filter.matchFound = matchFound;
      filter.validatedValues = validatedValues;
      
      if (validatedValues.length === 0) {
        filter.note = "No matches found in database for the provided values.";
      } else if (validatedValues.length < filter.values.length) {
        filter.note = "Some values were not found in the database and were removed.";
      } else {
        filter.note = null;
      }
      
      validatedFilters.push(filter);
      
    } catch (error) {
      console.error(`Error validating filter for ${filter.column}:`, error);
      filter.matchFound = false;
      filter.validatedValues = [];
      filter.note = "Database validation failed due to an error.";
      validatedFilters.push(filter);
    }
  }
  
  return validatedFilters;
}

// Helper function to map UI column names to Elasticsearch field names
function mapColumnToESField(columnName) {
  // This is a simple mapping; expand as needed based on the actual ES schema
  const mapping = {
    "Gender": "gender",
    "Company Size": "organization_size",
    "Company Name": "organization_name",
    "Skills": "skills",
    "Years Experience": "years_experience",
    "Inferred Salary": "inferred_salary",
    "LinkedIn Connections": "linkedin_connections",
    // Add more mappings as needed
  };
  
  return mapping[columnName] || columnName.toLowerCase().replace(/ /g, '_');
} 