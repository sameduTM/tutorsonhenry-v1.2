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
        // attempt to find a user
        const user = await UserService.getUser(email, password);

        // if the service returns null/false, we land here.
        if (!user) {
            req.flash("error", "Invalid email or password");
            return res.redirect('/login');
        }

        // Clean up data before session storage
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            walletBalance: user.walletBalance || 0,
        };

        req.session.save(() => {
            res.redirect('/profile');
        });
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong. Please try again.");
        return res.redirect('/login');
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
