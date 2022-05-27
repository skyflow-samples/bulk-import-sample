# Bulk Import Vault Data Sample Application

## Overview

This application demonstrates how to bulk import records into a Skyflow vault. The sample includes
a vault template, sample data for 1,000 records, and a script to import the sample data.

The sample code imports 25 records at a time with a maximum of 80 requests per minute.

## Requirements

- node - v10.17
- npm > 6.x.x

You can find the documentation and steps to install node and npm [here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

## Configuration

### Vault setup

Before you can run the application, you need to create a vault based on the sample schema.

#### Create the vault
1. Login to Skyflow Studio.
1. Click Create Vault and select Upload Vault Schema.
1. Drag the vault_schema.json file into the modal and then click Upload.

#### Set environment variables
The import data script needs environment variables for retrieving your vault ID, vault URL, and service account key credentials.

1. From the vault details dialog under **vault menu icon > Edit vault details**, note the Vault ID
and Vault URL.
1. In your terminal, execute
  1. `export VAULT_ID=$VAULT_ID` replacing `$VAULT_ID` with the Vault ID you copied.
  1. `export VAULT_URL=$VAULT_URL` replacing `$VAULT_URL` with the Vault URL you copied.
1. In Skyflow Studio, [create a role](https://docs.skyflow.com/data-governance-setup/) with a
policy for inserting records to the persons table for the vault you created.
1. Create a service account assigning the role.
1. Open the downloaded credentials.json file and copy the contents.
1. In your terminal, execute `export VAULT_URL='$SERVICE_ACCOUNT_KEY_DATA'`, replacing
`$SERVICE_ACCOUNT_KEY_DATA` with the contents of the credentials.json file you downloaded.

#### Import seed data

1. In your terminal, navigate to the sample folder.
1. Execute the following commands.

```
npm install
node import_data.js
```

## General insertion guidelines

- Up to 25 records at a time.
- Limit your import to 80 requests per minute.
