require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const session = require('express-session')
const sharedSession = require('express-socket.io-session')

const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

const Controller = require('./controllers')

const Room = require('./models/room')
const Message = require('./models/message')

const MONGOSERVER = process.env.MONGOSERVER || 'mongodb://localhost/chat-socket-io'

mongoose.Promise = global.Promise

const expressSession = session({
    secret: 'socketio',
    cookie: {
        maxAge: 10 * 60 * 1000
    }
})

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded())
app.use(expressSession)
io.use(sharedSession(expressSession, { autoSave: true }))

app
    .get('/', Controller.Home)
    .post('/', Controller.AuthUser)
    .get('/room', Controller.Rooms)


io.on('connection', socket => {
    // salas iniciais
    Room.find({}, (err, rooms) => {
        socket.emit('roomList', rooms)
    })
    // addRoom
    socket.on('addRoom', roomName => {
        const room = new Room({
            name: roomName
        })
        room
            .save()
            .then(() => {
                io.emit('newRoom', room)
            })
    })
    // join na sala
    socket.on('join', roomId => {
        socket.join(roomId)
        Message
            .find({ room: roomId })
            .then(msgs => {
                socket.emit('msgsList', msgs)
            })
    })

    socket.on('sendMsg', msg => {
        const message = new Message({
            author: socket.handshake.session.user.name,
            when: new Date(),
            msgType: 'text',
            message: msg.msg,
            room: msg.room
        })
        message
            .save()
            .then(() => {
                io.to(msg.room).emit('newMsg', message)
            })
        //console.log(msg)
        //console.log(socket.handshake.session)
    })
})

mongoose
    .connect(MONGOSERVER, { useNewUrlParser: true })
    .then(() => {
        http.listen(3000, () => console.log('Chat running'))
    })