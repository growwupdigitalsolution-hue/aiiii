import apiClient from "./client";

// NOTE: Placeholder routes, following the same convention as api/templates.js
// ({ ErrorMessage, result: { data } }) — swap once your real backend exists.
// A production chat feature will likely want a websocket (e.g. Socket.io) for
// live message delivery; this REST version fetches on open and after sending.

export async function getThreads() {
    const res = await apiClient.get("/chats");
    return { threads: res.data.result?.data || [] };
}

export async function getMessages(threadId) {
    const res = await apiClient.get(`/chats/${threadId}/messages`);
    return { messages: res.data.result?.data || [] };
}

export async function sendMessage(threadId, text) {
    const res = await apiClient.post(`/chats/${threadId}/messages`, { text });
    return res.data.result;
}