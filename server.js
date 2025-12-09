const express = require('express');
const flash = require('express-flash');
const { format } = require('date-fns');
const path = require('path');
const MongoStore = require('connect-mongo');
const nunjucks = require('nunjucks');
const session = require('express-session');

const userRouter = require('./routes/userRoute');
const authRouter = require('./routes/authRoute');
const orderRouter = require('./routes/orderRoute');
const paymentRouter = require('./routes/paymentRoute');
const adminRouter = require('./routes/adminRoute');
const writerRouter = require('./routes/writerRoute');

// establish conection with DB before starting server
require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Static files
app.use(express.static(path.join(__dirname, 'views/static')));

// serves file uploads
app.use('/uploads', express.static('uploads'));

// Configure nunjucks to use .html
const env = nunjucks.configure(path.join(__dirname, 'views'), {
    autoescape: true,
    express: app,
    watch: true,
});

// register date filter
env.addFilter('date', (date, formatStr) => {
    if (!date) return "N/A";
    // Default format
    return format(new Date(date), formatStr || 'MMM d, yyyy');
});

// html is the view engine
app.set('view engine', 'html');
app.engine('html', nunjucks.render);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(flash());

// session store
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// register routes
app.use('/admin', adminRouter);
app.use(authRouter);
app.use(orderRouter);
app.use(paymentRouter);
app.use(userRouter);
app.use('/writer', writerRouter);

app.listen(PORT, () => {
    console.log(`Server running at port:${PORT}`);
});
