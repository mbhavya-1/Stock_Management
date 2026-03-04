const mongoose = require("mongoose");
require("dotenv").config();

const dns = require("node:dns").promises;
dns.setServers(["1.1.1.1"]);

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`MongoDB connection error: ${err.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;

