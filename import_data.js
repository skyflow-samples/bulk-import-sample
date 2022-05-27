const axios = require('axios');
const axiosRetry = require('axios-retry');
const rateLimit = require('axios-rate-limit');
const { generateBearerTokenFromCreds } = require('skyflow-node');

// Configure retries and exponential backoff for axios, which is used for insertion API calls.
axiosRetry(axios, { retryDelay: axiosRetry.exponentialDelay, retries: 10 });

// Configure rate limit to maximum of 80 requests for 60 seconds
const http = rateLimit(axios.create(), { maxRequests: 80, perMilliseconds: 60000 });

// Constants for making Skyflow API calls
const SKYFLOW_VAULT_URL = process.env.VAULT_URL;
const SKYFLOW_VAULT_ID = process.env.VAULT_ID;
const SKYFLOW_VAULT_API_URL = SKYFLOW_VAULT_URL + '/v1/vaults/' + SKYFLOW_VAULT_ID;
const SERVICE_ACCOUNT_KEY = process.env.SERVICE_ACCOUNT_KEY;

const MAX_RECORDS = 25;

main();

/**
 * Inserts 1,000 people records into a persons table in a Skyflow vault.
 * Records are bulk inserted 25 records at a time.
 */
async function main() {
  // Import persons records from JSON file
  let allPersons = require('./vault_data.json');

  // Loop over records in chunks of 25 records at a time
  for(let i = 0; i < allPersons.people.length; i += MAX_RECORDS) {
    // Slice array into a 25 element record chunk
    let insertionRecords = allPersons.people.slice(i, i + MAX_RECORDS);

    console.log('Inserting records ' + (i + 1) + ' to ' + (i + MAX_RECORDS));

    // Import into the persons vault table
    await insert('persons', insertionRecords);
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
 * Generates the header for making Skyflow API calls.
 * @returns Object representing the header for making an API call to the Skyflow data APIs.
 */
async function getRequestHeaders() {
  let authToken = await generateBearerTokenFromCreds(SERVICE_ACCOUNT_KEY);
  let authBearerToken = authToken.accessToken;

  return {
    'Authorization': 'Bearer ' + authBearerToken,
    'Content-Type': 'application/json'
  };
}