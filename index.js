const express = require('express');
const app = express();
const http = require('http');
const { SocketAddress } = require('net');
const server = http.createServer(app);

/* socket.io */
const { Server, Socket } = require("socket.io");
const io = new Server(server);

var ClientCount = 1

/* mongodb */
const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://admin:admin@chatdb.zphum.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
  console.log('MongoDB connected...')

  io.on('connection', (socket) =>{
    const coll_message = client.db("Chat").collection("message");
    const coll_users = client.db("Chat").collection("users");

    sendStatus = (s) => {
      socket.emit('status',s)
    }

    var Rooms = 'Default'
    socket.join(Rooms)
    socket.username = 'Guest'+ClientCount
    ClientCount++;
    console.log('user [' + socket.username + '] connected');
    
    socket.emit('connection', {
      username : socket.username,
      room : Rooms
    })
    query = { room: Rooms}
    coll_message.find(query).limit(100).sort({_id:1}).toArray((err,res) => {
      if(err){
        throw err;
      }
      console.log('Get from db : ' + res)
      socket.emit('output',res)
    })

    socket.on('input', (data) => {
      let name = data.name;
      let message = data.message;
      let room = data.room;

      if(name == '' || message == ''){
        sendStatus('Please enter message')
      } else {
        let date = new Date();
        coll_message.insertOne({name : name, room : room ,message : message,date : date}, () => {
          //socket.emit('output', [data])
          io.sockets.in(room).emit('output',[data])
          sendStatus({
            message : 'Message sent',
            clear: true
          })
        })
      }
    })
    socket.on('clear', () => {
      chat.remove({},() => {
        socket.emit('cleared')
      })
    })
      
    socket.on('SetUsername', (name) => {
      coll_users.insertOne({name : name}, () => {
        socket.username = name
        console.log('set username to : ' + socket.username)
        //console.log(SocketAddress.toString)
      })  
    })

    socket.on('GoToRoom' , (Room)=>{   
      Rooms = Room
      console.log(socket.username + ' => ' + Rooms)
      socket.join(Rooms)
      
      query = { room: Rooms}
      coll_message.find(query).limit(100).sort({_id:1}).toArray((err,res) => {
      if(err){
        throw err;
      }
      console.log('Get from db : ' + res)
      socket.emit('output',res)
    })
        
    })
  })
})

app.get('/',(req,res)=>{
    res.sendFile(__dirname + '/index2.html');
});



/* socket.io */
// io.on('connection', (socket) => {
    
//     var Rooms = 'Default'
//     socket.join(Rooms)
//     socket.username = 'Guest'+ClientCount
//     ClientCount++;
//     console.log('user [' + socket.username + '] connected');
    
//     socket.emit('connection', {
//       username : socket.username,
//       room : Rooms
//     })

    

//     socket.on('disconnect', () => {
//       // --ClientCount;
//         console.log('user [' + socket.username + '] disconnected');
//       });
      
//     socket.on('chat message', (msg) => {
//         var msg2 =new Array()
        
        
//         console.log('message from (' + socket.username + '/' + Rooms + ') : ' + msg);
//         msg2[0] = msg
//         msg2[1] = socket.username
//         msg2[2] = Rooms
//         // io.emit('chat message', msg2);
//         io.sockets.in(Rooms).emit('chat message',msg2)
//       });

  // });

    server.listen(3000,()=>{
        console.log('listening on port 3000 ')
    })