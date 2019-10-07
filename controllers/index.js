const Home = (req, res) => res.render('home')

const AuthUser = (req, res) => {
    req.session.user = {
        name: req.body.name
    }
    res.redirect('/room')
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