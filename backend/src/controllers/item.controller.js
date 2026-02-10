import Item from "../models/item.model.js";
import User from "../models/user.model.js";
import cache, { TTL, KEYS } from "../utils/cache.js";
import { isR2Configured, uploadToR2, saveToLocal } from "../config/r2.js";

class ItemController {
  async createItem(req, res, next) {
    try {
      const userId = req.user.id;
      const itemData = {
        ...req.body,
        postedBy: userId,
      };

      if (req.body.location && req.body.location.coordinates) {
        const coords = req.body.location.coordinates;
        if (typeof coords === "string") {
          const [lng, lat] = coords.split(",").map((c) => parseFloat(c.trim()));
          if (!isNaN(lng) && !isNaN(lat)) {
            itemData.location.coordinates = {
              type: "Point",
              coordinates: [lng, lat],
            };
          }
        }
      }

      if (req.files && req.files.length > 0) {
        if (isR2Configured) {
          const uploaded = await Promise.all(
            req.files.map(async (file) => {
              try {
                return await uploadToR2({ folder: "items", file });
              } catch (error) {
                console.warn("R2 upload failed, falling back to local disk:", error.message);
                return saveToLocal({ folder: "items", file });
              }
            }),
          );
          itemData.images = uploaded;
        } else {
          itemData.images = req.files.map(
            (file) => `/uploads/items/${file.filename}`,
          );
        }
      }

      const item = await Item.create(itemData);

      await User.findByIdAndUpdate(userId, {
        $push: { posts: item._id },
      });

      await Promise.all([
        cache.invalidatePattern("items:list:*"),
        cache.invalidatePattern(`user:${userId}:*`),
        cache.invalidatePattern(`dashboard:${userId}:*`),
      ]);

      res.status(201).json({
        success: true,
        message: `${item.type === "lost" ? "Lost" : "Found"} item posted successfully`,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllItems(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        category,
        status = "active",
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const query = {};
      if (type) query.type = type;
      if (category) query.category = category;
      if (status) query.status = status;

      if (search) {
        query.$text = { $search: search };
      }

      const sort = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      const skip = (page - 1) * limit;

      const cacheKey = KEYS.itemsList(page, limit, type, category, status);
      const result = await cache.getOrSet(
        cacheKey,
        async () => {
          const [items, total] = await Promise.all([
            Item.find(query)
              .sort(sort)
              .skip(skip)
              .limit(parseInt(limit))
              .populate("postedBy", "username profilePicture trustScore")
              .select("-ownershipProof -contactPreferences.phone"),
            Item.countDocuments(query),
          ]);
          return { items, total };
        },
        TTL.MEDIUM,
      );

      res.status(200).json({
        success: true,
        count: result.items.length,
        total: result.total,
        page: parseInt(page),
        pages: Math.ceil(result.total / limit),
        data: result.items,
      });
    } catch (error) {
      next(error);
    }
  }

  async getItemById(req, res, next) {
    try {
      const { id } = req.params;
      const cacheKey = KEYS.item(id);

      const item = await cache.getOrSet(
        cacheKey,
        async () => {
          return Item.findById(id)
            .populate(
              "postedBy",
              "username email profilePicture trustScore badges",
            )
            .populate("claims.user", "username profilePicture trustScore");
        },
        TTL.LONG,
      );

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Item not found",
        });
      }

      if (
        req.user &&
        item.postedBy &&
        item.postedBy._id.toString() !== req.user.id.toString()
      ) {
        const freshItem = await Item.findById(id);
        if (freshItem) await freshItem.incrementViews(req.user.id);
      }

      res.status(200).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const item = await Item.findById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Item not found",
        });
      }

      if (item.postedBy.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this item",
        });
      }

      const allowedUpdates = [
        "title",
        "description",
        "category",
        "subCategory",
        "location",
        "date",
        "reward",
        "tags",
        "status",
        "contactPreferences",
      ];

      Object.keys(req.body).forEach((key) => {
        if (allowedUpdates.includes(key)) {
          item[key] = req.body[key];
        }
      });

      await item.save();

      await Promise.all([
        cache.del(KEYS.item(id)),
        cache.invalidatePattern("items:list:*"),
        cache.invalidatePattern(`dashboard:${userId}:*`),
      ]);

      res.status(200).json({
        success: true,
        message: "Item updated successfully",
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteItem(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const item = await Item.findById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Item not found",
        });
      }

      if (item.postedBy.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to delete this item",
        });
      }

      await Item.findByIdAndDelete(id);

      await User.findByIdAndUpdate(userId, {
        $pull: { posts: id },
      });

      await Promise.all([
        cache.del(KEYS.item(id)),
        cache.invalidatePattern("items:list:*"),
        cache.invalidatePattern(`user:${userId}:*`),
        cache.invalidatePattern(`dashboard:${userId}:*`),
      ]);

      res.status(200).json({
        success: true,
        message: "Item deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async resolveItem(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const resolvedWithUserId = req.body?.resolvedWithUserId;

      const item = await Item.findById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Item not found",
        });
      }

      if (item.postedBy.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to resolve this item",
        });
      }

      item.status = "resolved";
      item.resolvedAt = new Date();
      if (resolvedWithUserId) {
        item.resolvedWith = resolvedWithUserId;
      }

      await item.save();

      const owner = await User.findById(userId);
      if (owner) {
        owner.recoveryCount = (owner.recoveryCount || 0) + 1;
        owner.calculateTrustScore();
        await owner.save();
      }

      if (resolvedWithUserId) {
        const helper = await User.findById(resolvedWithUserId);
        if (helper) {
          helper.recoveryCount = (helper.recoveryCount || 0) + 1;
          helper.calculateTrustScore();
          await helper.save();
          cache.invalidatePattern(`dashboard:${resolvedWithUserId}:*`);
        }
      }

      await Promise.all([
        cache.del(KEYS.item(id)),
        cache.invalidatePattern("items:list:*"),
        cache.invalidatePattern(`dashboard:${userId}:*`),
        cache.del(KEYS.userProfile(userId)),
      ]);

      res.status(200).json({
        success: true,
        message: "Item marked as resolved successfully",
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyItems(req, res, next) {
    try {
      const userId = req.user.id;

      const items = await Item.find({ postedBy: userId })
        .populate("postedBy", "username email profilePicture trustScore")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  async addClaim(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { message } = req.body;

      const item = await Item.findById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Item not found",
        });
      }

      if (item.postedBy.toString() === userId.toString()) {
        return res.status(400).json({
          success: false,
          message: "You cannot claim your own item",
        });
      }

      const existingClaim = item.claims.find(
        (claim) => claim.user.toString() === userId.toString(),
      );

      if (existingClaim) {
        return res.status(400).json({
          success: false,
          message: "You have already claimed this item",
        });
      }

      await item.addClaim(userId, message);

      res.status(200).json({
        success: true,
        message: "Claim submitted successfully",
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async getClaims(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const item = await Item.findById(id)
        .populate("claims.user", "username email profilePicture trustScore")
        .populate("postedBy", "username");

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Item not found",
        });
      }

      if (item.postedBy._id.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view claims for this item",
        });
      }

      res.status(200).json({
        success: true,
        data: item.claims,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateClaimStatus(req, res, next) {
    try {
      const { id, claimId } = req.params;
      const userId = req.user.id;
      const { status } = req.body;

      const item = await Item.findById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Item not found",
        });
      }

      if (item.postedBy.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update claims",
        });
      }

      const claim = item.claims.id(claimId);
      if (!claim) {
        return res.status(404).json({
          success: false,
          message: "Claim not found",
        });
      }

      claim.status = status;

      if (status === "accepted") {
        await item.markResolved(claim.user);

        const owner = await User.findById(userId);
        if (owner) {
          owner.recoveryCount = (owner.recoveryCount || 0) + 1;
          owner.calculateTrustScore();
          await owner.save();
        }

        const claimer = await User.findById(claim.user);
        if (claimer) {
          claimer.recoveryCount = (claimer.recoveryCount || 0) + 1;
          claimer.calculateTrustScore();
          await claimer.save();
        }
      }

      await item.save();

      await Promise.all([
        cache.del(KEYS.item(id)),
        cache.invalidatePattern(`dashboard:${userId}:*`),
      ]);

      res.status(200).json({
        success: true,
        message: `Claim ${status} successfully`,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleBookmark(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const item = await Item.findById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Item not found",
        });
      }

      const bookmarkIndex = item.bookmarks.indexOf(userId);

      if (bookmarkIndex > -1) {
        item.bookmarks.splice(bookmarkIndex, 1);
      } else {
        item.bookmarks.push(userId);
      }

      await item.save();

      res.status(200).json({
        success: true,
        message:
          bookmarkIndex > -1
            ? "Bookmark removed successfully"
            : "Item bookmarked successfully",
        data: { bookmarked: bookmarkIndex === -1 },
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookmarkedItems(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, type, status = "active" } = req.query;

      const query = {
        bookmarks: userId,
      };

      if (type) query.type = type;
      if (status) query.status = status;

      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        Item.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate("postedBy", "username profilePicture trustScore")
          .select("-ownershipProof -contactPreferences.phone"),
        Item.countDocuments(query),
      ]);

      res.status(200).json({
        success: true,
        count: items.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  async reportItem(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { reason } = req.body;

      const item = await Item.findById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Item not found",
        });
      }

      const existingReport = item.reports.find(
        (report) => report.reportedBy.toString() === userId.toString(),
      );

      if (existingReport) {
        return res.status(400).json({
          success: false,
          message: "You have already reported this item",
        });
      }

      item.reports.push({
        reportedBy: userId,
        reason,
      });

      await item.save();

      res.status(200).json({
        success: true,
        message: "Item reported successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async searchByLocation(req, res, next) {
    try {
      const {
        longitude,
        latitude,
        maxDistance = 5000,
        type,
        category,
      } = req.query;

      if (!longitude || !latitude) {
        return res.status(400).json({
          success: false,
          message: "Longitude and latitude are required",
        });
      }

      const query = {
        "location.coordinates": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            $maxDistance: parseInt(maxDistance),
          },
        },
        status: "active",
      };

      if (type) query.type = type;
      if (category) query.category = category;

      const items = await Item.find(query)
        .populate("postedBy", "username profilePicture trustScore")
        .limit(50);

      res.status(200).json({
        success: true,
        count: items.length,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ItemController();
