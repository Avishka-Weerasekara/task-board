const express = require("express");
const Workspace = require("../models/Workspace");
const authMiddleware = require("../middleware/authMiddleware");
const crypto = require("crypto");

const router = express.Router();

// Get all workspaces user has access to
router.get("/", authMiddleware, async (req, res) => {
    try {
        const username = req.user.username; // acts as email
        const workspaces = await Workspace.find({
            $or: [
                { owner: req.user.id },
                { allowedEmails: username }
            ]
        });
        res.json(workspaces);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new shared workspace
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;
        const roomId = "room-" + crypto.randomBytes(4).toString("hex");

        const newWorkspace = new Workspace({
            roomId,
            name: name || "New Shared Workspace",
            owner: req.user.id,
            allowedEmails: [req.user.username]
        });

        const saved = await newWorkspace.save();
        res.json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add an invited user to the workspace
router.post("/:roomId/invite", authMiddleware, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { email } = req.body;

        const workspace = await Workspace.findOne({ roomId });
        if (!workspace) {
            // If it's a legacy room or doesn't exist, we'll auto-create it to support legacy
            const newWorkspace = new Workspace({
                roomId,
                name: "Shared Room",
                owner: req.user.id,
                allowedEmails: [req.user.username, email]
            });
            await newWorkspace.save();
            return res.json({ message: "Workspace created and invited" });
        }

        if (!workspace.allowedEmails.includes(email)) {
            workspace.allowedEmails.push(email);
            await workspace.save();
        }

        res.json({ message: "Invited successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
