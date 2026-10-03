const express = require("express");

const {
    getMyProfile,
    updateMyProfile,
    changeMyPassword,
    uploadProfileImage
} = require("../controllers/profileController");

const {
    requireAuth
} = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get(
    "/",
    requireAuth,
    getMyProfile
);

router.put(
    "/",
    requireAuth,
    updateMyProfile
);

router.patch(
    "/password",
    requireAuth,
    changeMyPassword
);

router.post(
    "/image",
    requireAuth,
    upload.single("profileImage"),
    uploadProfileImage
);

module.exports = router;
