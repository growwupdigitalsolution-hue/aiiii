// app.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const connectDB = require("./config/db.config");
const routes = require("./routes");
const { initSocket } = require("./socket");
const ticketController = require("./controllers/ticket.controller");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use("/api", routes);

app.get("/", (req, res) => {
    res.status(200).json({ ErrorMessage: "API is running", data: {} });
});

// ---- Create HTTP server (needed for Socket.IO) ----
const server = http.createServer(app);

// ---- Initialize Socket.IO ----
const io = initSocket(server);

// ---- Hand io to ticket controller so it can emit events ----
ticketController.setIO(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;