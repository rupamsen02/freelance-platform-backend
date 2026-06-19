import express from "express";
import {
  createFreelancerProfile,
  deleteFreelancerProfile,
  deleteProfileImage,
  getFreelancerProfile,
  updateFreelancerProfile,
} from "../controllers/freelancer.controller.js";
import { verifyToken } from "../middleware/jwt.js";
import multer from "multer";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.post(
  "/",
  verifyToken,
  upload.single("profileImage"),
  createFreelancerProfile,
);
router.get("/:id", getFreelancerProfile);
router.delete("/:id/image", verifyToken, deleteProfileImage);
router.put(
  "/:id",
  verifyToken,
  upload.single("profileImage"),
  updateFreelancerProfile,
);

router.delete("/:id", verifyToken, deleteFreelancerProfile);

export default router;
