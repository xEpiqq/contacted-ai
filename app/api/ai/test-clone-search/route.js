import { NextResponse } from 'next/server';
import { esClient } from "@/utils/elasticsearch/client";
import { buildESQueryFromFilters } from "@/utils/elasticsearch/buildQuery";

export async function POST(request) {
  try {
    const { jobTitles, industryKeywords, locationInfo, limit = 10, offset = 0 } = await request.json();

    if (!jobTitles || !Array.isArray(jobTitles) || jobTitles.length === 0) {
      return NextResponse.json({ error: 'At least one job title is required.' }, { status: 400 });
    }

    // Build filters from the provided criteria
    const filters = [];
    
    // Add job title filter
    if (jobTitles.length > 0) {
      // Use the verified/optimized job titles (winner), which could be AI-suggested or database-matched
      const usedTitles = jobTitles.filter(title => title.trim() !== '');
      
      if (usedTitles.length > 0) {
        filters.push({
          column: "Job title",
          condition: "contains",
          tokens: usedTitles,
          pendingText: "",
          subop: ""
        });
      }
    }
    
    // Add industry filter if available
    if (industryKeywords && industryKeywords.length > 0) {
      const usedIndustries = industryKeywords.filter(industry => industry.trim() !== '');
      
      if (usedIndustries.length > 0) {
        filters.push({
          column: "Industry",
          condition: "contains",
          tokens: usedIndustries,
          pendingText: "",
          subop: "AND"
        });
      }
    }
    
    // Add location filter if available
    if (locationInfo && locationInfo.value && locationInfo.locationType !== "none") {
      // Always use the original AI-generated location value, NOT the verified match
      const locationValue = locationInfo.value.trim();
      
      // Skip "United States" as it's redundant for the USA database
      if (locationValue.toLowerCase() === "united states") {
        // Don't add any location filter
      } else {
        // Determine location columns to use based on location type
        // We'll create multiple filters combined with OR logic for better coverage
        let locationColumns = [];
        
        switch (locationInfo.locationType) {
          case "city":
            if (locationValue.includes(",")) {
              // For cities with state qualifier (like "Springfield, Michigan")
              // Use Location primarily 
              locationColumns = ["Location"];
              
              // Add a secondary column filter for the city name alone
              const cityOnly = locationValue.split(",")[0].trim();
              if (cityOnly) {
                filters.push({
                  column: "Locality",
                  condition: "contains",
                  tokens: [cityOnly],
                  pendingText: "",
                  subop: "OR" // This connects to the main location filter
                });
              }
            } else {
              // For standalone city names (likely prominent cities like "San Francisco")
              // Try multiple columns with OR logic
              locationColumns = ["Locality", "Location", "Metro"];
            }
            break;
            
          case "state":
            // For states, use Region primarily but also check Location
            locationColumns = ["Region", "Location"];
            break;
            
          case "postal_code":
            // Postal codes are specific enough
            locationColumns = ["Postal Code"];
            break;
            
          case "metro":
            // Try both Metro and Location
            locationColumns = ["Metro", "Location"];
            break;
            
          case "region":
            // Try both Region and Location
            locationColumns = ["Region", "Location"];
            break;
            
          default:
            // Default case, try multiple columns
            locationColumns = ["Location", "Locality", "Region", "Metro"];
        }
        
        // Add the main location filter using the primary column
        if (locationColumns.length > 0) {
          filters.push({
            column: locationColumns[0],
            condition: "contains",
            tokens: [locationValue],
            pendingText: "",
            subop: "AND" // This connects to previous filters
          });
          
          // For additional columns (beyond the first), add as separate filters with OR logic
          for (let i = 1; i < locationColumns.length; i++) {
            filters.push({
              column: locationColumns[i],
              condition: "contains",
              tokens: [locationValue],
              pendingText: "",
              subop: "OR" // Use OR to expand search results across columns
            });
          }
        }
      }
    }
    
    // Build elasticsearch query from filters
    const filterQuery = buildESQueryFromFilters(filters);
    const esQuery = {
      constant_score: {
        filter: filterQuery
      }
    };
    
    // Execute the search query
    const searchResults = await esClient.search({
      index: "usa4_new_v2",
      from: offset,
      size: limit,
      query: esQuery,
      request_cache: true
    });
    
    // Get total count (in a separate call for accuracy)
    const { count } = await esClient.count({
      index: "usa4_new_v2",
      query: esQuery
    });
    
    // Format results
    const results = searchResults.hits?.hits?.map(hit => hit._source) || [];
    
    return NextResponse.json({
      results,
      totalCount: count,
      filters,
      success: true
    });
    
  } catch (error) {
    console.error("Error in test-clone-search API:", error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process search request.',
      success: false
    }, { status: 500 });
  }
} 