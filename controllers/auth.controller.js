import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import createError from "../utils/createError.js";
import FreelancerProfile from "../models/freelancer.model.js";

export const register = async (req, res, next) => {
  try {
    const { username, email, password, role, goalType, teamSize, intent } =
      req.body;

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hash = bcrypt.hashSync(password, 5);
    const imagePath = req.file ? `/uploads/${req.file.filename}` : "";

    const newUser = new User({
      username,
      email,
      password: hash,
      role,
      img: imagePath,
      goalType,
      teamSize,
      intent,
    });

    await newUser.save().catch((err) => {
      console.error("Error saving user:", err);
    });

    const { password: pass, ...info } = newUser._doc;
    return res.status(201).json(info);
  } catch (err) {
    next(err);
  }
};

// LOGIN
export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    if (!user) return next(createError(404, "User not found!"));

    const isCorrect = bcrypt.compareSync(req.body.password, user.password);
    if (!isCorrect) return next(createError(400, "Incorrect password!"));

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: "7d" },
    );

    const { password: hashPassword, ...info } = user._doc;

    res
      .cookie("accessToken", token, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      })
      .status(200)
      .json(info);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res
    .clearCookie("accessToken", {
      sameSite: "none",
      secure: true,
    })
    .status(200)
    .send("User has been logout");
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body;

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "Reset password link sent",
    });
  } catch (err) {
    next(err);
  }
};
