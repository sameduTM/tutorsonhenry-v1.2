const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');
const UserService = require('../services/userService');
const bcrypt = require('bcrypt');

// Serialize user for session
passport.serializeUser((user, done) => {
    console.log('📝 Serializing user:', user._id);
    done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        console.log('🔄 Deserializing user:', id);
        const user = await User.findById(id);
        console.log('✅ User deserialized:', user?.email);
        done(null, user);
    } catch (err) {
        console.error('❌ Deserialization error:', err);
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
        callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.APP_URL || 'http://localhost:3000'}/auth/google/callback`
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            console.log('🔐 Google OAuth Profile Received:', {
                id: profile.id,
                displayName: profile.displayName,
                email: profile.emails?.[0]?.value
            });

            // Check if user exists with Google ID
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
                console.log('✅ Existing Google user found:', user.email);
                return done(null, user);
            }

            // Check if email already exists (either Google or local auth)
            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
                // User exists with same email but different auth provider
                // Link Google account to existing user
                console.log('🔗 Linking Google account to existing user:', user.email);
                user.googleId = profile.id;
                user.googleEmail = profile.emails[0].value;
                user.authProvider = 'google';
                await user.save();
                return done(null, user);
            }

            // Create new user
            console.log('👤 Creating new user from Google profile:', profile.emails[0].value);
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
            console.log('✅ New Google user created:', newUser.email);
            return done(null, newUser);
        } catch (err) {
            console.error('❌ Google OAuth Error:', err);
            return done(err);
        }
    }
));

module.exports = passport;
