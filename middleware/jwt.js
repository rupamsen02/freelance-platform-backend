import jwt from "jsonwebtoken";
import createError from "../utils/createError.js";
import dotenv from "dotenv";
dotenv.config();

export const verifyToken = (req, res, next) => {
  console.log("Authorization:", req.headers.authorization);
  console.log("Cookie token:", req.cookies?.accessToken);
  console.log("All cookies:", req.cookies);
  let token = req.cookies.accessToken;

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return next(createError(401, "You are not authenticated!"));

  jwt.verify(token, process.env.JWT_KEY, (err, payload) => {
    if (err) return next(createError(403, "Token is not valid!"));
    req.user = {
      id: payload.id,
      role: payload.role,
    };
    next();
  });
  console.log("Authorization:", req.headers.authorization);
  console.log("Cookie token:", req.cookies.accessToken);
};
