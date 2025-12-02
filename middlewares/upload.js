const multer = require('multer');
const fs = require('fs');
const path = require('path');

// ensure uploads folder exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userFolder = path.join(uploadsDir, req.session.user._id.toString());

        if (!fs.existsSync(userFolder)) {
            fs.mkdirSync(userFolder);
        }

        cb(null, userFolder);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueName + ext);
    }
});

// allowed file types
const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
];

function fileFilter(req, file, cb) {
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG"));
    }
}

// File size limit: 10MB
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = upload;
