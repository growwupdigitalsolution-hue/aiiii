import apiClient from "./client";

// Backend base path: /broadcasts (adjust prefix if your app.js mounts it differently)

export async function getBroadcastStats() {
    const res = await apiClient.get("/broadcasts/stats");
    return res.data.result || { sent: 0, delivered: 0, read: 0, failed: 0 };
}

export async function getBroadcasts({ page = 1, limit = 20 } = {}) {
    const res = await apiClient.get("/broadcasts", { params: { page, limit } });
    return {
        count: res.data.result?.count ?? 0,
        broadcasts: res.data.result?.data || [],
    };
}

export async function getBroadcastById(broadcastId) {
    const res = await apiClient.get(`/broadcasts/${broadcastId}`);
    return res.data.result;
}

export async function createBroadcast(payload) {
    // backend field name groupId hai, "group" nahi
    const res = await apiClient.post("/send-broadcast", {
        name: payload.name,
        groupId: payload.group,
        templateId: payload.templateId,
        description: payload.description || null,
        chatbotTemplateId: payload.chatbotTemplateId || null,
    });
    return res.data.result;
}

export async function deleteBroadcast(broadcastId) {
    const res = await apiClient.delete(`/broadcasts/${broadcastId}`);
    return res.data;
}