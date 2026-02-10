import {
  userLogin,
  userSignup,
  getUserProfile,
  updateUserProfile,
  deactivateAccount,
  verifyEmail,
} from "../services/user.services.js";
import { asyncHandler, AppError } from "../middlewares/error.middleware.js";

const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Please provide email and password", 400);
  }

  const { token, user } = await userLogin({ email, password });

  res.status(200).json({
    success: true,
    token,
    user: { id: user._id, username: user.username, role: user.role },
  });
});

const signup = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new AppError("Please provide username, email and password", 400);
  }

  const { token, user } = await userSignup({ username, email, password });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    token,
    user,
  });
});

const profile = asyncHandler(async (req, res, next) => {
  const user = await getUserProfile(req.user.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({
    success: true,
    user,
  });
});

const updateProfile = asyncHandler(async (req, res, next) => {
  const user = await updateUserProfile(req.user.id, req.body);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user,
  });
});

const deactivate = asyncHandler(async (req, res, next) => {
  const user = await deactivateAccount(req.user.id);

  res.status(200).json({
    success: true,
    message: "Account deactivated successfully",
    user,
  });
});

const verify = asyncHandler(async (req, res, next) => {
  const { token } = req.query;

  if (!token) {
    throw new AppError("Verification token is required", 400);
  }

  const user = await verifyEmail(token);

  res.status(200).json({
    success: true,
    message: "Email verified successfully! You can now login.",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      isVerified: user.isVerified,
    },
  });
});

const getUserById = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const user = await getUserProfile(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      trustScore: user.trustScore,
    },
  });
});

export {
  login,
  signup,
  profile,
  updateProfile,
  deactivate,
  verify,
  getUserById,
};
