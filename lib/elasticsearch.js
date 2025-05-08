// lib/elasticsearch.js
import { Client } from '@elastic/elasticsearch';

// Use environment variables for your cluster credentials
// e.g. process.env.ELASTIC_URL, process.env.ELASTIC_API_KEY
export const esClient = new Client({
  node: process.env.ELASTIC_URL,
  auth: { apiKey: process.env.ELASTIC_API_KEY },
});
