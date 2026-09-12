import apiClient from "./client";

// Meta ka response "components" array deta hai:
// [{ type: "HEADER", format, text, example }, { type: "BODY", text, example }, ...]
// Poora frontend (list cards, live preview, edit modal) flat fields expect karta hai:
// t.body, t.headerComponent, t.footer, t.buttons — isliye yahin ek baar normalize
// karte hain, taaki har jagah alag se components parse na karna pade.
function normalizeTemplate(raw) {
    const components = raw.components || [];

    const headerComp = components.find((c) => c.type === "HEADER");
    const bodyComp = components.find((c) => c.type === "BODY");
    const footerComp = components.find((c) => c.type === "FOOTER");
    const buttonsComp = components.find((c) => c.type === "BUTTONS");

    return {
        ...raw,
        // Meta ka id hi hamara stable identifier hai — list keys, edit/delete calls
        // sab isi se hote hain, DB ka _id yahan involve nahi hota
        _id: raw.id,

        body: bodyComp?.text || "",

        headerComponent: headerComp
            ? {
                type: headerComp.format || "TEXT",
                text: headerComp.text || "",
                example: headerComp.example?.header_text?.[0] || "",
                mediaUrl: headerComp.example?.header_handle?.[0] || "",
            }
            : { type: "NONE" },

        footer: footerComp?.text || "",

        buttons: (buttonsComp?.buttons || []).map((b) => ({
            type: b.type,
            text: b.text,
            value: b.url || b.phone_number || "",
            dynamic: Boolean(b.example),
            example: b.example?.[0] || "",
        })),
    };
}

export async function getTemplates({ after, limit } = {}) {
    const res = await apiClient.get("/templates", { params: { after, limit } });
    const rawList = res.data.result?.data || [];
    return {
        templates: rawList.map(normalizeTemplate),
        paging: res.data.result?.paging || null,
    };
}

export async function getTemplateById(templateId) {
    const res = await apiClient.get(`/templates/${templateId}`);
    return normalizeTemplate(res.data.result);
}

export async function createTemplate(payload) {
    const res = await apiClient.post("/templates", payload);
    return normalizeTemplate(res.data.result);
}

export async function updateTemplate(templateId, payload) {
    const res = await apiClient.put(`/templates/${templateId}`, payload);
    return normalizeTemplate(res.data.result);
}

export async function deleteTemplate(templateId) {
    const res = await apiClient.delete(`/templates/${templateId}`);
    return res.data;
}