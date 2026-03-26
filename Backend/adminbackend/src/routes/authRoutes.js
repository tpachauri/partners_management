const express = require("express");
const router = express.Router();
const { signup, signin, signout, getUser, enrollMFA, challengeMFA, verifyMFA, unenrollMFA } = require("../controller/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signout", authMiddleware, signout);
router.get("/user", authMiddleware, getUser);

router.post('/mfa/phone/enroll', authMiddleware, enrollMFA);
router.post('/mfa/phone/challenge', authMiddleware, challengeMFA);
router.post('/mfa/phone/verify', authMiddleware, verifyMFA);
router.delete('/mfa/phone/unenroll', authMiddleware, unenrollMFA);
module.exports = router;