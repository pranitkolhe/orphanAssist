const express = require("express");
const router = express.Router();
const {
  showSignupPage,
  handleSignup,
  showLoginPage,
  handleLogin,
  handleLogout,
  handleUpload,
  showDashboard,
  handleReject,
  handleAccept,
  showProfile,
  handleResponse,
} = require("../controllers/indexController");

router.get("/", (req, res) => {
  res.render("pages/index/home", { user: req.session.user || null });
});
router.get("/profile/:id", showProfile);
router.get("/dashboard/:id", showDashboard);
router.get("/signup", showSignupPage);
router.get("/login", showLoginPage);
router.get("/logout", handleLogout);

router.post("/signup", handleSignup);
router.post("/login", handleLogin);
router.post("/upload", handleUpload);

// Accept/reject request
router.post("/respond", handleResponse);

module.exports = router;
