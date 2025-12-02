const mongoose = require('mongoose');
const User = require('../models/user');

const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    pages: {
        type: Number,
        default: function () {
            return this.pages * 275;
        }
    },
    files: {
        type: [String], // file paths or cloud URLs
        default: []
    },
    deadline: {
        type: Date,
        required: true,
    },
    writerId: {
        type: String,
        default: "Unassigned",
    },
    writerCategory: {
        type: String,
        enum: ["Standard", "Advanced", "Expert"],
        default: "Standard",
    },
    price: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: [
            "pending",
            "in progess",
            "completed",
            "revision",
            "cancelled"
        ],
        default: "pending"
    },
    instructions: {
        type: String,
        required: true,
    },

    spacing: {
        type: String,
        enum: ["Single Spaced", "Double Spaced"],
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', OrderSchema);
