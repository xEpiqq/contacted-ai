import { NextResponse } from 'next/server';

// Database location column mappings
const LOCATION_COLUMNS = {
  "usa4_new_v2": {
    city: ["Location", "Locality", "Metro"],
    state: ["Region", "Location"], 
    zip: ["Postal Code"]
  },
  "eap1_new_v2": {
    city: ["person_location_city"],
    state: ["person_location_state"],
    country: ["person_location_country"]
  },
  "otc1_new_v2": {
    city: ["locality", "location"],
    state: ["region"],
    country: ["location_country"]
  }
};

export async function POST(request) {
  const { database, locationComponents } = await request.json();
  
  const columns = LOCATION_COLUMNS[database] || LOCATION_COLUMNS["usa4_new_v2"];
  const validatedLocation = {
    hasLocation: false,
    components: { city: "", state: "", zip: "", country: "", region: "" },
    locationFilters: []
  };

  // For now, just pass through the location components without validation
  // You can add actual validation logic here later
  if (locationComponents.city || locationComponents.state || locationComponents.country) {
    validatedLocation.hasLocation = true;
    validatedLocation.components = locationComponents;
    
    // Build location filters based on database columns
    if (locationComponents.city && columns.city) {
      columns.city.forEach(column => {
        validatedLocation.locationFilters.push({
          column: column,
          value: locationComponents.city,
          type: "city"
        });
      });
    }
    
    if (locationComponents.state && columns.state) {
      columns.state.forEach(column => {
        validatedLocation.locationFilters.push({
          column: column,
          value: locationComponents.state,
          type: "state"
        });
      });
    }
    
    if (locationComponents.country && columns.country) {
      columns.country.forEach(column => {
        validatedLocation.locationFilters.push({
          column: column,
          value: locationComponents.country,
          type: "country"
        });
      });
    }
  }

  return NextResponse.json(validatedLocation);
} 