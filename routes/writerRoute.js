const express = require('express');
const Order = require('../models/orders');
const { requireWriter } = require('../middlewares/roleAuth'); // Ensure this matches your export name (requireTutor or requireWriter)

const writerRouter = express.Router();

// Apply middleware
writerRouter.use(requireWriter); 

const IMAGE_PATHS = {
    logo: '/images/medical-team.png',
    hero: '',
}

// GET: Writer Dashboard
writerRouter.get('/dashboard', async (req, res) => {
    try {
        const currentWriterId = req.session.user.id;

        // Find orders assigned to this writer
        const myOrders = await Order.find({
            writerId: currentWriterId,
            // FIX: 'In Progress' must match the Enum in your Model exactly (Title Case)
            status: { $in: ['In progress', 'Completed'] } 
        })
            .populate('userId', 'name email') 
            .sort({ deadline: 1 }); 

        res.render('writer/dashboard.html', {
            user: req.session.user,
            orders: myOrders,
            images: IMAGE_PATHS,
        });

    } catch (err) {
        console.error("Writer Dash Error:", err);
        req.flash('error', 'Could not load dashboard.');
        res.redirect('/');
    }
});

// POST: Update Order Status
// FIX: Changed route from '/update-order' to '/update-status' to match the HTML Form
writerRouter.post('/update-status', async (req, res) => {
    try {
        const { orderId, newStatus } = req.body;
        const currentWriterId = req.session.user.id;

        // FIX: Use findOneAndUpdate when querying by multiple fields (id + writerId)
        const order = await Order.findOneAndUpdate(
            { _id: orderId, writerId: currentWriterId },
            { status: newStatus },
            { new: true },
        );

        if (!order) {
            req.flash('error', 'Order not found or unauthorized');
            return res.redirect('/writer/dashboard');
        }

        req.flash('success', `Order #${order._id.toString().slice(-6)} marked as ${newStatus}.`);
        res.redirect('/writer/dashboard'); // Ensure we redirect back to refresh the page
        
    } catch (err) {
        console.error("Status Update Error:", err);
        req.flash('error', 'Failed to update status.');
        res.redirect('/writer/dashboard');
    }
});

// GET Single Order Details (Writer View)
writerRouter.get('/orders/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const writerId = req.session.user.id;

        // 1. Fetch Order
        const order = await Order.findById(orderId)
            .populate('userId', 'name'); 

        if (!order) {
            req.flash('error', 'Order not found.');
            return res.redirect('/writer/dashboard');
        }

        // 2. SECURITY: Verify Access
        // Writers can view an order ONLY if:
        // A) They are already assigned to it
        // B) The order is available for bidding
        
        const isAssigned = order.writerId && order.writerId.toString() === writerId;
        const isOpenForBidding = order.status === 'Bidding' || order.status === 'Pending';

        if (!isAssigned && !isOpenForBidding) {
            req.flash('error', 'You do not have permission to view this order.');
            return res.redirect('/writer/dashboard');
        }

        // 3. Render Template
        res.render('writer/order-details.html', {
            order,
            user: req.session.user,
            isWriter: true,         
            isAssigned: isAssigned, 
            images: IMAGE_PATHS 
        });

    } catch (err) {
        console.error("Writer Order View Error:", err);
        req.flash('error', 'Invalid Order ID.');
        res.redirect('/writer/dashboard');
    }
});

module.exports = writerRouter;
