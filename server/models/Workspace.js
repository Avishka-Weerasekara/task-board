const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
    {
        roomId: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        allowedEmails: [{ type: String }] // Array of usernames/emails who have access
    },
    { timestamps: true }
);

module.exports = mongoose.model("Workspace", workspaceSchema);
