require('dotenv').config();

// --- IMPORTS ---
const compression = require('compression');
const { doubleCsrf } = require('csrf-csrf');
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
const passport = require('passport');

const userRouter = require('./routes/userRoute');
const authRouter = require('./routes/authRoute');
const orderRouter = require('./routes/orderRoute');
const paymentRouter = require('./routes/paymentRoute');
const adminRouter = require('./routes/adminRoute');
const writerRouter = require('./routes/writerRoute');
const messageRouter = require('./routes/messageRoute');

// Initialize Passport
require('./config/passport');

// --- ENV CHECK ---
if (!process.env.SESSION_SECRET) {
    console.error("❌ FATAL ERROR: SESSION_SECRET is not defined.");
    process.exit(1);
}

if (!process.env.MONGODB_URI) {
    console.error("❌ FATAL ERROR: MONGODB_URI is not defined.");
    process.exit(1);
}

// Production security check
if (process.env.NODE_ENV === 'production') {
    const requiredEnvVars = [
        'SESSION_SECRET',
        'MONGODB_URI',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
    ];
    
    const missing = requiredEnvVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
        console.error(`❌ FATAL ERROR: Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }
    console.log('✅ All required environment variables are set');
}

// --- DB CONNECTION ---
require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// --- SECURITY HEADERS ---
app.use(helmet({
    contentSecurityPolicy: false,
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
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
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(flash());
app.use(compression());

// Trust proxy for production environments
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : 0);

// --- SESSION ---
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tutorsonDB' }),
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    }
}));

// --- PASSPORT AUTHENTICATION ---
app.use(passport.initialize());
app.use(passport.session());

// CSRF handler
const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
    getSecret: () => process.env.SESSION_SECRET,
    getSessionIdentifier: (req) => req.session.id,
    cookieName: "x-csrf-token",
    cookieOptions: { sameSite: "lax", secure: process.env.NODE_ENV === "production" },
});

app.use((req, res, next) => {
    res.locals.csrfToken = generateCsrfToken(req, res);
    next();
});

// Apply CSRF protection only to routes that require it (exclude public auth routes)
app.use((req, res, next) => {
    // Skip CSRF validation for public auth routes and API endpoints
    if (req.path === '/login' || req.path === '/signup' || req.path === '/forgot-password' || req.path === '/reset-password' || req.path === '/orders/api/place-order' || req.path === '/messages/api/check-messages' || req.path === '/messages/api/send' || req.path === '/auth/google' || req.path === '/auth/google/callback') {
        return next();
    }
    doubleCsrfProtection(req, res, next);
});


// --- ROUTES ---
// Health check endpoint for monitoring/load balancers
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

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
