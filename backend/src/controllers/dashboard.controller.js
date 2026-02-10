import dashboardService from "../services/dashboard.service.js";
import Item from "../models/item.model.js";
import mongoose from "mongoose";
import cache, { TTL, KEYS } from "../utils/cache.js";
import { resolveItemsMedia, resolveUserMedia } from "../utils/media.js";

class DashboardController {
  async getDashboardStats(req, res, next) {
    try {
      const userId = req.user.id;
      const cacheKey = KEYS.userDashboard(userId);

      const stats = await cache.getOrSet(
        cacheKey,
        () => dashboardService.getUserDashboardStats(userId),
        TTL.MEDIUM,
      );

      const resolvedUser = await resolveUserMedia(stats.user);

      res.status(200).json({
        success: true,
        data: { ...stats, user: resolvedUser },
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveItems(req, res, next) {
    try {
      const userId = req.user.id;
      const { type } = req.query;

      const items = await dashboardService.getUserActiveItems(userId, type);

      const resolvedItems = await resolveItemsMedia(items);

      res.status(200).json({
        success: true,
        count: resolvedItems.length,
        data: resolvedItems,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPendingClaims(req, res, next) {
    try {
      const userId = req.user.id;
      const items = await dashboardService.getItemsWithPendingClaims(userId);

      const resolvedItems = await resolveItemsMedia(items);

      res.status(200).json({
        success: true,
        count: resolvedItems.length,
        data: resolvedItems,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTimeBasedStats(req, res, next) {
    try {
      const userId = req.user.id;
      const { days = 30 } = req.query;

      const stats = await dashboardService.getTimeBasedStats(
        userId,
        parseInt(days),
      );

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTopPerformingItems(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 5 } = req.query;

      const topItems = await dashboardService.getTopPerformingItems(
        userId,
        parseInt(limit),
      );

      res.status(200).json({
        success: true,
        data: topItems,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserItems(req, res, next) {
    try {
      const userId = req.user.id;
      const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10,
        type: req.query.type,
        status: req.query.status,
        category: req.query.category,
        sortBy: req.query.sortBy || "createdAt",
        sortOrder: req.query.sortOrder || "desc",
      };

      const result = await dashboardService.getUserItems(userId, options);

      const resolvedItems = await resolveItemsMedia(result.items);

      res.status(200).json({
        success: true,
        ...result,
        items: resolvedItems,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecentActivity(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 10 } = req.query;

      const activity = await dashboardService.getRecentActivity(
        userId,
        parseInt(limit),
      );

      res.status(200).json({
        success: true,
        count: activity.length,
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  }

  async getQuickStats(req, res, next) {
    try {
      const userId = new mongoose.Types.ObjectId(req.user.id);
      const cacheKey = KEYS.userDashboardQuick(userId.toString());

      const data = await cache.getOrSet(
        cacheKey,
        async () => {
          const [totalItems, activeItems, resolvedItems, pendingClaims] =
            await Promise.all([
              Item.countDocuments({ postedBy: userId }),
              Item.countDocuments({ postedBy: userId, status: "active" }),
              Item.countDocuments({ postedBy: userId, status: "resolved" }),
              Item.countDocuments({
                postedBy: userId,
                "claims.status": "pending",
              }),
            ]);

          const totalViews = await Item.aggregate([
            { $match: { postedBy: userId } },
            { $group: { _id: null, total: { $sum: "$views" } } },
          ]);

          return {
            totalItems,
            activeItems,
            resolvedItems,
            pendingClaims,
            totalViews: totalViews.length > 0 ? totalViews[0].total : 0,
          };
        },
        TTL.SHORT,
      );

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DashboardController();
