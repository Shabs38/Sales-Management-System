const requireAuth = (req, res, next) => {

    if (!req.session.user) {

        // Browser page request
        if (req.accepts('html')) {

            return res.redirect(
                '/pages/index.html'
            );
        }

        // API request
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    next();
};


const requireDirector = (req, res, next) => {

    if (!req.session.user) {

        // Browser page request
        if (req.accepts('html')) {

            return res.redirect(
                '/pages/index.html'
            );
        }

        // API request
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }


    if (req.session.user.is_platform_admin === true || req.session.user.role !== "director") {

        // Browser page request
        if (req.accepts('html')) {

            return res.status(403).send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport"
                          content="width=device-width, initial-scale=1.0">
                    <title>Access Denied</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            margin: 0;
                            background: #f5f7f8;
                        }

                        .box {
                            text-align: center;
                            background: white;
                            padding: 35px;
                            border-radius: 12px;
                            box-shadow: 0 5px 25px rgba(0,0,0,0.08);
                            max-width: 400px;
                        }

                        h1 {
                            color: #b42318;
                            margin-bottom: 10px;
                        }

                        p {
                            color: #555;
                        }

                        a {
                            display: inline-block;
                            margin-top: 15px;
                            padding: 10px 18px;
                            background: #075e73;
                            color: white;
                            text-decoration: none;
                            border-radius: 6px;
                        }
                    </style>
                </head>

                <body>

                    <div class="box">

                        <h1>Access Denied</h1>

                        <p>
                            You do not have permission to access this page.
                        </p>

                        <a href="/pages/index.html">
                            Return to Login
                        </a>

                    </div>

                </body>
                </html>
            `);
        }

        // API request
        return res.status(403).json({
            success: false,
            message: "Director access required."
        });
    }

    next();
};


const requireManagerOrDirector = (req, res, next) => {

    if (!req.session.user) {

        if (req.accepts('html')) {
            return res.redirect('/pages/index.html');
        }

        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    const role = req.session.user.role;

    if (req.session.user.is_platform_admin === true || (role !== "manager" && role !== "director")) {

        if (req.accepts('html')) {
            return res.status(403).send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport"
                          content="width=device-width, initial-scale=1.0">
                    <title>Access Denied</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            margin: 0;
                            background: #f5f7f8;
                        }

                        .box {
                            text-align: center;
                            background: white;
                            padding: 35px;
                            border-radius: 12px;
                            box-shadow: 0 5px 25px rgba(0,0,0,0.08);
                            max-width: 400px;
                        }

                        h1 {
                            color: #b42318;
                            margin-bottom: 10px;
                        }

                        p {
                            color: #555;
                        }

                        a {
                            display: inline-block;
                            margin-top: 15px;
                            padding: 10px 18px;
                            background: #075e73;
                            color: white;
                            text-decoration: none;
                            border-radius: 6px;
                        }
                    </style>
                </head>

                <body>
                    <div class="box">
                        <h1>Access Denied</h1>

                        <p>
                            Manager or Director access required.
                        </p>

                        <a href="/pages/index.html">
                            Return to Login
                        </a>
                    </div>
                </body>
                </html>
            `);
        }

        return res.status(403).json({
            success: false,
            message: "Manager or Director access required."
        });
    }

    next();
};


// Software-owner access, separate from business director access.
const requirePlatformAdmin = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    if (req.session.user.is_platform_admin !== true) {
        return res.status(403).json({
            success: false,
            message: "Platform administrator access required."
        });
    }

    next();
};

// Require a business membership before accessing tenant-scoped routes.
const requireBusiness = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    const user = req.session.user;

    if (user.is_platform_admin === true) {
        return res.status(403).json({
            success: false,
            message: "A business membership is required for this operation."
        });
    }

    if (!Number.isInteger(Number(user.business_id)) ||
        Number(user.business_id) <= 0) {
        return res.status(403).json({
            success: false,
            message: "No valid business is associated with this account."
        });
    }

    next();
};

module.exports = {
    requireAuth,
    requireDirector,
    requireManagerOrDirector,
    requirePlatformAdmin,
    requireBusiness
};