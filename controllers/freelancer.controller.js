import FreelancerProfile from "../models/freelancer.model.js";
import createError from "../utils/createError.js";
import mongoose from "mongoose";

export const createFreelancerProfile = async (req, res, next) => {
  try {
    const exists = await FreelancerProfile.findOne({
      userId: req.user.id,
    });

    if (exists) return next(createError(400, "Profile already exists"));

    const profileImageValue = req.file ? req.file.filename : "";

    const profile = new FreelancerProfile({
      userId: req.user.id,
      fullName: req.body.fullName,
      displayName: req.body.displayName,
      serviceOffered: req.body.serviceOffered,
      bio: req.body.bio,
      country: req.body.country,
      memberSince: req.body.memberSince,
      languages: req.body.languages,
      shortDescription: req.body.shortDescription,
      profileImage: profileImageValue,
    });

    const saved = await profile.save();

    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
};

export const getFreelancerProfile = async (req, res, next) => {
  try {
    const profile = await FreelancerProfile.findOne({ userId: req.params.id });

    if (!profile) {
      return next(createError(404, "Freelancer profile not found"));
    }
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
};

export const updateFreelancerProfile = async (req, res, next) => {
  try {
    const updateData = {
      fullName: req.body.fullName,
      displayName: req.body.displayName,
      serviceOffered: req.body.serviceOffered,
      shortDescription: req.body.shortDescription,
      country: req.body.country,
      customCountry: req.body.customCountry,
      memberSince: req.body.memberSince,
      languages: req.body.languages,
    };
    if (req.file) {
      updateData.profileImage = req.file.filename;
      console.log("Setting profileImage to:", req.file.filename);
    }
    // Handle image deletion - when user clicks "Delete picture" button
    if (req.body.deleteImage === "true") {
      updateData.profileImage = null;
    }
    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );
    console.log("Update Data:", updateData);
    console.log("Req File:", req.file);
    console.log("Req Body:", req.body);
    const updated = await FreelancerProfile.findOneAndUpdate(
      { userId: req.params.id },
      { $set: updateData },
      { new: true },
    );
    // Log what was returned
    console.log("Updated profile from DB:", updated);
    console.log("ProfileImage in DB:", updated?.profileImage);

    if (!updated) {
      return next(createError(404, "Freelancer profile not found"));
    }

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

// delete image only 
export const deleteProfileImage = async (req, res, next) => {
  try {
    console.log("deleteProfileImage called for userId:", req.params.id)
    const updated = await FreelancerProfile.findOneAndUpdate(
      { userId: req.params.id },
      { $set: { profileImage: "" } }, 
      { new: true }
    );

    console.log("Updated profile:", updated)

    if (!updated) {
      return next(createError(404, "Freelancer profile not found"));
    }

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteFreelancerProfile = async (req, res, next) => {
  try {
    const deleted = await FreelancerProfile.findOneAndDelete({
      userId: req.params.id,
    });

    if (!deleted) {
      return next(createError(404, "Profile not found"));
    }

    res.status(200).json("Profile deleted successfully");
  } catch (err) {
    next(err);
  }
};
