import apiClient from "./client";

/* ---------- CONTACTS ---------- */
export async function listContacts({ limit = 50, skip = 0, search = "" } = {}) {
    const { data } = await apiClient.get("/contacts", {
        params: { limit, skip, search },
    });
    return data; // { ErrorMessage, data: [...], countData }
}

export async function getContactById(id) {
    const { data } = await apiClient.get(`/contacts/${id}`);
    return data;
}

/* ---------- MESSAGES ---------- */
export async function getMessagesByContact(contactId, { limit = 50, skip = 0 } = {}) {
    const { data } = await apiClient.get(
        `/message/get-by-contact/${contactId}`,
        { params: { limit, skip } }
    );
    return data; // { ErrorMessage, data: [...], countData }
}

export async function sendMessage({ contactId, message, msgType = "text" }) {
    const { data } = await apiClient.post("/message/send", {
        contactId,
        message,
        msgType,
    });
    return data;
}