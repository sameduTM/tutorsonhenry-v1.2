const express = require('express');
const Order = require('../models/orders');
const User = require('../models/user');
const { requireAdmin } = require('../middlewares/roleAuth');

const adminRouter = express.Router();

const IMAGE_PATHS = {
    logo: '/images/medical-team.png',
    hero: '',
}

adminRouter.use(requireAdmin);

// GET admin dashboard
adminRouter.get('/dashboard', async (req, res) => {
    try {
        // Fetch all orders - populate student and tutor details
        const orders = await Order.find()
            .populate('userId', 'name email')
            .populate('writerId', 'name')
            .sort({ createdAt: -1 });

        // fetch all writers (for the dropdown)
        const writers = await User.find({ role: 'writer' }).select('name _id');

        // stats
        const pendingCount = await Order.countDocuments({ status: 'Pending' });

        return res.render('admin/dashboard.html', {
            user: req.session.user,
            orders,
            writers,
            pendingCount,
            images: IMAGE_PATHS,
        });
    } catch (err) {
        console.error("Admin Dash Error:", err);
        res.redirect('/');
    }
});

// POST Assign Order
adminRouter.post('/assign-order', async (req, res) => {
    try {
        const { orderId, writerId } = req.body;

        await Order.findByIdAndUpdate(orderId, {
            writerId,
            status: 'In progress',
        });

        req.flash('success', 'Writer successfully assigned');
        res.redirect('/dashboard');
    } catch (err) {
        console.error("Assignment Error:", err);
        req.flash('error', 'Failed to assign a tutor');
        res.redirect('/admin/dashboard');
    }
});

adminRouter.get('/users', async (req, res) => {
    try {
        // fetch all users (newest first)
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        res.render('admin/users.html', {
            user: req.session.user,
            users,
            images: IMAGE_PATHS,
        });
    } catch (err) {
        console.error("Admin Users Page Error:", err);
        req.flash('error', 'Could not load user list.');
        res.redirect('/admin/dashboard');
    }
});

adminRouter.post('/update-role', async (req, res) => {
    try {
        const { targetUserId, newRole } = req.body;
        const currentAdminId = req.session.user._id || req.session.user.id;

        // prevent self-lockout
        if (targetUserId === currentAdminId.toString()) {
            req.flash('error', 'You cannot change your own role');
            return res.redirect('/admin/users');
        }

        await User.findByIdAndUpdate(targetUserId, { role: newRole });

        req.flash('success', 'User role updated successfully.');
        res.redirect('/admin/users');

    } catch (err) {
        console.error("Role Update Error:", err);
        req.flash('error', 'Failed to update role.');
        res.redirect('/admin/users');
    }
});


// GET Single Order Details (Admin View)
adminRouter.get('/orders/:id', async (req, res) => {
    try {
        const orderId = req.params.id;

        // fetch order & populate users
        const order = await Order.findById(orderId)
            .populate('userId', 'name email')
            .populate('writerId', 'name email');
        
        if (!order) {
            req.flash('error', 'Order not found.');
            return res.redirect('/admin/dashboard');
        }

        // render template
        res.render('admin/order-details.html', {
            order,
            user: req.session.user,
            images: IMAGE_PATHS,
        });
    } catch (err) {
        console.error("Error fetching order:", err);
        req.flash('error', 'Invalid Order ID.');
        res.redirect('/admin/dashboard');
    }
});

module.exports = adminRouter;
