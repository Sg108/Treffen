const express = require('express')
const app = express()
// const cors = require('cors')
// app.use(cors())
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true
});
const { v4: uuidV4 } = require('uuid')

const presetRoomIds = {
  gaming: uuidV4(),
  food: uuidV4(),
  study: uuidV4(),
  chill: uuidV4(),
  politics: uuidV4()
}

app.use('/peerjs', peerServer);

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.render('home', presetRoomIds);
})

app.get('/new', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

const peers={};

io.on('connection', socket => {
  
  socket.on('join-room', (roomId, userId) => {
    peers[userId]=socket.id
    socket.join(roomId)
    socket.to(roomId).broadcast.emit('user-connected', userId);
    // messages
    socket.on('message', data => {
      //send message to the same room
      io.to(roomId).emit('createMessage', data)
    });

    socket.on('disconnect', () => {
      console.log(userId)
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })
    
    socket.on('leave-meeting', () => {
      console.log('disconnected:',userId)
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })

    socket.on("file-meta",function(data){
      console.log("xyz",data.uid)
      socket.to(roomId).broadcast.emit("fs-meta", data);
    });

    socket.on("file-raw",(data)=>{
      console.log("def",data.uid)
    
      socket.to(roomId).broadcast.emit("fs-share", data);
    });
    socket.on("fs-start",function(data){
      console.log("abc",data.uid)
      socket.to(peers[data.uid]).emit("fs-sh");
    });

  })
  
})

server.listen(process.env.PORT || 3030)
