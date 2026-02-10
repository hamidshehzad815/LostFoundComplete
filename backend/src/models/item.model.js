import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const ItemSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    type: {
      type: String,
      required: true,
      enum: {
        values: ["lost", "found"],
        message: "Type must be either 'lost' or 'found'",
      },
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Electronics",
        "Mobile Phones",
        "Laptops & Computers",
        "Tablets",
        "Cameras",
        "Headphones & Audio",
        "Smart Watches",
        "Gaming Devices",
        "Documents",
        "ID Cards",
        "Passports",
        "Licenses",
        "Certificates",
        "Bank Cards",
        "Jewelry",
        "Rings",
        "Necklaces",
        "Bracelets",
        "Earrings",
        "Watches",
        "Pets",
        "Dogs",
        "Cats",
        "Birds",
        "Other Pets",
        "Bags & Luggage",
        "Backpacks",
        "Handbags",
        "Suitcases",
        "Wallets & Purses",
        "Keys & Keychains",
        "Clothing",
        "Jackets",
        "Shoes",
        "Hats & Caps",
        "Scarves",
        "Accessories",
        "Glasses & Sunglasses",
        "Umbrellas",
        "Books & Notebooks",
        "Sports Equipment",
        "Toys & Games",
        "Musical Instruments",
        "Tools",
        "Medical Equipment",
        "Bicycles",
        "Motorcycles",
        "Vehicle Parts",
        "Other",
      ],
    },

    subCategory: {
      type: String,
      trim: true,
    },

    location: {
      address: {
        type: String,
        required: [true, "Location address is required"],
      },
      city: {
        type: String,
        default: "Lahore",
      },
      area: {
        type: String,
        trim: true,
      },
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          default: [74.3587, 31.5204],
        },
      },
    },

    date: {
      type: Date,
      required: [true, "Date is required"],
    },

    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length <= 5;
        },
        message: "Maximum 5 images allowed",
      },
      default: [],
    },

    reward: {
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
      currency: {
        type: String,
        default: "PKR",
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "resolved", "expired", "archived"],
      default: "active",
    },

    resolvedAt: {
      type: Date,
    },
    resolvedWith: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    views: {
      type: Number,
      default: 0,
    },
    viewedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    bookmarks: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    claims: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        message: String,
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    ownershipProof: {
      type: String,
      select: false,
    },

    contactPreferences: {
      allowMessages: {
        type: Boolean,
        default: true,
      },
      showPhone: {
        type: Boolean,
        default: false,
      },
      phone: {
        type: String,
        select: false,
      },
    },

    expiresAt: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      },
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    reports: [
      {
        reportedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        reason: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

ItemSchema.index({ postedBy: 1, status: 1 });
ItemSchema.index({ type: 1, category: 1 });
ItemSchema.index({ "location.coordinates": "2dsphere" });
ItemSchema.index({ tags: 1 });
ItemSchema.index({ createdAt: -1 });
ItemSchema.index({ status: 1, expiresAt: 1 });

ItemSchema.index({
  title: "text",
  description: "text",
  tags: "text",
});

ItemSchema.virtual("age").get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

ItemSchema.methods.incrementViews = function (userId) {
  if (userId && !this.viewedBy.includes(userId)) {
    this.views += 1;
    this.viewedBy.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

ItemSchema.methods.addClaim = function (userId, message) {
  this.claims.push({
    user: userId,
    message,
    status: "pending",
  });
  return this.save();
};

ItemSchema.methods.markResolved = function (userId) {
  this.status = "resolved";
  this.resolvedAt = new Date();
  this.resolvedWith = userId;
  return this.save();
};

ItemSchema.statics.findActiveItems = function (type) {
  return this.find({ type, status: "active" }).sort({ createdAt: -1 });
};

ItemSchema.statics.findByLocation = function (coordinates, maxDistance = 5000) {
  return this.find({
    "location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: coordinates,
        },
        $maxDistance: maxDistance,
      },
    },
    status: "active",
  });
};

ItemSchema.statics.getUserStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { postedBy: userId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalViews: { $sum: "$views" },
        totalReward: { $sum: "$reward.amount" },
      },
    },
  ]);
  return stats;
};

const Item = model("Item", ItemSchema);

export default Item;
