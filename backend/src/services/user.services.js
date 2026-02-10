import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendWelcomeEmail, sendVerificationEmail } from "./email.service.js";
import { AppError } from "../middlewares/error.middleware.js";
import cache, { TTL, KEYS } from "../utils/cache.js";

const userLogin = async (credentials) => {
  const user = await User.findOne({ email: credentials.email }).select(
    "+password",
  );

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  if (!(await user.comparePassword(credentials.password))) {
    user.failedLoginAttempts += 1;
    await user.save();
    if (user.failedLoginAttempts >= 5) {
      throw new AppError(
        "Account locked due to multiple failed login attempts",
        403,
      );
    }
    throw new AppError("Invalid credentials", 401);
  }

  if (!user.isVerified) {
    throw new AppError(
      "Please verify your email before logging in. Check your inbox for the verification link.",
      403,
    );
  }

  user.failedLoginAttempts = 0;
  user.lastLogin = Date.now();
  await user.save();

  const token = user.createJWT();
  return { token, user };
};

const userSignup = async (registrationData) => {
  const { username, email, password } = registrationData;

  if (!username || !email || !password) {
    throw new AppError("Username, email, and password are required", 400);
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new AppError("Email already registered", 409);
    }
    if (existingUser.username === username) {
      throw new AppError("Username already taken", 409);
    }
  }

  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters long", 400);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpire = Date.now() + 3600000;

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    verificationToken,
    verificationTokenExpire,
  });

  sendVerificationEmail(email, username, verificationToken).catch((err) =>
    console.error("Failed to send verification email:", err.message),
  );

  const token = user.createJWT();

  const userResponse = {
    id: user._id,
    username: user.username,
    email: user.email,
    isVerified: user.isVerified,
    role: user.role,
    createdAt: user.createdAt,
  };

  return { token, user: userResponse };
};

const getUserProfile = async (userId) => {
  const cacheKey = KEYS.userProfile(userId);

  const user = await cache.getOrSet(
    cacheKey,
    async () => {
      return User.findById(userId).select(
        "-password -refreshToken -resetPasswordToken -verificationToken",
      );
    },
    TTL.LONG,
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

const updateUserProfile = async (userId, updateData) => {
  const { username, profilePicture, preferredLanguage, location } = updateData;

  if (username) {
    const existingUser = await User.findOne({
      _id: { $ne: userId },
      username,
    });

    if (existingUser) {
      throw new AppError("Username already taken", 409);
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      ...(username && { username }),
      ...(profilePicture !== undefined && { profilePicture }),
      ...(preferredLanguage && { preferredLanguage }),
      ...(location && { location }),
      updatedAt: Date.now(),
    },
    { new: true, runValidators: true },
  ).select("-password -refreshToken -resetPasswordToken -verificationToken");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (profilePicture !== undefined || location) {
    user.calculateTrustScore();
    await user.save();
  }

  await cache.del(KEYS.userProfile(userId));

  return user;
};

const deactivateAccount = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      isActive: false,
      updatedAt: Date.now(),
    },
    { new: true },
  ).select("-password -refreshToken -resetPasswordToken -verificationToken");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

const verifyEmail = async (token) => {
  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError("Invalid or expired verification token", 400);
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpire = undefined;
  user.calculateTrustScore();
  await user.save();

  sendWelcomeEmail(user.email, user.username).catch((err) =>
    console.error("Failed to send welcome email:", err),
  );

  return user;
};

export {
  userLogin,
  userSignup,
  getUserProfile,
  updateUserProfile,
  deactivateAccount,
  verifyEmail,
};
