const {app, socketApp} = require('./app')
const http = require('http')
const SocketIo = require('socket.io')
const socketEvents = require('./socket.js')

const server = http.createServer(app)

server.listen(app.get('port'), ()=>{
  console.log('sso server is running on 3000')
})
const socketServer = socketApp.listen(3002, ()=>{
  console.log('socket server is running on 3002')
})

socketApp.get('/', (req,res)=>{
  res.send("hello")
})

server.listen(app.get('port'))

const io = SocketIo(socketServer)
socketEvents(io)
