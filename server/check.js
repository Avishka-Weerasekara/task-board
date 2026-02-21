require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.db;
    const users = await db.collection("Users").find({}).toArray();
    const tasks = await db.collection("Room Tasks").find({}).toArray();
    require("fs").writeFileSync("db_dump.json", JSON.stringify({ users, tasks }, null, 2));
    process.exit(0);
});
