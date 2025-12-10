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
    try {
        const { email, password } = req.body;

        // 🛡️ SECURITY FIX: Ensure email is a string (Prevents NoSQL Injection)
        if (typeof email !== 'string' || typeof password !== 'string') {
            console.log("⛔ BLOCKED: Malicious Object Injection detected");
            req.flash('error', 'Invalid input format');
            return res.redirect('/login');
        }

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
            role: user.role, // Essential for middleware checks
            walletBalance: user.walletBalance || 0,
        };

        req.session.save(() => {
            // ROLE-BASED REDIRECT LOGIC
            if (user.role === 'admin') {
                return res.redirect('/admin/dashboard');
            }
            else if (user.role === 'writer') {
                return res.redirect('/writer/dashboard');
            }
            else {
                // Default: Student
                return res.redirect('/profile');
            }
        });

    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong. Please try again.");
        return res.redirect('/login');
    }
});

// Logout route
authRouter.get('/logout', (req, res) => {
    // Destroy the session
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