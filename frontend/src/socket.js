// src/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    autoConnect: false,          // we connect manually after login
    withCredentials: true,
});

/**
 * Connect the socket and join the user's private room.
 * Call this right after a successful login or on app boot (if already logged in).
 */
export const connectSocket = (userId) => {
    if (!userId) return;

    if (!socket.connected) {
        socket.connect();
    }

    const join = () => socket.emit("join", String(userId));

    if (socket.connected) {
        join();
    } else {
        socket.once("connect", join);
    }
};

/**
 * Disconnect on logout.
 */
export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};