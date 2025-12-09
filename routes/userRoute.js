const express = require('express');

const OrderService = require('../services/orderService');
const { requireStudent } = require('../middlewares/roleAuth');
const UserService = require('../services/userService');
const User = require('../models/user');
const Order = require('../models/orders');

const userRouter = express.Router();

const IMAGE_PATHS = {
    logo: '/images/medical-team.png',
    hero: '/images/hero-bg.jpg',
    favicon: '/images/favicon.png',
}

userRouter.get('/', async (req, res) => {
    const {
        proctoredExams,
        onlineExams,
        atiModules,
        onlineClasses,
    } = await UserService.getAllServices();

    res.render('index.html', {
        images: IMAGE_PATHS, proctoredExams, onlineExams, atiModules, onlineClasses,
    });
});

userRouter.get('/signup', (req, res) => {
    res.render('sign-up.html', {
        images: IMAGE_PATHS,
    });
});

userRouter.post('/signup', async (req, res, next) => {
    try {
        const userData = req.body;
        const { password, email, name } = userData;

        // validate password strength
        if (!password || password.length < 8) {
            req.flash('error', 'Password must be at least 8 characters long.');
            return res.status(400).render('sign-up.html', {
                images: IMAGE_PATHS,
                error: 'Password must be at least 8 characters long.',
                values: { name, email },
            });
        }

        // create User
        const user = await UserService.createUser(userData);

        // flash message for login page
        req.flash('success', 'Account created! Please log in.');
        req.status(201).redirect('/login');

    } catch (err) {
        console.error('Signup error:', err);

        // handle specific errors
        let errorMessage = "Signup failed. Please try again.";
        if (err.code === 11000) { // MongoDB duplicate key error
            errorMessage = 'Email already registered';
        }

        res.status(500).render('sign-up.html', {
            images: IMAGE_PATHS,
            error: errorMessage,
            values: req.body,
        });
        // or you can call next(err) if you have error-handling middleware
        next(err);
    }
});


userRouter.get('/messages', requireStudent, (req, res) => {
    const user = req.session.user;

    if (!user) return res.redirect('/login');
    res.render('messages.html', {
        images: IMAGE_PATHS,
        user,
    });
});

userRouter.get('/topup', requireStudent, (req, res) => {
    const user = req.session.user;

    if (!user) return res.redirect('/login');

    res.render('topup.html', {
        images: IMAGE_PATHS,
        user,
    })
});

userRouter.get('/profile', requireStudent, async (req, res) => {
    const sessionUser = req.session.user;

    if (!sessionUser) {
        return res.redirect('/login');
    }
    try {
        // fetch fresh user data (get latest walletBalance)
        const currentUser = await User.findById(sessionUser.id);

        // calculate order stats
        const pendingCount = await Order.countDocuments({ userId: sessionUser.id, status: 'Pending' });
        const completedCount = await Order.countDocuments({ userId: sessionUser.id, status: 'Completed' });
        const cancelledCount = await Order.countDocuments({ userId: sessionUser.id, status: 'Cancelled' });
        const biddingCount = await Order.countDocuments({ userId: sessionUser.id, status: 'Bidding' });

        // Get orders list
        const ordersData = await OrderService.getOrdersByUserId(sessionUser);

        // render template with data
        res.render('profile.html', {
            user: currentUser,
            images: IMAGE_PATHS,
            orders: ordersData,
            currentPage: ordersData.currentPage,
            totalPages: ordersData.totalPages,
            stats: {
                pending: pendingCount,
                completed: completedCount,
                cancelled: cancelledCount,
                biddingOrders: biddingCount || pendingCount,
                approved: completedCount,
            },
        });
    } catch (err) {
        console.error("Profile Error:", err);
        res.redirect('/');
    }
});

module.exports = userRouter;
