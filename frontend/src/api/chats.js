import apiClient from "./client";

/* =========================================================
   CONTACTS  (matches your actual backend routes)
   ========================================================= */

/**
 * GET /getall-group-contact
 * Query: ?groupId=&limit=&skip=&search=
 * Response: { ErrorMessage, data: [...], countData }
 */
export async function chatlist({ limit = 100, skip = 0, search = "" } = {}) {
    const params = { limit, skip, search };

    const { data } = await apiClient.get("/chat-list", { params });
    return data;
}

/**
 * GET /get-contactbyid?id=...
 * (Your route uses query string, not path param)
 */
export async function getContactById(id) {
    const { data } = await apiClient.get("/get-contactbyid", {
        params: { id },
    });
    return data;
}

/**
 * POST /create-group-contact
 * Body: { name, mobileCode, mobileNo, email?, groupId? }
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
    const { data } = await apiClient.delete("/delete-contact", {
        params: { id },
    });
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
 * GET /message/get-by-contact/:contactId
 */
export async function getMessagesByContact(contactId, { limit = 100, skip = 0 } = {}) {
    const { data } = await apiClient.get(
        `/message/get-by-contact/${contactId}`,
        { params: { limit, skip } }
    );
    return data;
}

/**
 * POST /message/send
 */
export async function sendMessage({ contactId, message, msgType = "text" }) {
    const { data } = await apiClient.post("/message/send", {
        contactId,
        message,
        msgType,
    });
    return data;
}