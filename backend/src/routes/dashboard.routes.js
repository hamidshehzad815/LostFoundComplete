import express from "express";
import dashboardController from "../controllers/dashboard.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/stats", dashboardController.getDashboardStats);

router.get("/quick-stats", dashboardController.getQuickStats);

router.get("/active-items", dashboardController.getActiveItems);

router.get("/pending-claims", dashboardController.getPendingClaims);

router.get("/time-stats", dashboardController.getTimeBasedStats);

router.get("/top-items", dashboardController.getTopPerformingItems);

router.get("/items", dashboardController.getUserItems);

router.get("/recent-activity", dashboardController.getRecentActivity);

export default router;
