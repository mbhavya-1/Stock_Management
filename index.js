const app = require("./app");
const express = require("express");
const path = require("path");

app.get("/health", (req, res) => {
  res.send("API is running");
});
app.use(express.static(path.join(__dirname, "public")));
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});