require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const PersonalTask = require("./models/PersonalTask");
const RoomTask = require("./models/RoomTask");

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected");

    const users = await User.find({});
    const userMap = {};
    for (const u of users) userMap[u._id.toString()] = u.username;

    const pTasks = await PersonalTask.find({});
    for (const t of pTasks) {
        if (!t.userEmail) {
            t.userEmail = userMap[t.userId.toString()];
            await t.save();
        }
    }

    const rTasks = await RoomTask.find({});
    for (const t of rTasks) {
        if (!t.userEmail) {
            t.userEmail = userMap[t.userId.toString()];
            await t.save();
        }
    }

    console.log("Migration finished");
    process.exit(0);
}

run().catch(console.error);
