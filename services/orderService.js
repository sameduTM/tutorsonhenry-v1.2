const Order = require('../models/orders');
const upload = require('../middlewares/upload');

class OrderService {
    static async createOrder(user, order, filePaths) {
        try {
            const newOrder = await Order.create({
                user: user._id,
                title: order.title,
                subject: order.subject,
                type: order.type,
                level: order.level,
                spacing: order.spacing,
                deadline: order.deadline,
                pages: order.pages,
                writerCategory: order.writerCategory,
                instructions: order.instructions,
                files: filePaths,
                price: order.price
            });

            return newOrder;
        } catch (err) {
            console.error("Order creation failed:", err);
            throw new Error("Could not create order");
        }
    }
    static async getOrdersByUserId(user, { status = 'all', page = 1, limit = 10 } = {}) {
        const query = { user: user._id };

        if (status !== 'all') {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const totalOrders = await Order.countDocuments(query);

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return {
            orders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            statusFilter: status,
        };
    }
}

module.exports = OrderService;
