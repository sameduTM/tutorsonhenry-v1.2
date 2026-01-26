require('dotenv').config();

// --- IMPORTS ---
const compression = require('compression');
const { csrfSync } = require('csrf-sync');
const express = require('express');
const flash = require('express-flash');
const { format } = require('date-fns');
const helmet = require('helmet');
const path = require('path');
const MongoStore = require('connect-mongo').default || require('connect-mongo');
const nunjucks = require('nunjucks');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const userRouter = require('./routes/userRoute');
const authRouter = require('./routes/authRoute');
const orderRouter = require('./routes/orderRoute');
const paymentRouter = require('./routes/paymentRoute');
const adminRouter = require('./routes/adminRoute');
const writerRouter = require('./routes/writerRoute');
const messageRouter = require('./routes/messageRoute');

// --- ENV CHECK ---
if (!process.env.SESSION_SECRET) {
    console.error("❌ FATAL ERROR: SESSION_SECRET is not defined.");
    process.exit(1);
}

// --- DB CONNECTION ---
require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// --- SECURITY HEADERS ---
app.use(helmet({
    contentSecurityPolicy: false,
}));

// --- STATIC FILES ---
app.use(express.static(path.join(__dirname, 'views/static')));
app.use('/uploads', express.static('uploads'));

// --- TEMPLATE ENGINE ---
const env = nunjucks.configure(path.join(__dirname, 'views'), {
    autoescape: true,
    express: app,
    watch: true,
});

env.addFilter('date', (date, formatStr) => {
    if (!date) return "N/A";
    return format(new Date(date), formatStr || 'MMM d, yyyy');
});

app.set('view engine', 'html');
app.engine('html', nunjucks.render);

// --- MIDDLEWARE ---
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(flash());
app.use(compression());

// --- SESSION ---
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tutorsonDB' }),
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
    }
}));

// CSRF handler - enhanced to work with multipart/form-data
const { csrfSynchronisedProtection, generateToken } = csrfSync({
    getTokenFromRequest: (req) => {
        // Check multiple sources for CSRF token:
        // 1. Hidden form field (_csrf)
        // 2. X-CSRF-Token header
        // 3. Cookie
        // 4. Query parameter (for forms that can't use headers)
        return req.body?.['_csrf'] || 
               req.headers?.['x-csrf-token'] || 
               req.cookies?.['x-csrf-token'] ||
               req.query?.['_csrf'];
    }
});


// Create token for every request and pass it to every view
app.use((req, res, next) => {
    res.locals.csrfToken = generateToken(req);
    next();
});

// Apply CSRF protection, but skip for file upload routes that will validate CSRF after file parsing
app.use((req, res, next) => {
    // Skip CSRF validation for POST file upload routes (will validate in route handlers)
    const uploadRoutes = ['/admin/gallery/chat', '/admin/gallery/result'];
    const isFileUpload = uploadRoutes.some(route => req.path.startsWith(route)) && req.method === 'POST';
    
    if (isFileUpload) {
        return next();
    }
    
    csrfSynchronisedProtection(req, res, next);
});


// --- ROUTES ---
// Mount specific routers first to prevent conflicts
app.use('/admin', adminRouter);
app.use('/writer', writerRouter);
app.use(authRouter);
app.use(messageRouter);
app.use(orderRouter);
app.use(paymentRouter);
app.use(userRouter); // Usually handles "/" so keep it last or ensure it doesn't block others

// --- ERROR HANDLING ---
app.use((req, res) => {
    res.status(404);
    try {
        return res.render('404.html', { images: { logo: '/images/medical-team.png' } });
    } catch (e) {
        return res.send("404 - Page Not Found");
    }
});


app.use((err, req, res, next) => {
    // CSRF Error Handler
    if (err.code === 'EBADCSRFTOKEN') {
        console.warn("⚠️ CSRF Validation Failed");
        req.flash('error', 'Form session expired. Please try again.');
        return res.redirect('back');
    }

    console.error("Server Error:", err.stack);
    res.status(500);
    try {
        return res.render('500.html', {
            images: { logo: '/images/medical-team.png' },
            error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
        });
    } catch (e) {
        return res.send("500 - Internal Server Error");
    }
});

app.listen(PORT, () => {
    console.log(`Server running at port:${PORT}`);
});
