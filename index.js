'use strict'

var robot = require('robotjs')

var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var port = process.env.PORT || 3000

app.use(require('express').static('public'))

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html')
})

io.on('connection', function(socket){
  // socket.on('chat message', function(msg){
  //   io.emit('chat message', msg)
  //   if (msg.includes(',')) {
  //     var mouse = msg.split(',')
  //     robot.moveMouseSmooth(mouse[0],mouse[1])
  //   }
  // })
  socket.on('mouse pos',function(mpos) {
    var mouse = mpos.split(',')
    robot.moveMouse(mouse[0]*1920,mouse[1]*1080)
    console.log(mouse[0] * 1920 + ',' + mouse[1] * 1080)
  })
})

http.listen(port, function(){
  console.log('listening on *:' + port)
})

const ffmpeg = require('ffmpeg-static').path
const { spawn } = require('child_process')

const process2 = spawn(
  ffmpeg,
  ['-probesize', '20M', '-f', 'gdigrab', '-framerate', '30','-i', 'desktop', '-vcodec', 'mpeg1video', '-s', '1920x1080', '-b:v', '1000k', '-r', '30', '-bf', '0', '-codec:a', 'mp2', '-ar', '44100', '-ac', '1', '-b:a', '128k', '-f', 'mpegts', '-'],
  { stdio: 'pipe' }
)
// ['-probesize', '10M', '-f', 'gdigrab', '-framerate', '30', '-i', 'desktop', '-f', 'flv', '-'],
// ['-probesize', '10M', '-f', 'gdigrab', '-framerate', '30', '-i', 'desktop', '-f', 'mpegts', '-'],
const stream = process2.stdout

// const { createWriteStream } = require('fs')

// const file = createWriteStream('capture.mpeg')
// stream.pipe(file)

stream.on('data', chunk => {
  // console.log(chunk)
  // io.emit('broadcast', chunk)
  socketServer.broadcast(chunk)
})

var WebSocket = require('ws')

var socketServer = new WebSocket.Server({ port: 3030, perMessageDeflate: false })

socketServer.connectionCount = 0

socketServer.on('connection', function(socket, upgradeReq) {
  socketServer.connectionCount++
  console.log(
    'New WebSocket Connection: ',
    (upgradeReq || socket.upgradeReq).socket.remoteAddress,
    (upgradeReq || socket.upgradeReq).headers['user-agent'],
    '('+socketServer.connectionCount+' total)'
  )
  socket.on('close', function(code, message){
    socketServer.connectionCount--
    console.log(
      'Disconnected WebSocket ('+socketServer.connectionCount+' total)'
    )
  })

})
socketServer.broadcast = function(data) {
  socketServer.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  })
}