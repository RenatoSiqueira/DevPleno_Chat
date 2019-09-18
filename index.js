const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const session = require('express-session')

const app = express()
mongoose.Promise = global.Promise

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded())
app.use(session({
    secret: 'socketio',
    cookie: {
        maxAge: 10 * 60 * 1000
    }
}))

app.get('/', (req, res) => res.render('home'))
app.post('/', (req, res) => {
    req.session.user = {
        name: req.body.name
    }
    res.redirect('/room')
})

app.get('/room', (req, res) => {
    if (!req.session.user)
        res.redirect('/')
    else
        res.render('room', { name: req.session.user.name })
})

mongoose
    .connect('mongodb://localhost/chat-socket-io', { useNewUrlParser: true })
    .then(() => {
        app.listen(3000, () => console.log('Chat running'))
    })