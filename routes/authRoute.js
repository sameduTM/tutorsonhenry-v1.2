const express = require('express');
const UserService = require('../services/userService');

const authRouter = express.Router();

authRouter.get('/login', (req, res) => {
    res.render('login.html', {
        images: {
            logo: '/images/medical-team.png',
            hero: '/images/hero-bg.jpg',
        }
    })
});

authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await UserService.getUser(email, password);

        // store user info in session
        req.session.user = user;
        res.redirect('/profile');
    } catch (err) {
        res.status(401).send("Invalid email or password");
    }
});

// Logout route
authRouter.get('/logout', (req, res) => {
    // Destroy the sessi0
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session', err);
            return res.status(500).send('Logout failed');
        }
        // Clear cookie if you are using one
        res.clearCookie('connect.sid');
        // Redirect to homepage
        res.redirect('/');
    });
});

module.exports = authRouter;
