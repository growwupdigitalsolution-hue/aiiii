import apiClient from "./client";

export async function getDashboardSummary() {
    const res = await apiClient.get("/dashboard/summary");
    return res.data.data;
}

export async function getMessageAnalytics() {
    const res = await apiClient.get("/dashboard/message-analytics");
    return res.data.data;
}

export async function getRevenueTrend() {
    const res = await apiClient.get("/dashboard/revenue-trend");
    return res.data.data;
}

export async function getTicketStatusDistribution() {
    const res = await apiClient.get("/dashboard/ticket-status");
    return res.data.data;
}

export async function getRecentActivity() {
    const res = await apiClient.get("/dashboard/recent-activity");
    return res.data.data;
}

export async function getRecentOrders() {
    const res = await apiClient.get("/dashboard/recent-orders");
    return res.data.data;
}
