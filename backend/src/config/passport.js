import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model.js";

let isConfigured = false;

export function initializePassport() {
  if (isConfigured) return;

  if (
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID"
  ) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails[0].value;

            let user = await User.findOne({ email });

            if (user) {
              if (profile.photos && profile.photos[0]) {
                user.profilePicture = profile.photos[0].value;
              }
              user.lastLogin = Date.now();
              await user.save();
              return done(null, user);
            }

            const googleProfilePic =
              profile.photos && profile.photos[0]
                ? profile.photos[0].value.replace("s96-c", "s400-c")
                : "";

            const baseUsername = profile.displayName || email.split("@")[0];

            let username = baseUsername;
            let attempts = 0;

            while (attempts < 10) {
              try {
                user = await User.create({
                  username:
                    attempts === 0 ? username : `${username}_${attempts}`,
                  email,
                  profilePicture: googleProfilePic,
                  password: "GOOGLE_AUTH_" + profile.id,
                  isVerified: true,
                  lastLogin: Date.now(),
                });

                return done(null, user);
              } catch (error) {
                if (error.code === 11000) {
                  if (error.keyPattern?.email) {
                    user = await User.findOne({ email });
                    if (user) {
                      return done(null, user);
                    }
                  }
                  if (error.keyPattern?.username) {
                    attempts++;
                    continue;
                  }
                }
                throw error;
              }
            }

            throw new Error("Unable to create unique username");
          } catch (error) {
            console.error("Google OAuth error:", error);
            done(error, null);
          }
        },
      ),
    );

    passport.serializeUser((user, done) => {
      done(null, user._id);
    });

    passport.deserializeUser(async (id, done) => {
      try {
        const user = await User.findById(id);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });

    console.log("Google OAuth configured");
    isConfigured = true;
  }
}

export default passport;
