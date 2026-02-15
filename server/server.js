const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// ===== MongoDB Connection =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ===== Root Route (Fixes Cannot GET /) =====
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// ===== Routes =====
const taskRoutes = require("./routes/taskRoutes");
app.use("/api/tasks", taskRoutes);

// ===== Socket.io =====
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinBoard", (boardId) => {
    socket.join(boardId);
  });

  socket.on("taskUpdated", (data) => {
    io.to(data.boardId).emit("taskUpdated");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// ===== Start Server =====
server.listen(process.env.PORT, () => {
  console.log("Server running on port", process.env.PORT);
});
