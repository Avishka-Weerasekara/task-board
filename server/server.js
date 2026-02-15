require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const taskRoutes = require("./routes/taskRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
const server = http.createServer(app);

/* ==========================
   SOCKET.IO SETUP
========================== */
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

/* ==========================
   MIDDLEWARE
========================== */
app.use(cors());
app.use(express.json());

/* ==========================
   ROUTES
========================== */
app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);

/* ==========================
   SOCKET EVENTS
========================== */
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinBoard", (boardId) => {
    socket.join(boardId);
  });

  socket.on("taskUpdated", ({ boardId }) => {
    io.to(boardId).emit("taskUpdated");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

/* ==========================
   MONGODB CONNECTION
========================== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    server.listen(5000, () => {
      console.log("Server running on port 5000");
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
