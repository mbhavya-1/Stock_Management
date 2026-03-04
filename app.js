require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const inventoryRoutes = require("./routes/inventoryRoutes");
const logsRoutes = require("./routes/logsRoutes");

// Connect to MongoDB first
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/items", inventoryRoutes);
app.use("/api/logs", logsRoutes);

module.exports = app;
