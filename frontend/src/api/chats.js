import apiClient from "./client";

/* =========================================================
   CONTACTS / CHAT LIST
   ========================================================= */

/**
 * GET /chat-list
 * Query: ?limit=&skip=&search=&status=
 *   status: "all" | "unread" | "pending" | "inProgress" | "closed"
 * Response: { ErrorMessage, data: [...], total, hasMore }
 * Har item me ab ye extra fields bhi aate hain (backend update dekho):
 *   - groupId, groupName        -> agar contact kisi group ka hai
 *   - ticketStatus, ticketNumber-> us contact ke latest ticket ka status
 *   - isOnline                  -> pichle 24 ghante me customer ne msg kiya ya nahi
 */
export async function chatlist({ limit = 10, skip = 0, search = "", status = "all" } = {}) {
    const params = { limit, skip, search, status };
    const { data } = await apiClient.get("/chat-list", { params });
    return data;
}

/**
 * GET /chat-details/:contactId
 * Response: { ErrorMessage, data: [...messages], contact: {...}, total, hasMore }
 * `contact` object me name, mobileNoWithCode, group, ticketStatus, isOnline milta hai
 * -> chat header ke liye use karo.
 */
export async function getMessagesByContact(contactId, { limit = 30, skip = 0 } = {}) {
    const { data } = await apiClient.get(`/chat-details/${contactId}`, {
        params: { limit, skip },
    });
    return data;
}

/**
 * GET /get-contactbyid?id=...
 */
export async function getContactById(id) {
    const { data } = await apiClient.get("/get-contactbyid", { params: { id } });
    return data;
}

/**
 * POST /create-group-contact
 */
export async function createContact(payload) {
    const { data } = await apiClient.post("/create-group-contact", payload);
    return data;
}

/**
 * PUT /update-contact/:id
 */
export async function updateContact(id, payload) {
    const { data } = await apiClient.put(`/update-contact/${id}`, payload);
    return data;
}

/**
 * DELETE /delete-contact?id=...
 */
export async function deleteContact(id) {
    const { data } = await apiClient.delete("/delete-contact", { params: { id } });
    return data;
}

/**
 * DELETE /delete-group-contact/:id
 */
export async function deleteGroupContact(id) {
    const { data } = await apiClient.delete(`/delete-group-contact/${id}`);
    return data;
}

/* =========================================================
   MESSAGES
   ========================================================= */

/**
 * POST /message/send
 * Ab ye function sab message types handle karta hai:
 *   - text      : sendMessage({ contactId, message })
 *   - image/doc : sendMessage({ contactId, msgType: "image", file, message? })
 *   - location  : sendMessage({ contactId, msgType: "location", latitude, longitude, locationName? })
 */
export async function sendMessage({
    contactId,
    message = "",
    msgType = "text",
    file = null,
    latitude,
    longitude,
    locationName,
}) {
    // File wale messages (image / document) -> multipart/form-data
    if ((msgType === "image" || msgType === "document") && file) {
        const form = new FormData();
        form.append("contactId", contactId);
        form.append("msgType", msgType);
        form.append("message", message || "");
        form.append("file", file);

        const { data } = await apiClient.post("/message/send", form, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
    }

    // Location message
    if (msgType === "location") {
        const { data } = await apiClient.post("/message/send", {
            contactId,
            msgType,
            latitude,
            longitude,
            locationName,
        });
        return data;
    }

    // Default: plain text
    const { data } = await apiClient.post("/message/send", {
        contactId,
        message,
        msgType,
    });
    return data;
}