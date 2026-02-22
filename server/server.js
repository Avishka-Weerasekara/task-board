require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const taskRoutes = require("./routes/taskRoutes");
const authRoutes = require("./routes/authRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");

const app = express();
const server = http.createServer(app);

/* ==========================
   SOCKET.IO SETUP
========================== */
const io = new Server(server, {
  cors: {
    origin: "*", // Allows any device on your local network to connect
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
app.use("/api/workspaces", workspaceRoutes);

/* ==========================
   SOCKET EVENTS
========================== */
const boardUsers = {}; // Maps boardId to array of { socketId, username }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinBoard", ({ boardId, username }) => {
    socket.join(boardId);

    if (!boardUsers[boardId]) {
      boardUsers[boardId] = [];
    }

    // Prevent duplicates for the same socket
    boardUsers[boardId] = boardUsers[boardId].filter(u => u.socketId !== socket.id);
    boardUsers[boardId].push({ socketId: socket.id, username });

    // Broadcast the updated user list to everyone in the room
    io.to(boardId).emit("usersInBoard", boardUsers[boardId]);
  });

  socket.on("leaveBoard", ({ boardId }) => {
    socket.leave(boardId);
    if (boardUsers[boardId]) {
      boardUsers[boardId] = boardUsers[boardId].filter(u => u.socketId !== socket.id);
      io.to(boardId).emit("usersInBoard", boardUsers[boardId]);
    }
  });

  socket.on("taskUpdated", ({ boardId }) => {
    socket.to(boardId).emit("taskUpdated");
  });

  // Advanced features
  socket.on("typing", ({ boardId, username, isTyping }) => {
    socket.to(boardId).emit("userTyping", { username, isTyping });
  });

  socket.on("cursorMove", ({ boardId, username, x, y }) => {
    // We send back a normalized x,y (percentages if possible, or just raw window coords)
    // For simplicity, we just broadcast raw coordinates
    socket.to(boardId).emit("userCursorMove", { socketId: socket.id, username, x, y });
  });

  socket.on("deleteRoom", ({ boardId }) => {
    io.to(boardId).emit("roomDeleted");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // Remove user from all tracked boards
    for (const boardId in boardUsers) {
      const initialLength = boardUsers[boardId].length;
      boardUsers[boardId] = boardUsers[boardId].filter(u => u.socketId !== socket.id);
      if (initialLength !== boardUsers[boardId].length) {
        io.to(boardId).emit("usersInBoard", boardUsers[boardId]);
        // Clean up empty rooms
        if (boardUsers[boardId].length === 0) {
          delete boardUsers[boardId];
        }
      }
    }
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
