const express = require("express");
const router = express.Router();
const PersonalTask = require("../models/PersonalTask");
const RoomTask = require("../models/RoomTask");
const authMiddleware = require("../middleware/authMiddleware");

// Helper to determine which collection to use
const getModel = (boardId) => {
  return boardId && boardId.startsWith("room") ? RoomTask : PersonalTask;
};

/* ======================
   GET TASKS
====================== */
router.get("/:boardId", authMiddleware, async (req, res) => {
  try {
    const boardId = req.params.boardId;
    const Model = getModel(boardId);

    let filter = { boardId };
    if (!boardId.startsWith("room")) {
      filter.userId = req.user.id;
    }

    const tasks = await Model.find(filter);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================
   CREATE TASK
====================== */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const boardId = req.body.boardId;
    const Model = getModel(boardId);

    const newTask = new Model({
      ...req.body,
      userId: req.user.id,
      userEmail: req.user.username
    });

    const saved = await newTask.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================
   UPDATE TASK
====================== */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const boardId = req.body.boardId;
    if (!boardId) {
      return res.status(400).json({ error: "boardId must be provided" });
    }

    const Model = getModel(boardId);

    let filter = { _id: req.params.id };
    if (!boardId.startsWith("room")) {
      filter.userId = req.user.id;
    }

    const updated = await Model.findOneAndUpdate(
      filter,
      req.body,
      { returnDocument: 'after' }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================
   DELETE TASK
====================== */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const boardId = req.query.boardId;
    if (!boardId) {
      return res.status(400).json({ error: "boardId must be provided via query params" });
    }

    const Model = getModel(boardId);

    let filter = { _id: req.params.id };
    if (!boardId.startsWith("room")) {
      filter.userId = req.user.id;
    }

    await Model.findOneAndDelete(filter);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
