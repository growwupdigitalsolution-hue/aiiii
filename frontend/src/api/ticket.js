import apiClient from "./client";

export async function getAllTickets({ limit = 20, skip = 0, search = "" } = {}) {
    const { data } = await apiClient.get("/get-all-ticket", { params: { limit, skip, search } });
    return data;
}

export async function getGroupByTicket({ limit = 20, skip = 0, search = "" } = {}) {
    const { data } = await apiClient.get("/get-group-by-ticket", { params: { limit, skip, search } });
    return data;
}

export async function getTicketById(ticketId) {
    const { data } = await apiClient.get(`/get-ticket-by-id/${ticketId}`);
    return data;
}

export async function assignTicketInGroup(ticketId, groupId) {
    const { data } = await apiClient.post("/assign-ticket-in-group", { ticketId, groupId });
    return data;
}

export async function cancelTicket(ticketId, closeResion = "") {
    const { data } = await apiClient.post("/cancel-ticket", { ticketId, closeResion });
    return data;
}

export async function updateReadCount(ticketId) {
    const { data } = await apiClient.post("/update-readCount", { ticketId });
    return data;
}