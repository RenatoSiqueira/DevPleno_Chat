const express = require('express')
const mongoose = require('mongoose')
const app = express()
mongoose.Promise = global.Promise

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('', (req, res) => res.render('home'))

mongoose
    .connect('mongodb://localhost/chat-socket.io', { useNewUrlParser: true })
    .then(() => {
        app.listen(3000, () => console.log('Chat running'))
    })