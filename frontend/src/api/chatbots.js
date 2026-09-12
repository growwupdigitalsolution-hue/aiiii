import apiClient from "./client";

export async function getChatbotList() {
    const res = await apiClient.get("/get-chatbot-list");
    return res.data.data || res.data.result || [];
}
export async function createChatbot(payload) {
    const res = await apiClient.post("/create-chatbot", {
        name: payload.name,
        description: payload.description || "",
        nodes: payload.nodes,
        edges: payload.edges,
        status: payload.status || "draft"
    });
    return res.data.data || res.data.result;
}

export async function updateChatbot(id, payload) {
    const res = await apiClient.post(`/update-chatbot/${id}`, {
        name: payload.name,
        description: payload.description || "",
        nodes: payload.nodes,
        edges: payload.edges,
        status: payload.status || "draft"
    });
    return res.data.data || res.data.result;
}

export async function publishChatbot(id) {
    const res = await apiClient.post(`/publish-chatbot/${id}`);
    return res.data.data || res.data.result;
}

export async function getChatbotById(id) {
    const res = await apiClient.get(`/chatbot-detail/${id}`);
    return res.data.data || res.data.result;
}