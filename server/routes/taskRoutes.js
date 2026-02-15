const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

/* =====================
   GET TASKS
===================== */
router.get("/:boardId", async (req, res) => {
  try {
    const tasks = await Task.find({ boardId: req.params.boardId });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================
   CREATE TASK
===================== */
router.post("/", async (req, res) => {
  try {
    const task = new Task(req.body);
    const saved = await task.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================
   UPDATE TASK (Edit or Move)
===================== */
router.put("/:id", async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================
   DELETE TASK
===================== */
router.delete("/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
