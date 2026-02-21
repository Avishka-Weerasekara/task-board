require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.db;
    await db.collection("Personal Tasks").updateMany(
        { boardId: { $regex: /^personal-/ } },
        { $set: { boardId: "personal" } }
    );
    console.log("Fixed personal tasks");
    process.exit(0);
});
