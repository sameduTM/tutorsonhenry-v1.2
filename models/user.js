const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: false },
    password: { type: String, required: true }, // hashed password
    role: { type: String, enum: ['student', 'writer', 'admin'], default: 'student' },
    createdAt: { type: Date, default: Date.now },
    walletBalance: { type: Number, default: 0 },
});

module.exports = mongoose.model('User', userSchema);
