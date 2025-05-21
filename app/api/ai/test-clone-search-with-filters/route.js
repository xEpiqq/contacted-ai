import { NextResponse } from 'next/server';
import { esClient } from "@/utils/elasticsearch/client";
import { buildESQueryFromFilters } from "@/utils/elasticsearch/buildQuery";

export async function POST(request) {
  try {
    const { filters, limit = 10, offset = 0 } = await request.json();

    // Validate that filters is a proper array
    if (!filters || !Array.isArray(filters)) {
      return NextResponse.json({ error: 'Filters must be a valid array.' }, { status: 400 });
    }

    // Validate that filters contains at least one valid filter rule
    const validFilters = filters.filter(filter => {
      // A filter is valid if:
      // - It has a column property that's a non-empty string
      // - AND (it has a condition that's "is empty" or "is not empty" OR it has tokens that's a non-empty array)
      return (
        typeof filter.column === 'string' && 
        filter.column.trim() !== '' && 
        (
          filter.condition === 'is empty' || 
          filter.condition === 'is not empty' ||
          (Array.isArray(filter.tokens) && filter.tokens.length > 0)
        )
      );
    });

    if (validFilters.length === 0) {
      return NextResponse.json({ error: 'At least one valid filter is required.' }, { status: 400 });
    }
    
    // Separate standard filters (location) and additional filters
    const locationFilters = validFilters.filter(filter => 
      isLocationFilter(filter.column)
    );
    
    const nonLocationFilters = validFilters.filter(filter => 
      !isLocationFilter(filter.column)
    );
    
    // Process location filters to improve search results
    const processedLocationFilters = processLocationFilters(locationFilters);
    
    // Combine processed location filters with non-location filters
    const allProcessedFilters = [...processedLocationFilters, ...nonLocationFilters];
    
    // Build elasticsearch query from filters
    const filterQuery = buildESQueryFromFilters(allProcessedFilters);
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
      filters: allProcessedFilters,
      success: true
    });
    
  } catch (error) {
    console.error("Error in test-clone-search-with-filters API:", error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process search request.',
      success: false
    }, { status: 500 });
  }
}

/**
 * Helper function to check if a column is a location-related filter
 */
function isLocationFilter(column) {
  const locationColumns = ["Location", "Locality", "Region", "Metro", "Postal Code"];
  return locationColumns.includes(column);
}

/**
 * Process location filters to implement hierarchical location searching
 * This expands single location filters into multiple OR filters across relevant columns
 */
function processLocationFilters(filters) {
  const result = [];
  let lastWasLocation = false;
  
  for (let i = 0; i < filters.length; i++) {
    const filter = { ...filters[i] };
    
    // Get location value (assuming first token for simplicity)
    if (filter.tokens && filter.tokens.length > 0) {
      const locationValue = filter.tokens[0].trim();
      
      // Skip "United States" as it's redundant for USA database
      if (locationValue.toLowerCase() === "united states") {
        continue;
      }
      
      // Expand the single location filter into multiple OR filters for broader coverage
      const expandedFilters = expandLocationFilter(filter.column, locationValue, lastWasLocation);
      result.push(...expandedFilters);
      lastWasLocation = true;
    } else {
      // If it's an empty/not empty condition, just add it
      result.push(filter);
      lastWasLocation = true;
    }
  }
  
  return result;
}

/**
 * Expand a single location filter into multiple OR filters for better coverage
 */
function expandLocationFilter(originalColumn, locationValue, hasExistingLocation) {
  const filters = [];
  let locationColumns = [];
  
  // Generate array of relevant location columns based on the original
  switch (originalColumn) {
    case "Location":
      // If the location has a state qualifier, don't expand to other columns
      if (locationValue.includes(",")) {
        locationColumns = ["Location"];
        
        // Also add a filter for just the city name
        const cityOnly = locationValue.split(",")[0].trim();
        if (cityOnly) {
          filters.push({
            column: "Locality",
            condition: "contains",
            tokens: [cityOnly],
            pendingText: "",
            subop: "OR" // This will connect to the main location filter
          });
        }
      } else {
        // For standalone location names, try multiple columns
        locationColumns = ["Location", "Locality", "Metro"];
      }
      break;
      
    case "Locality":
      // For city names, also check Location and Metro
      locationColumns = ["Locality", "Location", "Metro"];
      break;
      
    case "Region":
      // For states/regions, also check Location
      locationColumns = ["Region", "Location"];
      break;
      
    case "Postal Code":
      // Postal codes are specific enough
      locationColumns = ["Postal Code"];
      break;
      
    case "Metro":
      // For metro areas, also check Location and Locality
      locationColumns = ["Metro", "Location", "Locality"];
      break;
      
    default:
      locationColumns = [originalColumn];
  }
  
  // Add the primary column filter first
  filters.push({
    column: locationColumns[0],
    condition: "contains",
    tokens: [locationValue],
    pendingText: "",
    subop: hasExistingLocation ? "AND" : "" // Connect to previous filters with AND
  });
  
  // Add secondary columns with OR logic
  for (let i = 1; i < locationColumns.length; i++) {
    filters.push({
      column: locationColumns[i],
      condition: "contains",
      tokens: [locationValue],
      pendingText: "",
      subop: "OR" // Use OR to expand search results
    });
  }
  
  return filters;
} 