import { Router } from "express";
import {
  login,
  signup,
  profile,
  updateProfile,
  deactivate,
  verify,
  getUserById,
} from "../controllers/user.contoller.js";
import protect from "../middlewares/auth.middleware.js";
import { profileUpload } from "../middlewares/upload.middleware.js";
import passport from "../config/passport.js";
import { authLimiter } from "../middlewares/rateLimiter.middleware.js";
import { isR2Configured, uploadToR2, saveToLocal } from "../config/r2.js";

const router = Router();

router.post("/login", authLimiter, login);
router.post("/register", authLimiter, signup);
router.get("/verify-email", verify);
router.get("/profile", protect, profile);
router.get("/user/:userId", protect, getUserById);
router.put("/profile", protect, updateProfile);
router.post("/profile/deactivate", protect, deactivate);
router.post(
  "/profile/upload",
  protect,
  profileUpload.single("profilePicture"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      let profilePictureUrl;
      if (isR2Configured) {
        try {
          profilePictureUrl = await uploadToR2({
            folder: "profiles",
            file: req.file,
          });
        } catch (error) {
          console.warn("R2 upload failed, falling back to local disk:", error.message);
          profilePictureUrl = await saveToLocal({
            folder: "profiles",
            file: req.file,
          });
        }
      } else {
        profilePictureUrl = `/uploads/profiles/${req.file.filename}`;
      }

      res.status(200).json({
        success: true,
        profilePicture: profilePictureUrl,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

const isGoogleOAuthConfigured =
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID";

if (isGoogleOAuthConfigured) {
  router.get(
    "/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    }),
  );

  router.get(
    "/google/callback",
    passport.authenticate("google", {
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
      session: false,
    }),
    (req, res) => {
      const token = req.user.createJWT();

      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(
          JSON.stringify({
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            profilePicture: req.user.profilePicture,
          }),
        )}`,
      );
    },
  );
} else {
  router.get("/google", (req, res) => {
    res.status(503).json({
      success: false,
      message:
        "Google OAuth is not configured. Please add credentials to .env file.",
    });
  });

  router.get("/google/callback", (req, res) => {
    res.redirect(
      `${process.env.FRONTEND_URL}/login?error=google_not_configured`,
    );
  });
}

export default router;
