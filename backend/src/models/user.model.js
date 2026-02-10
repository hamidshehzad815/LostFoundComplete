import { Schema as _Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
const Schema = _Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 30,
    trim: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email"],
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  profilePicture: { type: String, default: "" },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] },
  },
  watchAreas: [{ type: String }],
  preferredLanguage: { type: String, enum: ["en", "ur"], default: "en" },
  recoveryCount: { type: Number, default: 0 },
  trustScore: { type: Number, default: 0, min: 0, max: 100 },
  badges: [{ type: String }],
  posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],

  lastLogin: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  refreshToken: { type: String },

  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpire: { type: Date },

  role: { type: String, enum: ["user", "admin"], default: "user" },
  failedLoginAttempts: { type: Number, default: 0, min: 0 },

  passwordChangedAt: { type: Date },
  isActive: { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes
UserSchema.index({ location: "2dsphere" });

UserSchema.pre("save", function (next) {
  if (this.isModified("password")) {
    this.passwordChangedAt = Date.now() - 1000;
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.createJWT = function () {
  return jwt.sign(
    { id: this._id, role: this.role, username: this.username },
    process.env.SECRET_KEY,
    {
      expiresIn: "7d",
    },
  );
};

UserSchema.methods.generateVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.verificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.verificationTokenExpire = Date.now() + 3600000;
  return token;
};

UserSchema.methods.calculateTrustScore = function () {
  let score = 0;

  if (this.isVerified) score += 20;

  const accountAgeDays =
    (Date.now() - new Date(this.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  score += Math.min(20, Math.floor((accountAgeDays / 365) * 20));

  score += Math.min(30, this.recoveryCount * 2);

  if (this.profilePicture) score += 5;
  if (
    this.location &&
    this.location.coordinates &&
    this.location.coordinates[0] !== 0
  )
    score += 5;

  const postCount = this.posts ? this.posts.length : 0;
  score += Math.min(10, postCount);

  const badgeCount = this.badges ? this.badges.length : 0;
  score += Math.min(10, badgeCount * 2);

  this.trustScore = Math.min(100, score);
  return this.trustScore;
};

const User = model("User", UserSchema);

export default User;
