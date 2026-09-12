import apiClient from "./client";

// ASSUMPTION: response shape follows the same convention as groups.js —
// { ErrorMessage, result: { count, data: [...] } }. Confirm with your controller.
export async function getContacts() {
    const res = await apiClient.get("/getall-group-contact");
    console.log("getContacts response:", res.data?.data.count); // Debugging log
    return {
        count: res.data?.data?.count ?? res.data?.data?.length ?? 0,
        contacts: res.data?.data?.data || [],
    };
}

export async function getContactById(contactId) {
    const res = await apiClient.get("/get-contactbyid", { params: { id: contactId } });
    return res.data.result;
}

// Route uses upload.single("file") via multer, so this always POSTs multipart/form-data
// even for manual entries (no actual file attached in that case).
// ASSUMPTION: manual contacts are sent as a JSON string under "contacts" alongside "groupId".
// Confirm this matches what controller.create actually reads off req.body / req.file.
export async function createContactsManual({ groupId, contacts }) {
    const formData = new FormData();
    formData.append("groupId", groupId);
    formData.append("contacts", JSON.stringify(contacts));

    const res = await apiClient.post("/create-group-contact", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.result;
}

// Same endpoint, this time actually carrying the uploaded excel/csv file.
export async function bulkUploadContacts({ groupId, file }) {
    const formData = new FormData();
    formData.append("groupId", groupId);
    formData.append("file", file);

    const res = await apiClient.post("/create-group-contact", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.result;
}

export async function updateContact(contactId, { name, mobileCode, mobileNo }) {
    const res = await apiClient.put(`/update-contact/${contactId}`, { name, mobileCode, mobileNo });
    return res.data.result;
}

// Route has no :id param (DELETE /delete-contact), so the id is assumed to travel
// in the request body — confirm with backend since DELETE + body isn't universally supported.
export async function deleteContact(contactId) {
    const res = await apiClient.delete(`/delete-group-contact/${contactId}`);
    return res.data;
}

// groupContacts join row deletion (removing a contact from a specific group, not deleting the contact itself)
export async function deleteGroupContact(groupId, contactId) {
    const res = await apiClient.delete("/delete-group-contact", { data: { groupId, contactId } });
    return res.data;
}