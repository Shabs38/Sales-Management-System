const express = require("express");

const {
    getBusinessBranding,
    updateBusinessBranding,
    uploadBusinessLogo
} = require("../controllers/businessBrandingController");

const {
    requireAuth,
    requireDirector,
    requireManagerOrDirector,
    requireBusiness
} = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");


const router = express.Router();

router.get(
    "/",
    requireAuth,
    requireBusiness,
    requireManagerOrDirector,
    getBusinessBranding
);

router.put(
    "/",
    requireAuth,
    requireBusiness,
    requireDirector,
    updateBusinessBranding
);

router.post(
    "/logo",
    requireAuth,
    requireBusiness,
    requireDirector,
    upload.single("businessLogo"),
    uploadBusinessLogo
);

module.exports = router;
