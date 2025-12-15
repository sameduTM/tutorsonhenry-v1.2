const bcrypt = require('bcrypt');
const crypto = require('crypto');
const express = require('express');
const nodemailer = require('nodemailer');
const passport = require('passport');
const User = require('../models/user');
const UserService = require('../services/userService');

const authRouter = express.Router();

const IMAGES_PATH = {
    logo: '/images/medical-team.png',
    hero: '/images/hero-bg.jpg',
}

authRouter.get('/login', (req, res) => {
    res.render('login.html', {
        images: IMAGES_PATH,
    });
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

// ==========================================
// FORGOT PASSWORD ROUTES
// ==========================================

// GET: Show Forgot Password Form
authRouter.get('/forgot-password', (req, res) => {
    res.render('forgot-password.html', {
        images: IMAGES_PATH,
    });
});

// POST: Handle Forgot Password Request
authRouter.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            // Security: Don't reveal if user exists. Just say email sent.
            req.flash('success', 'If an account exists, a reset eamil has been sent');
            return res.redirect('/forgot-password');
        }

        // Generate Token
        const token = crypto.randomBytes(20).toString('hex');

        // Set token and expiry (1 hour)
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hr

        // save password token to DB
        user.save();

        // Setup Email Transporter (Use Gmail or SMTP)
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            }
        });

        const mailOptions = {
            to: user.email,
            from: 'Support <support@tutorsonhenry.com>',
            subject: 'Password Reset',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
                `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
                `http://${req.headers.host}/reset-password/${token}\n\n` +
                `If you did not request this, please ignore this email and your password will remain unchanged.\n`
        }

        await transporter.sendMail(mailOptions);

        req.flash('success', 'An email has been sent to ' + user.email + ' with further instructions');
        res.redirect('/forgot-password');

    } catch (err) {
        console.error(err);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/forgot-password');
    }
});

// GET: Show Reset Password Form
authRouter.get('/reset-password/:token', async (req, res) => {
    try {
        const user = User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() } // Check if token is not expired
        });

        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot-password');
        }

        res.render('reset-password.html', {
            token: req.params.token,
            images: IMAGES_PATH,
        });

    } catch (err) {
        console.error(err);
        res.redirect('/forgot-password');
    }
});

// POST: Process Password Reset
authRouter.post('/reset-password/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired');
            return res.redirect('back');
        }

        if (req.body.password !== req.body.confirm) {
            req.flash('error', 'Passwords do not match');
            return res.redirect('back');
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);

        // Clear token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        req.flash('success', 'Success! Your password has been changed.');
        res.redirect('/login');
    } catch (err) {
        console.error("Reset PASSWORD Error:", err);
        req.flash('error', 'Failed to reset password');
        res.redirect('back');
    }
});

// ===== GOOGLE OAUTH ROUTES =====

// Initiate Google OAuth flow
authRouter.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// Google OAuth callback
authRouter.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login', failureMessage: true }),
    (req, res) => {
        try {
            // Store user in session (Passport handles this)
            req.session.user = {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                walletBalance: req.user.walletBalance || 0,
                authProvider: req.user.authProvider
            };

            req.session.save(() => {
                req.flash('success', `Welcome back, ${req.user.name}!`);
                
                // Redirect based on role
                if (req.user.role === 'admin') {
                    return res.redirect('/admin/dashboard');
                } else if (req.user.role === 'writer') {
                    return res.redirect('/writer/dashboard');
                } else {
                    // Student users go to profile (or my-orders if you prefer)
                    return res.redirect('/profile');
                }
            });
        } catch (err) {
            console.error("Google OAuth Error:", err);
            req.flash('error', 'Google login failed. Please try again.');
            res.redirect('/login');
        }
    }
);

module.exports = authRouter;
