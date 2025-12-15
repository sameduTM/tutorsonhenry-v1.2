const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');
const UserService = require('../services/userService');
const bcrypt = require('bcrypt');

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Local Strategy (Email + Password)
passport.use('local', new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password'
    },
    async (email, password, done) => {
        try {
            const user = await UserService.getUser(email, password);
            if (!user) {
                return done(null, false, { message: 'Invalid email or password' });
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));

// Google Strategy
passport.use('google', new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user exists with Google ID
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
                // User already exists, return it
                return done(null, user);
            }

            // Check if email already exists (either Google or local auth)
            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
                // User exists with same email but different auth provider
                // Link Google account to existing user
                user.googleId = profile.id;
                user.googleEmail = profile.emails[0].value;
                user.authProvider = 'google';
                await user.save();
                return done(null, user);
            }

            // Create new user
            const newUser = new User({
                name: profile.displayName || profile.emails[0].value.split('@')[0],
                email: profile.emails[0].value,
                googleId: profile.id,
                googleEmail: profile.emails[0].value,
                authProvider: 'google',
                password: null, // No password for Google auth users
                role: 'student' // Default role
            });

            await newUser.save();
            return done(null, newUser);
        } catch (err) {
            return done(err);
        }
    }
));

module.exports = passport;
