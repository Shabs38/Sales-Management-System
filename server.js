const express = require('express');
const cors = require('cors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
require('dotenv').config();




const authRoutes = require('./routes/authRoutes');

const productRoutes = require('./routes/productRoutes');

const customerRoutes = require('./routes/customerRoutes');

const salesRoutes = require('./routes/salesRoutes');

const managerRoutes = require('./routes/managerRoutes'); 

const dashboardRoutes = require('./routes/dashboardRoutes');

const managerDashboardRoutes = require('./routes/managerDashboardRoutes');

const notificationRoutes =
    require('./routes/notificationRoutes');

const reportRoutes =
    require('./routes/reportRoutes');
    
const profileRoutes =
    require("./routes/profileRoutes");
    
const settingsRoutes =
    require("./routes/settingsRoutes");


const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;


// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(session({
    store: new pgSession({
        pool: require('./config/db'),
        tableName: 'user_sessions',
        createTableIfMissing: true
    }),

    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24
    }
}))
;


app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);


// API routes
app.use('/api/auth', authRoutes);

app.use('/api/products', productRoutes);

app.use('/api/customers', customerRoutes);

app.use('/api/sales', salesRoutes);

app.use('/api/managers', managerRoutes);

app.use('/api/dashboard', dashboardRoutes);

app.use('/api/dashboard/manager', managerDashboardRoutes);

app.use('/api/notifications',
notificationRoutes);

app.use('/api/reports',
reportRoutes);

app.use('/api/profile',
profileRoutes);


app.use("/api/settings",
settingsRoutes);



// =================================
// PAGE ACCESS CONTROL
// =================================

const {
    requireAuth,
    requireDirector
} = require('./middleware/authMiddleware');


// Public login page
app.get('/', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            'public/pages/index.html'
        )
    );

});


// ---------------------------------
// DIRECTOR-ONLY PAGES
// ---------------------------------

app.get(
    '/pages/director-dashboard.html',
    requireDirector,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                'public/pages/director-dashboard.html'
            )
        );

    }
);


app.get(
    '/pages/director-products.html',
    requireDirector,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                'public/pages/director-products.html'
            )
        );

    }
);


app.get(
    '/pages/managers.html',
    requireDirector,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                'public/pages/managers.html'
            )
        );

    }
);


// ---------------------------------
// AUTHENTICATED PAGES
// ---------------------------------

app.get(
    '/pages/manager-dashboard.html',
    requireAuth,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                'public/pages/manager-dashboard.html'
            )
        );

    }
);



//PROTECT MANAGER'S PAGE ROUTES


app.get('/pages/sales.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/sales.html'));
});

app.get('/pages/product.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/product.html'));
});

app.get('/pages/customer.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/customer.html'));
});

app.get('/pages/report.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/report.html'));
});

app.get('/pages/profile.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/profile.html'));
});

app.get('/pages/settings.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/settings.html'));
});



// ---------------------------------
// STATIC FILES
// ---------------------------------

app.use(
    express.static(
        path.join(__dirname, 'public')
    )
);
// Test route
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Sales Management API is working.'
    });
});

app.listen(PORT, () => {
    console.log(`Sales Management Server running on http://localhost:${PORT}`);
});
