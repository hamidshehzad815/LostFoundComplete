import Item from "../models/item.model.js";
import User from "../models/user.model.js";

class DashboardService {
  async getUserDashboardStats(userId) {
    try {
      const user = await User.findById(userId).select(
        "username email profilePicture recoveryCount trustScore badges",
      );

      if (!user) {
        throw new Error("User not found");
      }

      const userItems = await Item.find({ postedBy: userId });

      const stats = {
        user: {
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture,
          recoveryCount: user.recoveryCount,
          trustScore: user.trustScore,
          badges: user.badges,
        },
        overview: {
          totalPosts: userItems.length,
          activePosts: userItems.filter((item) => item.status === "active")
            .length,
          resolvedPosts: userItems.filter((item) => item.status === "resolved")
            .length,
          lostItems: userItems.filter((item) => item.type === "lost").length,
          foundItems: userItems.filter((item) => item.type === "found").length,
          totalViews: userItems.reduce((sum, item) => sum + item.views, 0),
          totalRewards: userItems.reduce(
            (sum, item) => sum + item.reward.amount,
            0,
          ),
          totalBookmarks: userItems.reduce(
            (sum, item) => sum + item.bookmarks.length,
            0,
          ),
          totalClaims: userItems.reduce(
            (sum, item) => sum + item.claims.length,
            0,
          ),
        },
        statusBreakdown: {
          active: userItems.filter((item) => item.status === "active").length,
          resolved: userItems.filter((item) => item.status === "resolved")
            .length,
          expired: userItems.filter((item) => item.status === "expired").length,
          archived: userItems.filter((item) => item.status === "archived")
            .length,
        },
        categoryBreakdown: this.getCategoryBreakdown(userItems),
        recentActivity: await this.getRecentActivity(userId),
        successRate: this.calculateSuccessRate(userItems),
        averageResolutionTime: this.calculateAverageResolutionTime(userItems),
      };

      return stats;
    } catch (error) {
      throw error;
    }
  }

  getCategoryBreakdown(items) {
    const breakdown = {};
    items.forEach((item) => {
      if (breakdown[item.category]) {
        breakdown[item.category]++;
      } else {
        breakdown[item.category] = 1;
      }
    });
    return breakdown;
  }

  async getRecentActivity(userId, limit = 10) {
    try {
      const recentItems = await Item.find({ postedBy: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("title type status category createdAt views claims");

      return recentItems.map((item) => ({
        id: item._id,
        title: item.title,
        type: item.type,
        status: item.status,
        category: item.category,
        date: item.createdAt,
        views: item.views,
        claimsCount: item.claims.length,
      }));
    } catch (error) {
      throw error;
    }
  }

  calculateSuccessRate(items) {
    if (items.length === 0) return 0;
    const resolved = items.filter((item) => item.status === "resolved").length;
    return Math.round((resolved / items.length) * 100);
  }

  calculateAverageResolutionTime(items) {
    const resolvedItems = items.filter(
      (item) => item.status === "resolved" && item.resolvedAt,
    );
    if (resolvedItems.length === 0) return 0;

    const totalDays = resolvedItems.reduce((sum, item) => {
      const days = Math.floor(
        (item.resolvedAt - item.createdAt) / (1000 * 60 * 60 * 24),
      );
      return sum + days;
    }, 0);

    return Math.round(totalDays / resolvedItems.length);
  }

  async getUserActiveItems(userId, type = null) {
    try {
      const query = { postedBy: userId, status: "active" };
      if (type) {
        query.type = type;
      }

      const items = await Item.find(query)
        .sort({ createdAt: -1 })
        .populate("claims.user", "username profilePicture")
        .select("-ownershipProof -contactPreferences.phone");

      return items;
    } catch (error) {
      throw error;
    }
  }

  async getItemsWithPendingClaims(userId) {
    try {
      const items = await Item.find({
        postedBy: userId,
        "claims.status": "pending",
      })
        .populate("claims.user", "username profilePicture email")
        .sort({ "claims.createdAt": -1 });

      return items.map((item) => ({
        itemId: item._id,
        title: item.title,
        type: item.type,
        category: item.category,
        pendingClaims: item.claims.filter(
          (claim) => claim.status === "pending",
        ),
      }));
    } catch (error) {
      throw error;
    }
  }

  async getTimeBasedStats(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const items = await Item.find({
        postedBy: userId,
        createdAt: { $gte: startDate },
      }).sort({ createdAt: 1 });

      const dailyStats = {};
      items.forEach((item) => {
        const date = item.createdAt.toISOString().split("T")[0];
        if (!dailyStats[date]) {
          dailyStats[date] = {
            lost: 0,
            found: 0,
            resolved: 0,
            views: 0,
          };
        }
        if (item.type === "lost") dailyStats[date].lost++;
        if (item.type === "found") dailyStats[date].found++;
        if (item.status === "resolved") dailyStats[date].resolved++;
        dailyStats[date].views += item.views;
      });

      return dailyStats;
    } catch (error) {
      throw error;
    }
  }

  async getTopPerformingItems(userId, limit = 5) {
    try {
      const topByViews = await Item.find({ postedBy: userId })
        .sort({ views: -1 })
        .limit(limit)
        .select("title type views category createdAt");

      const topByClaims = await Item.find({ postedBy: userId })
        .sort({ "claims.length": -1 })
        .limit(limit)
        .select("title type claims category createdAt");

      return {
        mostViewed: topByViews,
        mostClaimed: topByClaims,
      };
    } catch (error) {
      throw error;
    }
  }

  async getUserItems(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        type = null,
        status = null,
        category = null,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      const query = { postedBy: userId };
      if (type) query.type = type;
      if (status) query.status = status;
      if (category) query.category = category;

      const sort = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        Item.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate("claims.user", "username profilePicture")
          .select("-ownershipProof"),
        Item.countDocuments(query),
      ]);

      return {
        items,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new DashboardService();
