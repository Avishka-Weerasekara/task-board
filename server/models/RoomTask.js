const mongoose = require("mongoose");

const roomTaskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, default: "" },
        boardId: { type: String, required: true },
        listName: { type: String, enum: ["To Do", "Doing", "Done"], default: "To Do" },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        userEmail: { type: String }
    },
    { timestamps: true, collection: 'Room Tasks' }
);

module.exports = mongoose.model("RoomTask", roomTaskSchema);
