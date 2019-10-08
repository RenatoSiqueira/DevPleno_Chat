require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const session = require('express-session')
const sharedSession = require('express-socket.io-session')

const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

const MONGOSERVER = process.env.MONGOSERVER || 'mongodb://localhost/chat-socket-io'
const REDISSERVER = process.env.REDISSERVER || 'localhost'

const redis = require('socket.io-redis')
io.adapter(redis({ host: REDISSERVER }))

const Controller = require('./controllers')

const Room = require('./models/room')
const Message = require('./models/message')

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
io.use((socket, next) => {
    const session = socket.handshake.session
    if (!session.user) {
        next(new Error('Auth Failed'))
    } else {
        next()
    }
})

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

    socket.on('sendAudio', msg => {
        const message = new Message({
            author: socket.handshake.session.user.name,
            when: new Date(),
            msgType: 'audio',
            message: msg.data,
            room: msg.room
        })
        message
            .save()
            .then(() => {
                io.to(msg.room).emit('newAudio', message)
            })
    })
})

mongoose
    .connect(MONGOSERVER, { useNewUrlParser: true })
    .then(() => {
        http.listen(3000, () => console.log('Chat running'))
    })