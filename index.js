const app = require('./app').default
const http = require('http')

const server = http.createServer(app)

server.listen(app.get('port'))
