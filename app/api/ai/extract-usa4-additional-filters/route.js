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




// Database-specific prompts
const DATABASE_PROMPTS = {
  'usa4_new_v2': 'You are extracting additional filters for the USA Professionals database. Focus on parameters beyond job title, industry, and location.',
  'otc1_new_v2': 'You are extracting additional filters for the International Professionals database. Focus on parameters beyond job title, industry, and location such as company name, company size, skills, or experience level.',
  'eap1_new_v2': 'You are extracting additional filters for the Global B2B Contacts database. Focus on parameters beyond job title, industry, and location such as company name, seniority level, job functions, or start date.',
  'deez_3_v3': 'You are extracting additional filters for the Local Businesses database. Focus on parameters beyond business type and location such as business category, ratings, review counts, or technology usage.'
};

// Schema information for usa4_new_v2 database with coverage percentages
const USA4_SCHEMA_INFO = `
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

const OTC1_SCHEMA_INFO = `
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

const EAP1_SCHEMA_INFO = `
- **person_name (100.0% coverage)**: - Examples: [Phil Vu, Andrea Bloom, Marc Charalambous]
- **person_title (99.0% coverage)**: - Examples: [Director of Tech Support and Customer Service, Sr. Human Resources Manager, Operations manager]
- **person_email (95.6% coverage)**: - Examples: [phil.vu@policymap.com, andrea.bloom@sbdinc.com, marc.charalambous@thepasgroup.com.au]
- **person_phone (82.0% coverage)**: - Examples: [(215) 574-5896, +1 860-225-5111, +61 3 9902 5555]
- **Company Name (100.0% coverage)**: - Examples: [policymap llc, stanley black  decker, the pas group limited]
- **Original Values - [person_linkedin_url] (100.0% coverage)**: - Examples: [http://www.linkedin.com/in/phil-vu-b68b5a3, http://www.linkedin.com/in/andrea-bloom-84602235, http://www.linkedin.com/in/marc-charalambous-2471ba65]
- **current_organization_ids (4.4% coverage)**: - Examples: [['556d782873696411bc7f1a01'], ['54a11fc469702d8ed4dbf601'], ['54a1364869702d3cbb4f3301']]
- **id (100.0% coverage)**: - Examples: [59d2bb78f3e5bb2e259c2d7a, 594d71249d7968d77a08cd02, 5b4d28779be96953d7bc1c95]
- **index (100.0% coverage)**: - Examples: [contacts_v5, people_v7]
- **job_start_date (86.8% coverage)**: - Examples: [2013-10-01, 2010-05-01, 2013-07-01]
- **modality (100.0% coverage)**: - Examples: [contacts, people]
- **person_detailed_function (98.0% coverage)**: - Examples: [tech support customer service, hr, operations]
- **person_email_analyzed (95.6% coverage)**: - Examples: [phil.vu@policymap.com, andrea.bloom@sbdinc.com, marc.charalambous@thepasgroup.com.au]
- **person_email_status_cd (100.0% coverage)**: - Examples: [Verified, Unavailable, Extrapolated]
- **person_excluded_by_team_ids (0.0% coverage)**: - Examples: [No non-blank examples found]
- **person_extrapolated_email_confidence (59.4% coverage)**: - Examples: [0.6, 0.89, 0.88]
- **person_first_name_unanalyzed (100.0% coverage)**: - Examples: [phil, andrea, marc]
- **person_functions (55.0% coverage)**: - Examples: [['support'], ['human_resources'], ['operations']]
- **person_last_name_unanalyzed (100.0% coverage)**: - Examples: [vu, bloom, charalambous]
- **person_linkedin_url (100.0% coverage)**: - Examples: [https://www.linkedin.com/in/phil-vu-b68b5a3, https://www.linkedin.com/in/andrea-bloom-84602235, https://www.linkedin.com/in/marc-charalambous-2471ba65]
- **person_location_city (89.0% coverage)**: - Examples: [Philadelphia, New Baltimore, Melbourne]
- **person_location_city_with_state_or_country (89.0% coverage)**: - Examples: [Philadelphia, Pennsylvania, New Baltimore, Michigan, Melbourne, Australia]
- **person_location_country (97.8% coverage)**: - Examples: [United States, Australia, Brazil]
- **person_location_geojson (3.4% coverage)**: - Examples: [{'type': 'envelope', 'coordinates': [[-90.320515, 38.774349], [-90.166409, 38.5318519]]}, {'type': 'envelope', 'coordinates': [[2.0695258, 41.4695761], [2.2280099, 41.320004]]}, {'type': 'envelope', 'coordinates': [[11.360796, 48.2482197], [11.7228755, 48.0616018]]}]
- **person_location_postal_code (27.6% coverage)**: - Examples: [19107, 32792, 57108]
- **person_location_state (92.2% coverage)**: - Examples: [Pennsylvania, Michigan, Victoria]
- **person_location_state_with_country (92.2% coverage)**: - Examples: [Pennsylvania, US, Michigan, US, Victoria, Australia]
- **person_name_unanalyzed_downcase (100.0% coverage)**: - Examples: [phil vu, andrea bloom, marc charalambous]
- **person_num_linkedin_connections (4.4% coverage)**: - Examples: [369.0, 305.0, 500.0]
- **person_sanitized_phone (80.8% coverage)**: - Examples: [+12155745896, +18602255111, +61399025555]
- **person_seniority (99.0% coverage)**: - Examples: [director, manager, c_suite]
- **person_title_normalized (99.0% coverage)**: - Examples: [director tech support customer service, senior hr manager, operations manager]
- **predictive_scores (2.0% coverage)**: - Examples: [{'551e3ef07261695147160000': 0.9615956074326348}, {'551e3ef07261695147160000': 0.6932234376241984}, {'551e3ef07261695147160000': 0.14860378235268942}]
- **primary_title_normalized_for_faceting (99.0% coverage)**: - Examples: [Director Of Tech Support And Customer Service, Sr. Human Resources Manager, Operations Manager]
- **prospected_by_team_ids (95.8% coverage)**: - Examples: [['59d2b71e9d79686ff4fbc262'], ['590cd9259d7968ae61ca8e1a'], ['59b99d359d7968f8c82eb21f']]
- **random (4.4% coverage)**: - Examples: [0.2777291135862469, 0.1094204026414819, 0.8616356146521866]
- **relavence_boost (4.4% coverage)**: - Examples: [0.591350300563827, 0.972358510195238, 0.8216606101084865]
- **score (100.0% coverage)**: - Examples: [1]
- **type (100.0% coverage)**: - Examples: [contact, person]
`;

const DEEZ_SCHEMA_INFO = `
- **search_keyword (99.8% coverage)**: - Examples: [Car Dealership, Auto Repair, Restaurant]
- **name (100.0% coverage)**: - Examples: [Dino's Audio Video, Pages Past-Used & Rare Books, Approved Autos]
- **phone (87.2% coverage)**: - Examples: [13367637120, 19194562345, 15551234567]
- **email (45.3% coverage)**: - Examples: [pagespastbooks@gmail.com, info@dinos-av.com, contact@business.com]
- **website (52.1% coverage)**: - Examples: [http://dinos-av.com, https://business.com, www.company.com]
- **address (98.7% coverage)**: - Examples: [3116 Battleground Ave, 123 Main Street, 456 Oak Avenue]
- **category (83.6% coverage)**: - Examples: [Auto Customization, Retail, Vehicle Parts Shop]
- **city (99.6% coverage)**: - Examples: [Greensboro, Charlotte, Raleigh]
- **country (99.9% coverage)**: - Examples: [US, USA, United States]
- **region (99.6% coverage)**: - Examples: [NC, CA, TX]
- **search_city (99.8% coverage)**: - Examples: [Greensboro, Charlotte, Raleigh]
- **zip (99.2% coverage)**: - Examples: [27408, 28205, 27601]
- **ads_facebook (45.7% coverage)**: - Examples: [1.0, 0.0]
- **ads_instagram (45.7% coverage)**: - Examples: [1.0, 0.0]
- **ads_messenger (45.7% coverage)**: - Examples: [1.0, 0.0]
- **ads_yelp (45.7% coverage)**: - Examples: [1.0, 0.0]
- **googlestars (69.1% coverage)**: - Examples: [4.6, 4.3, 4.5]
- **googlereviewscount (68.9% coverage)**: - Examples: [117.0, 38.0, 24.0]
- **facebookstars (19.8% coverage)**: - Examples: [4.9, 5.0, 4.3]
- **facebookreviewscount (19.7% coverage)**: - Examples: [88.0, 156.0, 203.0]
- **yelpreviewscount (31.2% coverage)**: - Examples: [121.0, 87.0, 45.0]
- **yelpstars (31.2% coverage)**: - Examples: [2.5, 4.2, 3.8]
- **uses_shopify (70.5% coverage)**: - Examples: [n, y]
- **uses_wordpress (70.5% coverage)**: - Examples: [n, y]
`;

// Database schema mapping
const DATABASE_SCHEMAS = {
  'usa4_new_v2': USA4_SCHEMA_INFO,
  'otc1_new_v2': OTC1_SCHEMA_INFO,
  'eap1_new_v2': EAP1_SCHEMA_INFO,
  'deez_3_v3': DEEZ_SCHEMA_INFO
};

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
  }

  try {
    const { description, database } = await request.json();

    if (!description) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
    }

    if (!database) {
      return NextResponse.json({ error: 'Database parameter is required.' }, { status: 400 });
    }

    // Get database-specific schema and prompt
    const schemaInfo = DATABASE_SCHEMAS[database];
    const databasePrompt = DATABASE_PROMPTS[database];

    if (!schemaInfo || !databasePrompt) {
      return NextResponse.json({ error: 'Unsupported database.' }, { status: 400 });
    }

    console.log('=== ADDITIONAL FILTERS DEBUG ===');
    console.log('Database:', database);
    console.log('Query:', description);
    console.log('Using schema for:', database);
    console.log('===============================');

    // Extract additional filters using database-specific configuration
    const additionalFiltersResponse = await extractAdditionalFilters(description, schemaInfo, databasePrompt);
    
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
async function extractAdditionalFilters(description, schemaInfo, databasePrompt) {
  const systemPrompt = `
    ${databasePrompt}

    Database Schema Information:
    ${schemaInfo}

    IMPORTANT: Your task is to ONLY identify and extract parameters BEYOND the "big 3" standard filters:
    1. DO NOT extract / generate job titles keywords - these are handled by another system
    2. DO NOT extract / generate industry keywords - these are handled by another system 
    3. DO NOT extract / generate location keywords - these are handled by another system

    We will be using a "contains" operator on the database. So if the user says "I want to find a person who is a nurse",
    you should extract the keyword "nurse" and use it in the "contains" operator.

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

    If no additional parameters are identified, return:
    {
      "additionalFilters": [],
      "hasAdditionalFilters": false,
      "message": "No additional filter criteria identified beyond job title, industry, and location."
    }

    If additional parameters are found, return them with proper validation and coverage information.
`;

  try {
    const { object } = await generateObject({
      model: openai('gpt-4.1'),
      schema: AdditionalFiltersSchema,
      system: systemPrompt,
      prompt: `Extract additional filter parameters (beyond job title, industry, and location) from this. USER QUERY:\n\n"${description}"`,
      temperature: 0.1
    });

    console.log('=== AI EXTRACTION RESULT ===');
    console.log('Has additional filters:', object.hasAdditionalFilters);
    console.log('Filters found:', object.additionalFilters?.length || 0);
    if (object.additionalFilters?.length > 0) {
      console.log('Filter details:', JSON.stringify(object.additionalFilters, null, 2));
    }
    console.log('==========================');

    return object;
  } catch (error) {
    console.error("Error calling AI SDK:", error);
    return {
      additionalFilters: [],
      hasAdditionalFilters: false,
      message: "Failed to extract additional filter criteria.",
      error: "Invalid response format from AI service."
    };
  }
} 
