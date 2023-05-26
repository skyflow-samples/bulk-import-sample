const axios = require('axios');
const axiosRetry = require('axios-retry');
const rateLimit = require('axios-rate-limit');
const Qs = require('qs');
const { generateBearerToken } = require('skyflow-node');

// Configure retries and exponential backoff for axios, which is used for insertion API calls.
axiosRetry(axios, { retryDelay: axiosRetry.exponentialDelay, retries: 10 });

// Configure rate limit to maximum of 80 requests for 60 seconds.
const http = rateLimit(axios.create(), { maxRequests: 80, perMilliseconds: 60000 });

// Constants for making Skyflow API calls.
const SKYFLOW_VAULT_URL = process.env.VAULT_URL;
const SKYFLOW_VAULT_ID = process.env.VAULT_ID;
const SKYFLOW_VAULT_API_URL = SKYFLOW_VAULT_URL + '/v1/vaults/' + SKYFLOW_VAULT_ID;
const SERVICE_ACCOUNT_KEY = process.env.SERVICE_ACCOUNT_KEY;

const MAX_RECORDS = 25;

// TODO: Configure these values to represent the from table name, columns that
// need to be transferred, and the table you want the columns moved into.
let tableFromName = 'REPLACE_WITH_TABLE_FROM_NAME';
let columnFromNames = ['COLUMN_1', 'COLUMN_2'];
let tableToName = 'REPLACE_WITH_TABLE_TO_NAME';

main();

/**
 * Loops over all data in the from columns and inserts the data into a new table.
 */
async function main() {
  // Get the first 25 rows of column data from the "from" table.
  let rows = await getRecords(tableFromName, { limit: 25, offset: 0,
    fields: columnFromNames });
  let offset = 25;

  while(rows.length > 0) {
    // Insert into the "to" table vault table.
    await insert(tableToName, rows);

    rows = await getRecords(tableFromName, { limit: 25, offset: offset,
      fields: columnFromNames });
    offset += 25;

    // console.dir(rows);
  }
}

/**
 * Bulk insert records into the given table.
 * @param {string} tableName The name of the table to insert records into.
 * @param {Array} records List of record objects for insertion.
 * @returns List of inserted records with skyflow_ids.
 */
async function insert(tableName, records) {
  const body = {
    quorum: false,
    records: records,
    tokenization: false
  };

  let insertURI = SKYFLOW_VAULT_API_URL + '/' + tableName;
  try {
    const response = await http.post(insertURI, body, { headers: await getRequestHeaders() });

    return response.data.records;
  } catch(e) {
    console.dir(e);
    console.log(e.response.data)
  }
  
  return false;
}

/**
 * Get records from the given table.
 * @param {string} tableName The name of the table to get records from.
 * @param {Array} options Options including offset, limit, and fields for retrieval.
 * @returns List of records.
 */
async function getRecords(tableName, options) { 
  let tableURI = SKYFLOW_VAULT_API_URL + '/' + tableName;

  try {
    const response = await axios.get(tableURI, { headers: await getRequestHeaders(),
      params: {
        redaction: 'PLAIN_TEXT',
        limit: options.limit,
        offset: options.offset,
        fields: options.fields
      },
      paramsSerializer: function(params) {
        return Qs.stringify(params, { arrayFormat: 'repeat' });
      },
    });

    return response.data.records;
  } catch(e) {
    return [];
  }
}

/**
 * Generates the header for making Skyflow API calls.
 * @returns Object representing the header for making an API call to the Skyflow data APIs.
 */
async function getRequestHeaders() {
  let authToken = await generateBearerToken(SERVICE_ACCOUNT_KEY);
  let authBearerToken = authToken.accessToken;

  return {
    'Authorization': 'Bearer ' + authBearerToken,
    'Content-Type': 'application/json'
  };
}