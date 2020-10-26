require('dotenv').config()

const {app, socketApp} = require('./app')
const http = require('http')
const SocketIo = require('socket.io')
const socketEvents = require('./socket.js')

const server = http.createServer(app)

const socketServer = socketApp.listen(3002, ()=>{
  console.log(`server is running on 3002`)
})

socketApp.get('/', (req,res)=>{
  res.send("hello")
})

server.listen(app.get('port'))

const io = SocketIo(socketServer)
socketEvents(io)
