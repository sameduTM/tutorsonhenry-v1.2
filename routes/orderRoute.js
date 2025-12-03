const express = require('express');
const upload = require('../middlewares/upload');
const Order = require('../models/orders');
const OrderService = require('../services/orderService');

const orderRouter = express.Router();

// Wrapper to catch "File Too Large" or "Invalid Type" errors gracefully
const uploadMiddleware = (req, res, next) => {
    // must match HTML input name="files"
    const uploadProcess = upload.array("files", 10);

    uploadProcess(req, res, (err) => {
        if (err) {
            // catches multer errors (e.g. file too large)
            console.error("Upload Error:", err);
            req.flash("error", err.message);
            return res.redirect('/place-order');
        }
        next();
    });
}

const requireLogin = (req, res, next) => {
    if (!req.session || !req.session.user) {
        // user is not logged in
        req.flash('error', 'Please login to place an order.');
        return res.redirect('/login');
    }
    // User s logged in -> proceed
    next();
}

orderRouter.get('/place-order', requireLogin, (req, res) => {
    res.render('place-order.html', {
        images: {
            logo: '/images//medical-team.png',
        },
        user: req.session.user,
    });
});

// place order
orderRouter.post('/place-order', requireLogin, uploadMiddleware, async (req, res) => {
    try {
        const user = req.session.user;

        // prepare file data for MongoDB Schema
        let fileData = [];
        if (req.files && req.files.length > 0) {
            fileData = req.files.map(file => ({
                originalName: file.originalName,
                filename: file.filename,
                path: "/uploads/" + user._id + "/" + file.filename,
                size: file.size,
                mimetype: file.mimetype,
            }));
        }

        // create the order
        const newOrder = await OrderService.createOrder(user, req.body, fileData);

        // success redirect
        // Redirect to the SPECIFIC order page so they can see what they bought
        req.flash("success", "Order placed successfully!");
        return res.redirect(`/orders/${newOrder._id}`);

    } catch (err) {
        console.error("Place Order Error:", err);
        req.flash("error", "Failed to place order. Please try again.");
        return res.redirect('/place-order');
    }
});

// Get /orders
orderRouter.get('/orders', requireLogin, async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) return res.redirect('/login');

        const status = req.query.status || 'all';
        const page = parseInt(req.query.page) || 1;
        const limit = 10;


        const {
            orders,
            currentPage,
            totalPages,
            statusFilter
        } = await OrderService.getOrdersByUserId(user, {
            status,
            page,
            limit
        });

        res.render('my-orders.html', {
            user,
            orders,
            currentPage,
            totalPages,
            statusFilter,
            success: !!req.query.success,
            images: {
                logo: '/images/medical-team.png',
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to load orders.");
    }
});

// GET Single Order Details
orderRouter.get('/orders/:id', requireLogin, async (req, res) => {
    try {
        const orderId = req.params.id;
        const user = req.session.user;

        // fetch the order
        const order = await OrderService.getOrderById(orderId);

        // check if order exists
        if (!order) {
            req.flash('error', 'Order not found.');
            return res.redirect('/profile');
        }

        // Security check: Ensure order belongs to user
        // convert both IDs to string to compare safely
        if (order.userId.toString() !== user.id.toString()) {
            req.flash('error', 'You are not authorized to view this order');
            return res.redirect('/profile');
        }

        // render the page
        res.render('order-details.html', {
            order,
            user,
            images: {
                logo: '/images/medical-team.png',
            }
        });
    } catch (err) {
        console.error("Error fetching order:", err);
        req.flash('error', 'Invalid Order ID.');
        res.redirect('/profile');
    }
});

module.exports = orderRouter;
