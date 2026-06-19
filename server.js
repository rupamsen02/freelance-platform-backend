import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import userRoute from "./routes/user.route.js";
import gigRoute from "./routes/gig.route.js";
import freelancerRoute from "./routes/freelancer.route.js";
import orderRoute from "./routes/order.route.js";
import messageRoute from "./routes/message.route.js";
import reviewRoute from "./routes/review.route.js";
import authRoute from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";
import Message from "./models/message.model.js";
import paymentRoute from "./routes/payment.route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.url);
  next();
});
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", process.env.FRONTEND_URL],
    credentials: true,
  },
});

mongoose.set("strictQuery", true);
const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB is running!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["http://localhost:3000", process.env.FRONTEND_URL],
    credentials: true,
  }),
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.get("/", (req, res) => {
  res.send("Freelance Platform API is Running");
});
app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/gig", gigRoute);
app.use("/api/freelancer", freelancerRoute);
app.use("/api/messages", messageRoute);
app.use("/api/review", reviewRoute);
app.use("/api/orders", orderRoute);
app.use("/api/payment", paymentRoute);

// Error handler
app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong!";
  console.error("Unhandled error:", err.stack || err);
  return res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// Socket.io logic
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("join", (userId) => {
    socket.join(userId); // join personal room
    console.log(`User ${userId} joined their room`);
  });

  socket.on("sendMessage", async (message) => {
    try {
      const msg = await Message.findById(message._id);
      if (!msg) return;

      const payload = {
        ...msg.toObject(),
        seen: false,
      };

      io.to(msg.to.toString()).emit("receiveMessage", payload);
      io.to(msg.from.toString()).emit("receiveMessage", payload);
    } catch (err) {
      console.error("Socket sendMessage error:", err);
    }
  });

  socket.on("messageSeen", async ({ messageId, from, to }) => {
    try {
      const updated = await Message.findByIdAndUpdate(
        messageId,
        { seen: true },
        { new: true },
      );

      if (updated) {
        io.to(from).emit("messageSeenUpdate", { messageId: updated._id });
      }
    } catch (err) {
      console.error("messageSeen update error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Server listen
const PORT = process.env.PORT || 8800;
server.listen(PORT, () => {
  connect();
  console.log(`Server running on port ${PORT}`);
});
