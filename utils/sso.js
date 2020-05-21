const Client = require('./sparcsssov2-node.js')

const client = new Client (process.env.SSO_CLIENT_ID, process.env.SSO_SECRET, false) // TODO: MOVE TO DOTENV

module.exports = client
