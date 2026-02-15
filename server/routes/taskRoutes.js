const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");

/* ======================
   GET TASKS (User Only)
====================== */
router.get("/:boardId", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({
      boardId: req.params.boardId,
      userId: req.user.id
    });

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
    const newTask = new Task({
      ...req.body,
      userId: req.user.id
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
    const updated = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
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
    await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
