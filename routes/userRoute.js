const express = require('express');
const UserService = require('../services/userService');

const userRouter = express.Router();

userRouter.get('/', async (req, res) => {
    const {
        proctoredExams,
        onlineExams,
        atiModules,
        onlineClasses,
    } = await UserService.getAllServices();

    res.render('index.html', {
        images: {
            logo: '/images/medical-team.png',
            hero: '/images/hero-bg.jpg',
        }, proctoredExams, onlineExams, atiModules, onlineClasses,
    });
});

userRouter.get('/profile', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    res.render('profile.html', {
        user: req.session.user,
        images: {
            logo: '/images/medical-team.png',
        },
    });
});


userRouter.get('/signup', (req, res) => {
    res.render('sign-up.html', {
        images: {
            logo: '/images/medical-team.png',
        },
    });
});

userRouter.post('/signup', async (req, res, next) => {
    const userData = req.body;

    try {
        const user = await UserService.createUser(userData);

        // Render login page with user's email prefilled
        res.status(201).render('login.html', {
            images: {
                logo: '/images/medical-team.png',
            },
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).render('sign-up.html',
            { images: { logo: '/images/medical-team.png' } },
            { error: 'Signup failed. Please try again.' },
        );
        // or you can call next(err) if you have error-handling middleware
        next(err);
    }
});

module.exports = userRouter;
