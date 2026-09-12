import apiClient from "./client";

// Response shape: { ErrorMessage, result: { count, data: [...] } }
// (dashboard.js endpoints use res.data.data — groups uses res.data.result, so kept separate)
export async function getGroups() {
    const res = await apiClient.get("/getall-group");
    return {
        count: res.data.result.count,
        groups: res.data.result.data,
    };
}

export async function createGroup({ name, description }) {
    const res = await apiClient.post("/create-group", { name, description });
    // API convention here returns the created record under "result" (singular),
    // same as getGroups() returning it under result.data (plural) — adjust if your
    // backend actually nests it differently.
    return res.data.result;
}

export async function updateGroup(groupId, { name, description }) {
    // Endpoint pattern guessed to match create/group's style — confirm the real
    // path/method (PUT vs PATCH) with your backend and adjust if different.
    const res = await apiClient.put(`/update-group/${groupId}`, { name, description });
    return res.data.result;
}

export async function deleteGroup(groupId) {
    const res = await apiClient.delete(`/delete-group/${groupId}`);
    return res.data;
}