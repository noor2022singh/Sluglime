const express = require("express");
const router = express.Router();
const communityController = require("../controllers/communityController");
const { uploadCommunity } = require("../config/cloudinary");

router.post(
  "/",
  uploadCommunity.fields([
    { name: "avatar", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  communityController.createCommunity
);

router.get("/", communityController.getAllCommunities);

router.get("/trending", communityController.getTrendingCommunities);

router.get("/:id", communityController.getCommunityById);

router.get("/:id/posts", communityController.getCommunityPosts);

router.post("/:id/join", communityController.joinCommunity);

router.post("/:id/leave", communityController.leaveCommunity);

router.get("/user/:userId", communityController.getUserCommunities);

router.put(
  "/:id",
  uploadCommunity.fields([
    { name: "avatar", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  communityController.updateCommunity
);

router.delete("/:id", communityController.deleteCommunity);

router.get("/:communityId/requests", communityController.getPendingRequests);
router.post(
  "/requests/:requestId/approve",
  communityController.approveJoinRequest
);
router.post(
  "/requests/:requestId/reject",
  communityController.rejectJoinRequest
);

router.get("/:id/categories", communityController.getCategories);
router.post("/:id/categories", communityController.addCategory);
router.put("/:id/categories/:categoryName", communityController.updateCategory);
router.delete(
  "/:id/categories/:categoryName",
  communityController.deleteCategory
);

router.get("/global-tags", communityController.getGlobalTags);
router.post("/global-tags", communityController.addGlobalTag);
router.delete("/global-tags", communityController.removeGlobalTag);

module.exports = router;
