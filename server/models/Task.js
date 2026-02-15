const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    boardId: String,
    listName: {
      type: String,
      enum: ["To Do", "Doing", "Done"],
      default: "To Do",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
