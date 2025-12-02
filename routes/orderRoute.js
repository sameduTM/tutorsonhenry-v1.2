const express = require('express');
const upload = require('../middlewares/upload');
const Order = require('../models/orders');
const OrderService = require('../services/orderService');

const orderRouter = express.Router();

orderRouter.get('/place-order', (req, res) => {
    res.render('place-order.html', {
        images: {
            logo: '/images//medical-team.png',
        },
        user: req.session.user,
    });
});

// place order
orderRouter.post('/place-order', upload.array("files", 10), async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) return res.redirect('/login');

        const filePaths = req.files.map(file => {
            return "/uploads/" + user._id + "/" + file.filename;
        });

        await OrderService.createOrder(user, req.body, filePaths);

        return res.redirect("/orders?success=1");

    } catch (err) {
        console.error(err);
        return res.status(500).send("Failed to place order.");
    }
});

// Get /orders
orderRouter.get('/orders', async (req, res) => {
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

module.exports = orderRouter;
