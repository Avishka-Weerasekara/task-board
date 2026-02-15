const mongoose = require("mongoose");

/* ==========================
   Task Schema
========================== */
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      default: ""
    },

    boardId: {
      type: String,
      required: true
    },

    listName: {
      type: String,
      enum: ["To Do", "Doing", "Done"],
      default: "To Do"
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Task", taskSchema);
