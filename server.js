const MongoStore = require('connect-mongo');
const express = require('express');
const session = require('express-session');
const flash = require('express-flash');
const path = require('path');
const nunjucks = require('nunjucks');
const userRouter = require('./routes/userRoute');
const authRouter = require('./routes/authRoute');
const orderRouter = require('./routes/orderRoute');
const paymentRouter = require('./routes/paymentRoute');

// establish conection with DB before starting server
require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Static files
app.use(express.static(path.join(__dirname, 'views/static')));

// serves file uploads
app.use('/uploads', express.static('uploads'));

// Configure nunjucks to use .html
nunjucks.configure(path.join(__dirname, 'views'), {
    autoescape: true,
    express: app,
    watch: true,
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
app.use(userRouter);
app.use(authRouter);
app.use(orderRouter);
app.use(paymentRouter);

app.listen(PORT, () => {
    console.log(`Server running at port:${PORT}`);
});
