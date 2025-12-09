const express = require('express');
const upload = require('../middlewares/upload');
const Order = require('../models/orders');
const OrderService = require('../services/orderService');
// IMPORTANT: Import requireStudent to protect specific routes
const { requireStudent } = require('../middlewares/roleAuth');

const orderRouter = express.Router();

const IMAGE_PATHS = {
    logo: '/images/medical-team.png',
};

// Wrapper to catch "File Too Large" errors gracefully
const uploadMiddleware = (req, res, next) => {
    const uploadProcess = upload.array("files", 10);
    uploadProcess(req, res, (err) => {
        if (err) {
            console.error("Upload Error:", err);
            req.flash("error", err.message);
            return res.redirect('/place-order');
        }
        next();
    });
};

// =========================================================
// 1. STUDENT ONLY ROUTES (Protected by requireStudent)
// =========================================================

// GET Page: Place Order
orderRouter.get('/place-order', requireStudent, (req, res) => {
    res.render('place-order.html', {
        images: IMAGE_PATHS,
        user: req.session.user,
    });
});

// POST: Submit Order
orderRouter.post('/place-order', requireStudent, uploadMiddleware, async (req, res) => {
    try {
        const user = req.session.user;

        // Prepare file data
        let fileData = [];
        if (req.files && req.files.length > 0) {
            fileData = req.files.map(file => ({
                originalName: file.originalname,
                filename: file.filename,
                path: "/uploads/" + user.id + "/" + file.filename,
                size: file.size,
                mimetype: file.mimetype,
            }));
        }

        const newOrder = await OrderService.createOrder(user, req.body, fileData);

        req.flash("success", "Order placed successfully!");
        return res.redirect(`/orders/${newOrder._id}`);

    } catch (err) {
        console.error("Place Order Error:", err);
        req.flash("error", "Failed to place order. Please try again.");
        return res.redirect('/place-order');
    }
});

// GET: List My Orders
orderRouter.get('/orders', requireStudent, async (req, res) => {
    try {
        const user = req.session.user;
        const status = req.query.status || 'all';
        const page = parseInt(req.query.page) || 1;
        const limit = 10;

        const { orders, currentPage, totalPages, statusFilter } = await OrderService.getOrdersByUserId(user, {
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
            images: IMAGE_PATHS
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to load orders.");
    }
});

// =========================================================
// 2. SHARED ACCESS ROUTE (No requireStudent here)
// =========================================================

// GET: Single Order Details
// Accessible by: Owner (Student), Assigned Writer, or Admin
orderRouter.get('/orders/:id', async (req, res) => {
    try {
        // 1. Basic Login Check (We don't use requireStudent here so Admins/Writers can pass)
        if (!req.session.user) {
            req.flash('error', 'Please login first.');
            return res.redirect('/login');
        }

        const orderId = req.params.id;
        const user = req.session.user;

        // 2. Fetch Order
        const order = await OrderService.getOrderById(orderId);

        if (!order) {
            req.flash('error', 'Order not found.');
            return res.redirect('/profile');
        }

        // 3. ACCESS CONTROL LOGIC
        const isOwner = order.userId.toString() === user.id.toString();
        // Check if current user is the assigned writer (safe check for null)
        const isAssignedWriter = order.writerId && (order.writerId.toString() === user.id.toString());
        const isAdmin = user.role === 'admin';

        // 4. Block Unauthorized Users
        if (!isOwner && !isAssignedWriter && !isAdmin) {
            req.flash('error', 'You are not authorized to view this order');
            // Redirect based on role to keep them in their dashboard
            if (user.role === 'admin') return res.redirect('/admin/dashboard');
            if (user.role === 'writer') return res.redirect('/writer/dashboard');
            return res.redirect('/profile');
        }

        // 5. Render Template
        // We pass flags so the template can show/hide buttons if needed
        res.render('order-details.html', {
            order,
            user,
            isWriter: isAssignedWriter,
            isAdmin: isAdmin,
            images: IMAGE_PATHS,
        });

    } catch (err) {
        console.error("Error fetching order:", err);
        req.flash('error', 'Invalid Order ID.');
        res.redirect('/profile');
    }
});

module.exports = orderRouter;