const express = require('express');
const MessageService = require('../services/messageService');
const Order = require('../models/orders');
const { requireLogin } = require('../middlewares/roleAuth');

const messageRouter = express.Router();

// middleware to ensure user is logged in
// messageRouter.use(requireLogin);

// POST: send a message
messageRouter.post('/messages/send', requireLogin, async (req, res) => {
    try {
        const { orderId, content } = req.body;
        const user = req.session.user;

        // Security Check: Ensure user belongs to this order
        const order = await Order.findById(orderId);
        if (!order) {
            req.flash('error', 'Order not found');
            return res.redirect('back');
        }

        const isOwner = order.userId.toString() === user.id.toString();
        const isWriter = order.writerId.toString() && order.writerId.toString() === user.id.toString();
        const isAdmin = user.role === 'admin';

        if (!isOwner && !isWriter && !isAdmin) {
            req.flash('error', 'Unauthorized to send messages in this order.');
            return res.redirect('back');
        }

        // Send Message
        await MessageService.sendMessage(user, orderId, content);

        // Redirect back to order page (reload to show new message)
        // If writer, go to writer view, else student view
        if (user.role === 'writer') {
            res.redirect(`/writer/orders/${orderId}`);
        } else if (user.role === 'admin') {
            res.redirect(`/admin/orders/${orderId}`);
        } else {
            res.redirect(`/orders/${orderId}`);
        }
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to send message.');
        res.redirect('back');
    }
});

module.exports = messageRouter;
