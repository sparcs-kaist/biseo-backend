import Client from './sparcsssov2-node';

const { SSO_CLIENT_ID, SSO_CLIENT_SECRET } = process.env;

if (SSO_CLIENT_ID === undefined || SSO_CLIENT_SECRET === undefined)
  throw new Error('SSO credentials are empty. Initialize your .env file!');

const client = new Client(SSO_CLIENT_ID, SSO_CLIENT_SECRET, false);

export default client;
