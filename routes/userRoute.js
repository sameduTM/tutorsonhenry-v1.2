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
    const userData = req.body;

    try {
        const user = await UserService.createUser(userData);

        // Render login page with user's email prefilled
        res.status(201).render('login.html', {
            images: IMAGE_PATHS,
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).render('sign-up.html',
            { images: IMAGE_PATHS },
            { error: 'Signup failed. Please try again.' },
        );
        // or you can call next(err) if you have error-handling middleware
        next(err);
    }
});


// Protect routes with privileged information
userRouter.use(requireStudent);

userRouter.get('/messages', (req, res) => {
    const user = req.session.user;

    if (!user) return res.redirect('/login');
    res.render('messages.html', {
        images: IMAGE_PATHS,
        user,
    });
});

userRouter.get('/topup', (req, res) => {
    const user = req.session.user;

    if (!user) return res.redirect('/login');

    res.render('topup.html', {
        images: IMAGE_PATHS,
        user,
    })
});

userRouter.get('/profile', async (req, res) => {
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
