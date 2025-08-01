import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextResponse } from 'next/server';


const DATABASE_MAPPINGS = {
  "usa4_new_v2": {
    jobTitleColumn: "Job title",
    locationColumns: ["Location", "Locality", "Region", "Postal Code", "Metro"],
    industryColumn: "Industry",
    additionalFiltersRoute: "/api/ai/extract-usa4-additional-filters",
    locationPrompt: `
      FOR LOCATION (USA Professionals Database):
      Available columns: Locality (96.0%), Region (96.3%), Metro (81.9%), Postal Code (21.6%)
      - Extract city, state, country components using clean, simple terms
      - For multiple cities: combine with "or" (e.g., "New York or Los Angeles") → maps to Locality column
      - For multiple states: combine with "or" (e.g., "California or Texas") → maps to Region column  
      - If user specifies just "United States" without city/state, still extract as country (no filter will be applied)
      - AVOID postal codes unless specifically requested (low coverage)
      - Set hasLocation to true if any location is mentioned, false otherwise
    `
  },
  "eap1_new_v2": {
    jobTitleColumn: "person_title",
    locationColumns: ["person_location_city", "person_location_state", "person_location_country", "person_location_postal_code"],
    industryColumn: "person_detailed_function",
    additionalFiltersRoute: "/api/ai/extract-eap1-additional-filters",
    locationPrompt: `
      FOR LOCATION (Global B2B Contacts Database):
      Available columns: person_location_city, person_location_state, person_location_country, person_location_postal_code
      - Extract city, state, country components using clean, simple terms
      - Focus on country-level filtering for international contacts
      - Cities and states when specified for better targeting
      - Set hasLocation to true if any location is mentioned, false otherwise
    `
  },
  "otc1_new_v2": {
    jobTitleColumn: "job_title",
    locationColumns: ["location", "locality", "region", "location_country"],
    industryColumn: "industry",
    additionalFiltersRoute: "/api/ai/extract-otc1-additional-filters",
    locationPrompt: `
      FOR LOCATION (International Professionals Database):
      Available columns: location, locality, region, location_country
      - Extract city, state, country components using clean, simple terms
      - Focus on country-level filtering for international professionals
      - Use locality for cities, location_country for countries
      - Set hasLocation to true if any location is mentioned, false otherwise
    `
  },
  "deez_3_v3": {
    jobTitleColumn: null, // Local businesses don't have individual job titles
    businessTypeColumn: "search_keyword", // For business types instead of job titles
    locationColumns: ["location", "locality", "region"],
    industryColumn: "category",
    additionalFiltersRoute: "/api/ai/extract-deez-additional-filters",
    locationPrompt: `
      FOR LOCATION (US Local Businesses Database):
      Available columns: location, locality, region
      - Extract city, state, country components using clean, simple terms
      - Focus on city/locality for local business targeting
      - Use region for state-level filtering
      - Set hasLocation to true if any location is mentioned, false otherwise
    `
  }
};

// Database selection schema
const DatabaseSelectionSchema = z.object({
  needsFollowUp: z.boolean(),
  followUpReason: z.string().optional(),
  database: z.enum(['usa4_new_v2', 'otc1_new_v2', 'eap1_new_v2', 'deez_3_v3']).optional(),
  needsAdditionalFilters: z.boolean().optional()
});

// Extraction schema
const ExtractionSchema = z.object({
  jobTitles: z.array(z.string()),
  industryKeywords: z.array(z.string()),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  hasLocation: z.boolean()
});



// Helper function to call the appropriate additional filters extraction API
async function fetchAdditionalFilters(description, route) {
  const response = await fetch(new URL(route, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ description }),
  });
  
  return await response.json();
}

// Helper function to create location filters specifically for usa4_new_v2
function createUSA4LocationFilters(extraction) {
  const locationFilters = [];
  
  // Don't add location filters if no location was extracted
  if (!extraction.hasLocation) {
    return locationFilters;
  }
  
  const city = extraction.city?.toLowerCase().trim();
  const state = extraction.state?.toLowerCase().trim(); 
  const country = extraction.country?.toLowerCase().trim();
  
  // Rule: If they specify "united states", don't add additional filter since usa4 database selection is sufficient
  if (country === 'united states' || country === 'usa' || country === 'us') {
    // Only add state/city if they specified more specific location
    if (!city && !state) {
      return locationFilters; // Just "united states" - no additional filter needed
    }
  }
  
  // Handle city/cities - map to Locality column (96.0% coverage)
  if (city) {
    // Handle multiple cities (e.g., "New York or Los Angeles")
    const cities = city.split(/\s+(?:or|and)\s+|\s*,\s*/)
      .map(c => c.trim())
      .filter(c => c.length > 0);
    
    if (cities.length > 0) {
      locationFilters.push({
        column: "Locality",
        tokens: cities
      });
    }
  }
  
  // Handle state/states - map to Region column (96.3% coverage) 
  if (state) {
    // Handle multiple states (e.g., "California or Texas")
    const states = state.split(/\s+(?:or|and)\s+|\s*,\s*/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    if (states.length > 0) {
      locationFilters.push({
        column: "Region", 
        tokens: states
      });
    }
  }
  
  // Note: We don't use Postal Code unless specifically requested (21.6% coverage)
  // Note: We don't use Metro automatically - it's similar to Location but with different format
  
  return locationFilters;
}

// Helper function to create location filters for eap1_new_v2 (Global B2B Contacts)
function createEAP1LocationFilters(extraction) {
  const locationFilters = [];
  
  if (!extraction.hasLocation) {
    return locationFilters;
  }
  
  const city = extraction.city?.toLowerCase().trim();
  const state = extraction.state?.toLowerCase().trim(); 
  const country = extraction.country?.toLowerCase().trim();
  
  // For global B2B, prioritize country-level filtering
  if (country) {
    locationFilters.push({
      column: "person_location_country",
      tokens: [country]
    });
  }
  
  // Add state if specified
  if (state) {
    locationFilters.push({
      column: "person_location_state",
      tokens: [state]
    });
  }
  
  // Add city if specified
  if (city) {
    const cities = city.split(/\s+(?:or|and)\s+|\s*,\s*/)
      .map(c => c.trim())
      .filter(c => c.length > 0);
    
    if (cities.length > 0) {
      locationFilters.push({
        column: "person_location_city",
        tokens: cities
      });
    }
  }
  
  return locationFilters;
}

// Helper function to create location filters for otc1_new_v2 (International Professionals)
function createOTC1LocationFilters(extraction) {
  const locationFilters = [];
  
  if (!extraction.hasLocation) {
    return locationFilters;
  }
  
  const city = extraction.city?.toLowerCase().trim();
  const state = extraction.state?.toLowerCase().trim(); 
  const country = extraction.country?.toLowerCase().trim();
  
  // For international professionals, prioritize country
  if (country) {
    locationFilters.push({
      column: "location_country",
      tokens: [country]
    });
  }
  
  // Add locality (city) if specified
  if (city) {
    const cities = city.split(/\s+(?:or|and)\s+|\s*,\s*/)
      .map(c => c.trim())
      .filter(c => c.length > 0);
    
    if (cities.length > 0) {
      locationFilters.push({
        column: "locality",
        tokens: cities
      });
    }
  }
  
  // Add region (state) if specified
  if (state) {
    const states = state.split(/\s+(?:or|and)\s+|\s*,\s*/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    if (states.length > 0) {
      locationFilters.push({
        column: "region",
        tokens: states
      });
    }
  }
  
  return locationFilters;
}

// Helper function to create location filters for deez_3_v3 (US Local Businesses)
function createDEEZLocationFilters(extraction) {
  const locationFilters = [];
  
  if (!extraction.hasLocation) {
    return locationFilters;
  }
  
  const city = extraction.city?.toLowerCase().trim();
  const state = extraction.state?.toLowerCase().trim(); 
  const country = extraction.country?.toLowerCase().trim();
  
  // For local businesses, focus on city/locality first
  if (city) {
    const cities = city.split(/\s+(?:or|and)\s+|\s*,\s*/)
      .map(c => c.trim())
      .filter(c => c.length > 0);
    
    if (cities.length > 0) {
      locationFilters.push({
        column: "locality",
        tokens: cities
      });
    }
  }
  
  // Add region (state) if specified
  if (state) {
    const states = state.split(/\s+(?:or|and)\s+|\s*,\s*/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    if (states.length > 0) {
      locationFilters.push({
        column: "region",
        tokens: states
      });
    }
  }
  
  return locationFilters;
}

// Helper function to create pre-formatted filters from AI extraction results
function createFiltersFromExtraction(extraction, locationInfo, dbConfig, database, additionalFilters = []) {
  const filters = [];
  
  // Job Titles / Business Types
  if (database === "deez_3_v3") {
    // For local businesses, use businessTypes with businessTypeColumn
    if (extraction.jobTitles && extraction.jobTitles.length > 0 && dbConfig.businessTypeColumn) {
      filters.push({
        column: dbConfig.businessTypeColumn,
        condition: "contains",
        tokens: extraction.jobTitles, // AI uses jobTitles field for business types too
        pendingText: "",
        subop: filters.length === 0 ? "" : "AND"
      });
    }
  } else {
    // For professional databases, use jobTitles
    if (extraction.jobTitles && extraction.jobTitles.length > 0 && dbConfig.jobTitleColumn) {
      filters.push({
        column: dbConfig.jobTitleColumn,
        condition: "contains",
        tokens: extraction.jobTitles,
        pendingText: "",
        subop: filters.length === 0 ? "" : "AND"
      });
    }
  }
  
  // Industry Keywords (skip for DEEZ since business types are handled above)
  if (database !== "deez_3_v3" && extraction.industryKeywords && extraction.industryKeywords.length > 0 && dbConfig.industryColumn) {
    filters.push({
      column: dbConfig.industryColumn,
      condition: "contains", 
      tokens: extraction.industryKeywords,
      pendingText: "",
      subop: filters.length === 0 ? "" : "AND"
    });
  }
  
  // Location Info
  if (database === "usa4_new_v2") {
    // Use specialized USA4 location handling
    const usa4LocationFilters = createUSA4LocationFilters(extraction);
    usa4LocationFilters.forEach(locationFilter => {
      filters.push({
        column: locationFilter.column,
        condition: "contains",
        tokens: locationFilter.tokens,
        pendingText: "",
        subop: filters.length === 0 ? "" : "AND"
      });
    });
  } else if (database === "eap1_new_v2") {
    const eap1LocationFilters = createEAP1LocationFilters(extraction);
    eap1LocationFilters.forEach(locationFilter => {
      filters.push({
        column: locationFilter.column,
        condition: "contains",
        tokens: locationFilter.tokens,
        pendingText: "",
        subop: filters.length === 0 ? "" : "AND"
      });
    });
  } else if (database === "otc1_new_v2") {
    const otc1LocationFilters = createOTC1LocationFilters(extraction);
    otc1LocationFilters.forEach(locationFilter => {
      filters.push({
        column: locationFilter.column,
        condition: "contains",
        tokens: locationFilter.tokens,
        pendingText: "",
        subop: filters.length === 0 ? "" : "AND"
      });
    });
  } else if (database === "deez_3_v3") {
    const deezLocationFilters = createDEEZLocationFilters(extraction);
    deezLocationFilters.forEach(locationFilter => {
      filters.push({
        column: locationFilter.column,
        condition: "contains",
        tokens: locationFilter.tokens,
        pendingText: "",
        subop: filters.length === 0 ? "" : "AND"
      });
         });
   }
  
  // Additional Filters
  if (additionalFilters && additionalFilters.length > 0) {
    additionalFilters.forEach(filter => {
      filters.push({
        column: filter.column,
        condition: "contains",
        tokens: Array.isArray(filter.values) ? filter.values : [filter.values],
        pendingText: "",
        subop: filters.length === 0 ? "" : "AND"
      });
    });
  }
  
  // If no filters were created, add an empty one
  if (filters.length === 0) {
    filters.push({
      column: "",
      condition: "contains",
      tokens: [],
      pendingText: "",
      subop: ""
    });
  }
  
  return filters;
}

// Database-specific extraction prompts
function getExtractionPrompt(database) {
  let basePrompt;
  
  if (database === "deez_3_v3") {
    // Local businesses prompt
    basePrompt = `
      You are a content extractor for local business searches. Extract relevant search criteria from the user's query. When generating keywords,
      keep in mind that all of the local business data was scraped from google maps.

      Extract core business type keywords that would help find local businesses. Focus on the service/business type, not full phrases.
      Examples: "solar companies" → ["solar"], "auto repair shops" → ["auto repair"], "restaurants" → ["restaurant"]
      Guidelines: Remove generic words like "companies", "businesses", "shops". Keep specific descriptors. Use 1-5 keywords max.

      FOR INDUSTRY KEYWORDS:
      Skip industry keywords for local businesses - business types cover this. Return empty array.
    `;
  } else {
    // Professionals prompt  
    basePrompt = `
      You are a content extractor with 3 separate functions.
      YOU DO NOT NEED TO EXTRACT KEYWORDS WHERE NONE EXIST OR THEY HAVE ALREADY BEEN REASONABLY COVERED BY ANOTHER FUNCTION.

      IMPORTANT:
      - Sometimes the user will specify multiple job titles, multiple industries, multiple locations, generate the appropriate
      amount of keywords accordingly.
      
      JOB EXTRACTOR FUNCTION:
      This function's purpose is to take the "USERS QUERY" which is written in 
      natural language, and translate it into a set of keywords that can be used to search a database of linkedin users.
      Within this database of linkedin users is a field called "job title", which is where your terms will be plugged
      in to locate these people. These terms must be good. Good, as in, would likely appear as someones actual
      professional title on linkedin. Generally speaking, the more keywords you produce THE BETTER. But don't do 
      so at the expense of data accuracy. Meaning, producing keywords that will likely include people in the results
      that are not true to the users natural language query. Aim for 10 keywords. Feel free to generate less if you 
      believe it will hurt the integrity of the results.
      KEEP IN MIND:
      1. We are using a "contains" operator to search, rather than a perfect string match. If the word or set of
          words is contained it will appear. Hence, by way of analogy, "knife" "sharp knife" "dull knife" would be 
          redundant, say, if the user were allowed to search for silverware--once again, this is an analogy,
          but the point stands. You could encapsulate all knifes with a singular term.
      2. Do not include keywords that would likely encapsulate a large number of unrelated jobs. 
          For example, "Senior" as a singular search term would likely be a bad idea. Many job titles within many
          industries may contain that word.

      KEYWORD EXTRACTOR FUNCTION:
      Extract 1-2 industry keywords (preferably 1 word) that represent the industry the user is targeting. 
      Only if explicitly stated/implied. Don't be redundant with job titles. Where relevant is key. DO NOT be redundant
      (producing industry keyword where search would clearly be covered by job title alone) Example of redundancy: If i was
      looking for "carpenters" for example, job titles would be sufficient, and the industry keyword "carpentry" would be redundant.
      If industry explicitly stated / implied, then go ahead.

      LOCATION EXTRACTOR FUNCTION:
      Understand that this role is the most reductive, meaning, when you limit a query to a geographical location,
      you will by design be cutting the size of the results a lot. Your main objective in all cases is to maximize the
      results while still being accurate to the users natural language query. 
      KEEP IN MIND:
      1. If user just specifies a country, and that country is the US, that has already been handled by the database
      that was chosen prior (it is a usa database), thus never add it in the query.
      2. In some cases the user will specifies multiple cities, states, countries, etc. Feel free to generate the
      appropriate amount of keywords to include all of their given locations.
      3. The user may give a vague location such as "springfield", I consider it vague because there are many springfields

    `;
  }

  // Get location prompt from database mappings
  const dbConfig = DATABASE_MAPPINGS[database] || DATABASE_MAPPINGS["usa4_new_v2"];
  const locationPrompt = dbConfig.locationPrompt || "";

  return basePrompt + locationPrompt + `

    Return jobTitles array, industryKeywords array, city, state, country, and hasLocation boolean.
  `;
}

export async function POST(request) {
  const { description } = await request.json();

    // Step 1: Database Selection
    const { object: dbSelection } = await generateObject({
      model: openai('gpt-4.1'),
      schema: DatabaseSelectionSchema,
      system: `
        CRITICAL FIELD RULES:
        - If needsFollowUp = true: ONLY return needsFollowUp and followUpReason (omit database and needsAdditionalFilters)
        - If needsFollowUp = false: ONLY return needsFollowUp, database, and needsAdditionalFilters (omit followUpReason)
        - set needsAdditionalFilters = true if the USERS QUERY is requesting data beyond basic job title/industry/location

        Select the best database below based on the USER'S QUERY.
        Note: think through these questions.
        - Does the user want people or local businesses? (choose deez_3_v3 if local businesses)
        - Does the user want people inside the united states? (choose usa4_new_v2, or eap1_new_v2 with country "united states")
        - Does the user want people outside the united states? (choose otc1_new_v2 if so)
        If no location is specified, assume the user wants people inside the united states.
        
        Here are all the columns in all of our databases, plus 1 example for each of what data might be in them:
        US Local Businesses Datbase (deez_3_v3):
        search_keyword: [Car Dealership], name: [Dino's Audio Video], phone: [13367637120], email: [pagespastbooks@gmail.com], website: [http://dinos-av.com], address: [3116 Battleground Ave], category: [Auto Customization], city: [Greensboro], country: [US], region: [NC], search_city: [Greensboro], zip: [27408], ads_facebook: [1.0], ads_instagram: [1.0], ads_messenger: [1.0], ads_yelp: [1.0], domain_expiration: [2025-03-23 00:00:00.000], domain_nameserver: [hostgator.com], domain_registrar: [Launchpad.com Inc.], domain_registration: [2014-03-23 00:00:00.000], email_host: [google.com], facebook: [https://www.facebook.com/landrover], facebookpixel: [n], facebookreviewscount: [88.0], facebookstars: [4.9], g_maps: [claimed], g_maps_claimed: [https://maps.google.com/maps/place/Dino's+Audio+Video/@36.11686706543,-79.838005065918,17z/data=!3m1!4b1!4m5!3m4!1s0x0:0x57935964FAC1AEB3!8m2!3d36.11686706543!4d-79.838005065918], google_rank: [5.0], googleanalytics: [n], googlepixel: [n], googlereviewscount: [117.0], googlestars: [4.6], instagram: [https://www.instagram.com/dinos_av], instagram_average_comments: [1.0], instagram_average_likes: [21.0], instagram_category: [Auto Dealers], instagram_followers: [2150.0], instagram_following: [446.0], instagram_highlight_reel_count: [23.0], instagram_is_business_account: [1.0], instagram_is_verified: [1.0], instagram_media_count: [499.0], instagram_name: [Dino's Audio Video], linkedin: [https://www.linkedin.com/company/ivoiremotor-s.a], linkedinanalytics: [n], mobilefriendly: [y], seo_schema: [n], twitter: [https://www.twitter.com/dno5577], uses_shopify: [n], uses_wordpress: [n], yelpreviewscount: [121.0], yelpstars: [2.5]
        USA Professionals Database (usa4_new_v2):
        Full name: [lisa rice], Job title: [client care coordinator], Emails: [lisa.rice@shaneco.com], Phone numbers: [+15026496466], Company Size: [501-1000], Years Experience: [11], Twitter Username: [pivierone], Twitter Url: [twitter.com/pivierone], Summary: [CSA II Shane Company], Sub Role: [nursing], Street Address: [823 west maxwell street], Start Date: [2017], Skills: [customer service], Region: [kentucky], Postal Code: [40508], Mobile: [15026496466], Original Values - [LinkedIn Url]: [linkedin.com/in/lisa-rice-971bb26b], Middle Name: [lou], Middle Initial: [h], Metro: [louisville, kentucky], Location Geo: [38.25,-85.75], Location Country: [united states], Location Continent: [north america], Location: [louisville, kentucky, united states], Locality: [louisville], Linkedin Connections: [170], LinkedIn Username: [lisa-rice-971bb26b], LinkedIn Url: [https://www.linkedin.com/in/lisa-rice-971bb26b], Last Updated: [2020-09-01 00:00:00.000], Last Name: [rice], Job Summary: [Internal Medicine/Family Practice], Interests: [new technology], Inferred Salary: [55,000-70,000], Industry 2: [health], Industry: [retail], Github Username: [twitter.com/swdesignpros], Github Url: [sherwin williams], Gender: [female], First Name: [lisa], Facebook Username: [pam.coe], Facebook Url: [facebook.com/pam.coe], Countries: [united states], Company Website: [state.ky.us], Company Twitter Url: [twitter.com/cedarlakeky], Company Name: [university of louisville physicians], Company Location Street Address: [401 east chestnut street], Company Location Region: [kentucky], Company Location Postal Code: [40202], Company Location Name: [louisville, kentucky, united states], Company Location Metro: [louisville, kentucky], Company Location Locality: [louisville], Company Location Geo: [38.25,-85.75], Company Location Country: [united states], Company Location Continent: [north america], Company Location Address Line 2: [suite 404], Company Linkedin Url: [linkedin.com/company/university-of-louisville-physicians], Company Industry: [hospital & health care], Company Founded: [2011.0], Company Facebook Url: [facebook.com/kydeptofed], Birth Year: [1971.0], Birth Date: [1971-07-18], Address Line 2: [apartment 2]
        International Professionals (otc1_new_v2):
        full_name: [yağız aksakaloğlu], job_title: [akbank aksaray Å ubesiÌ], email: [yaaz3158@hotmail.com], phone_number: [+905555372142], Original Values - [linkedin_url]: [linkedin.com/in/yağız-aksakaloğlu-50a02744], address_line_2: [https://www.linkedin.com/in/ebru-yakin-3216a841], birth_date: [ebru-yakin-3216a841], birth_year: [1970], company_facebook_url: [facebook.com/temavakfi], company_founded: [1973], company_industry: [banking], company_linkedin_url: [linkedin.com/company/akbank], company_location_address_line_2: [N/A], company_location_continent: [asia], company_location_country: [turkey], company_location_geo: [38.45,37.86], company_location_locality: [i̇zmir], company_location_metro: [i̇stanbul], company_location_name: [izmir, turkey], company_location_postal_code: [35620], company_location_region: [i̇zmir], company_location_street_address: [barbaros mah. begonya sok. no:3], company_name: [akbank], company_size: [10001+], company_twitter_url: [twitter.com/temavakfi], company_website: [akbank.com], countries: [turkey], facebook_url: [facebook.com/asimas98], facebook_username: [asimas98], first_name: [yağız], gender: [male], github_url: [github.com/asimas98], github_username: [asimas98], id: [47304485], industry: [public policy], industry_2: [N/A], inferred_salary: [<$50k], interests: [economic development], job_summary: [technical lead at vestel defense industry co. location ankara, turkey industry defense & space], last_name: [aksakaloğlu], last_updated: [2018-12-01 00:00:00.000], last_updated_2: [2018-12-01 00:00:00.000], linkedin_connections: [0], linkedin_url: [https://www.linkedin.com/in/yağız-aksakaloğlu-50a02744], linkedin_username: [yağız-aksakaloğlu-50a02744], locality: ["aydin, turkey"], location: [turkey], location_continent: [asia], location_country: [turkey], location_geo: [37.8380,27.8456], metro: [aydin], middle_initial: [a], middle_name: [ali], mobile: [905555372142], postal_code: [09100], region: [aydin], skills: [c++], start_date: [2011-06-01], street_address: [efeler], sub_role: [management], summary: ["specialties: c++, java, c"], twitter_url: [twitter.com/asimas98], twitter_username: [asimas98], years_experience: [13]
        Global B2B Contacts (eap1_new_v2):
        person_name: [Phil Vu], person_title: [Director of Tech Support and Customer Service], person_email: [phil.vu@policymap.com], person_phone: [(215) 574-5896], Company Name: [policymap llc], Original Values - [person_linkedin_url]: [http://www.linkedin.com/in/phil-vu-b68b5a3], current_organization_ids: [['556d782873696411bc7f1a01']], id: [59d2bb78f3e5bb2e259c2d7a], index: [contacts_v5], job_start_date: [2013-10-01], modality: [contacts], person_detailed_function: [tech support customer service], person_email_analyzed: [phil.vu@policymap.com], person_email_status_cd: [Verified], person_excluded_by_team_ids: [N/A], person_extrapolated_email_confidence: [0.6], person_first_name_unanalyzed: [phil], person_functions: [['support']], person_last_name_unanalyzed: [vu], person_linkedin_url: [https://www.linkedin.com/in/phil-vu-b68b5a3], person_location_city: [Philadelphia], person_location_city_with_state_or_country: [Philadelphia, Pennsylvania], person_location_country: [United States], person_location_geojson: [{'type': 'envelope', 'coordinates': [[-90.320515, 38.774349], [-90.166409, 38.5318519]]}], person_location_postal_code: [19107], person_location_state: [Pennsylvania], person_location_state_with_country: [Pennsylvania, US], person_name_unanalyzed_downcase: [phil vu], person_num_linkedin_connections: [369.0], person_sanitized_phone: [+12155745896], person_seniority: [director], person_title_normalized: [director tech support customer service], predictive_scores: [{'551e3ef07261695147160000': 0.9615956074326348}], primary_title_normalized_for_faceting: [Director Of Tech Support And Customer Service], prospected_by_team_ids: [['59d2b71e9d79686ff4fbc262']], random: [0.2777291135862469], relavence_boost: [0.591350300563827], score: [1], type: [contact]

        Followup to the frontend may be required in two circumstances (set needsFollowUp = true if so):
        1. No columns within our databases could reasonable satisfy the request
        2. The user is being vague, or again, wants data we don't have
        - Requesting a local business outside of the united states (we dont have that data)
        - Unclear if they want people contacts or company contacts, "solar contacts" doesn't mean either
        - Location is not specific enough, "x in springfield" is vague, "x in springfield, illinois" is not. Some cities
        are certainly unique enough to be used as standalone, but many cities are not.
        Note: do not make the user specify a location if no location is specified.
        Note: do not tell the user to specify data that we don't have

        If followup is used, make it short, concise, simple, actionable, friendly, no jargon, 1 sentence.
        `,
      prompt: `USERS QUERY: "${description}"`,
      temperature: 0
    });

  // If follow-up is needed, return early with follow-up reason
  if (dbSelection.needsFollowUp) {
    return NextResponse.json({
      needsFollowUp: true,
      followUpReason: dbSelection.followUpReason
    });
  }

    // Get database-specific column configuration
    const dbConfig = DATABASE_MAPPINGS[dbSelection.database];

    // Step 2: Content Extraction
    const { object: extraction } = await generateObject({
      model: openai('gpt-4.1'),
      schema: ExtractionSchema,
    system: getExtractionPrompt(dbSelection.database),
      prompt: `USERS QUERY: "${description}"`,
      temperature: 0.3
    });

  // Location validation no longer needed - all databases now have specialized handlers
    let locationInfo = {
      hasLocation: false,
      components: { city: "", state: "", zip: "", country: "", region: "" },
      locationFilters: []
    };

  // Build the base response
  let combinedResults = {
    needsFollowUp: false,
      database: dbSelection.database,
      recommendedDatabase: dbSelection.database,
      actualDatabase: dbSelection.database,
    filters: [],
    hasAdditionalFilters: false,
    additionalFiltersMessage: null
  };

  // Step 3: Fetch additional filters if database selection indicates they're needed
  let additionalFiltersData = [];
  if (dbSelection.needsAdditionalFilters) {
    const additionalFiltersResponse = await fetchAdditionalFilters(description, dbConfig.additionalFiltersRoute);
    
    // Add additional filters data to the combined results if there are any
    if (additionalFiltersResponse && additionalFiltersResponse.hasAdditionalFilters) {
      additionalFiltersData = additionalFiltersResponse.additionalFilters;
      combinedResults.additionalFiltersMessage = additionalFiltersResponse.message;
      combinedResults.hasAdditionalFilters = true;
    }
  }

  // Create pre-formatted filters using the helper function
  combinedResults.filters = createFiltersFromExtraction(
    extraction, 
    locationInfo, 
    dbConfig, 
    dbSelection.database, 
    additionalFiltersData
  );

  return NextResponse.json(combinedResults);
}