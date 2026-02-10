import express from "express";
import itemController from "../controllers/item.controller.js";
import { authenticate, optionalAuth } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import { uploadLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = express.Router();

router.get("/", itemController.getAllItems);
router.get("/search-by-location", itemController.searchByLocation);
router.get("/:id", optionalAuth, itemController.getItemById);

router.use(authenticate);

router.get("/user/bookmarks", itemController.getBookmarkedItems);
router.get("/user/my-items", itemController.getMyItems);

router.post(
  "/",
  uploadLimiter,
  upload.array("images", 5),
  itemController.createItem,
);

router.put("/:id", itemController.updateItem);

router.delete("/:id", itemController.deleteItem);

router.patch("/:id/resolve", itemController.resolveItem);

router.get("/:id/claims", itemController.getClaims);
router.post("/:id/claim", itemController.addClaim);
router.patch("/:id/claims/:claimId", itemController.updateClaimStatus);

router.post("/:id/bookmark", itemController.toggleBookmark);

router.post("/:id/report", itemController.reportItem);

export default router;
