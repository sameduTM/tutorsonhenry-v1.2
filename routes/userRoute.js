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
        res.status(201).redirect('/login');

    } catch (err) {
        console.error('Signup error:', err);

        let errorMessage = "Signup failed. Please try again.";
        let statusCode = 500;

        // Handle Duplicate Email Error
        if (err.code === 11000) {
            errorMessage = 'That email is already registered. Please login.';
            req.flash('error', 'Email already registered');
            statusCode = 400; // User error, not server error
        }

        // FIX: Use 'return' here and REMOVE next(err) to prevent the "Headers Sent" crash
        return res.status(statusCode).render('sign-up.html', {
            images: IMAGE_PATHS,
            error: errorMessage,
            values: req.body, // Keeps the form filled
        });
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

        res.render('profile.html', {
            user: currentUser,
            images: IMAGE_PATHS,
            // FIX: Ensure we pass the array (.orders), not the wrapper object
            orders: ordersData.orders || [],
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