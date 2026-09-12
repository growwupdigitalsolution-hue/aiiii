// socket.js
const { Server } = require("socket.io");

let io = null;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // adjust to your frontend URL in production
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log(`[socket] connected: ${socket.id}`);

        // Each user joins their own room so events go only to them
        socket.on("join", (userId) => {
            if (!userId) return;
            socket.join(String(userId));
            console.log(`[socket] user ${userId} joined room`);
        });

        socket.on("disconnect", () => {
            console.log(`[socket] disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) throw new Error("Socket.IO not initialized. Call initSocket(server) first.");
    return io;
};

module.exports = { initSocket, getIO }; 