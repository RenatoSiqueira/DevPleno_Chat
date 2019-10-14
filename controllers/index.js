const jwt = require('jsonwebtoken')
const jwtSecret = process.env.JWS_SECRET || 'socketio-react'

const Home = (req, res) => res.render('home')

const AuthUser = async (req, res) => {
    /*
    req.session.user = {
        name: req.body.name
    }
    res.redirect('/room')
    */
    const token = jwt.sign({
        name: req.body.name
    }, jwtSecret)
    res.send({ token })
}

const Rooms = (req, res) => {
    if (!req.session.user)
        res.redirect('/')
    else
        res.render('room', { name: req.session.user.name })
}

module.exports = {
    Home,
    AuthUser,
    Rooms
}