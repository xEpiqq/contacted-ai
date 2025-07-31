import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const database = searchParams.get('database') || 'usa4_new_v2';
    
    // Import the search count logic directly
    const { esClient } = await import('@/utils/elasticsearch/client');
    const { buildESQueryFromFilters } = await import('@/utils/elasticsearch/buildQuery');
    
    // Test with a simple manager filter
    const testFilters = [{
      column: "Job title",
      condition: "contains",
      tokens: ["manager"],
      subop: ""
    }];
    
    console.log('Testing with filters:', testFilters);
    
    // Build the query
    const esQuery = buildESQueryFromFilters(testFilters);
    console.log('Built ES query:', JSON.stringify(esQuery, null, 2));
    
    // Get count
    const { count } = await esClient.count({
      index: database,
      query: esQuery,
    });
    
    console.log('Count result:', count);
    
    return NextResponse.json({ 
      database,
      filters: testFilters,
      query: esQuery,
      count 
    });
  } catch (error) {
    console.error('Test count error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
} 