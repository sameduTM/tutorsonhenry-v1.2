const { default: mongoose } = require('mongoose');

const gallerySchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['result', 'chat'],
        required: true,
    },
    imageUrl: { type: String, required: true }, // Path to file
    filename: { type: String, required: true }, // For deletion

    // Fields specific to Exam Results
    examName: { type: String, required: false },
    score: { type: String },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Gallery', gallerySchema);
