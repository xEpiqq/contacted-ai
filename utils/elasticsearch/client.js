// /utils/elasticsearch/client.js
import { Client } from '@elastic/elasticsearch';

export const esClient = new Client({
  node: process.env.ELASTIC_URL,
  auth: {
    username: process.env.ES_USERNAME,
    password: process.env.ES_PASSWORD,
  },
});
