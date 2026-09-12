// controllers/templates.controller.js
const metaService = require("../services/metaTemplate.service");
const templateService = require("../services/template.service");
const userModel = require("../models/users.model");

// Meta ke "components" payload structure banata hai - header/body/buttons
function parseMaybeJSON(value, fallback) {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }
    return value; // already parsed
}

function buildMetaComponents({ headerType, headerText, headerHandle, body, footer, buttons, variableComponent }) {
    const components = [];

    if (headerType && headerType !== "NONE") {
        const headerComponent = { type: "HEADER", format: headerType };

        if (headerType === "TEXT") {
            headerComponent.text = headerText;
        } else {
            // IMAGE / VIDEO / DOCUMENT - verified media handle se
            headerComponent.example = { header_handle: [headerHandle] };
        }
        components.push(headerComponent);
    }

    const bodyComponent = { type: "BODY", text: body };

    // BODY variables ke example values Meta ko chahiye hote hain approval ke liye -
    // frontend se aaya variableComponent.BODY_DETAIL isi ke liye use hota hai
    const bodyDetail = variableComponent?.BODY_DETAIL;
    if (bodyDetail && Object.keys(bodyDetail).length > 0) {
        const orderedExamples = Object.keys(bodyDetail)
            .sort((a, b) => Number(a) - Number(b))
            .map((k) => bodyDetail[k]?.example || "");
        bodyComponent.example = { body_text: [orderedExamples] };
    }
    components.push(bodyComponent);

    if (footer && footer.trim()) {
        components.push({ type: "FOOTER", text: footer.trim() });
    }

    if (Array.isArray(buttons) && buttons.length > 0) {
        components.push({
            type: "BUTTONS",
            buttons: buttons.map((b) => {
                const btn = { type: b.type, text: b.text };
                if (b.type === "URL") {
                    btn.url = b.value;
                    if (b.dynamic && b.example) btn.example = [b.example];
                }
                if (b.type === "PHONE_NUMBER") btn.phone_number = b.value;
                return btn;
            })
        });
    }

    return components;
}

// body/header me kitne {{n}} variables hain, per-component - taaki send-time pe
// dobara Meta se poochna na pade ki kitne params bhejne hain
function extractVariableComponents(components) {
    const result = {};
    components.forEach((c) => {
        if (c.type === "BODY" && c.text) {
            const matches = [...c.text.matchAll(/\{\{(\d+)\}\}/g)];
            if (matches.length) result.BODY = matches.length;
        }
    });
    return result;
}

class TemplateController {
    // GET /templates?after=&limit=
    // List Meta se real-time aati hai; DB sirf imageUrl/variableComponent merge karne ke liye use hota hai
    async list(req, res) {
        try {
            const user = await userModel.findById(req.user._id);
            if (!user?.whatsappAccountId || !user?.whatsappAcessToken) {
                return res.status(400).json({ ErrorMessage: "WhatsApp account not connected", data: {} });
            }

            const { after, limit } = req.query;
            const metaRes = await metaService.listMetaTemplates({
                wabaId: user.whatsappAccountId,
                accessToken: user.whatsappAcessToken,
                after,
                limit: Number(limit) || 20
            });

            const templateIds = metaRes.data.map((t) => t.id);
            const dbRecords = await templateService.findManyByTemplateIds(templateIds);
            const dbMap = dbRecords.reduce((map, r) => {
                map[r.templateId] = r;
                return map;
            }, {});

            const merged = metaRes.data.map((t) => ({
                ...t,
                imageUrl: dbMap[t.id]?.imageUrl || null,
                variableComponent: dbMap[t.id]?.variableComponent || null
            }));

            return res.status(200).json({
                ErrorMessage: "Successfully",
                result: {
                    data: merged,
                    paging: metaRes.paging // { cursors: { before, after }, next }
                }
            });
        } catch (error) {
            console.error("Template list error:", error?.response?.data || error);
            return res.status(500).json({ ErrorMessage: "Something went wrong", data: {} });
        }
    }

    // GET /templates/:templateId - single template, real-time + merged DB extras
    async getById(req, res) {
        try {
            const user = await userModel.findById(req.user._id);
            const metaTemplate = await metaService.getMetaTemplateById({
                templateId: req.params.templateId,
                accessToken: user.whatsappAcessToken
            });
            const dbRecord = await templateService.findByTemplateId(req.params.templateId);

            return res.status(200).json({
                ErrorMessage: "Successfully",
                result: {
                    ...metaTemplate,
                    imageUrl: dbRecord?.imageUrl || null,
                    variableComponent: dbRecord?.variableComponent || null
                }
            });
        } catch (error) {
            console.error("Template getById error:", error?.response?.data || error);
            return res.status(500).json({ ErrorMessage: "Something went wrong", data: {} });
        }
    }

    // POST /templates (multipart - "media" field agar header IMAGE/DOCUMENT/VIDEO ho)
    async create(req, res) {
        try {
            const user = await userModel.findById(req.user._id);
            if (!user?.whatsappAccountId || !user?.whatsappAcessToken) {
                return res.status(400).json({ ErrorMessage: "WhatsApp account not connected", data: {} });
            }

            const { name, category, language, body, footer } = req.body;
            const headerComponent = parseMaybeJSON(req.body.headerComponent, { type: "NONE" });
            const buttons = parseMaybeJSON(req.body.buttons, []);
            const variableComponent = parseMaybeJSON(req.body.variableComponent, {});

            const headerType = headerComponent?.type || "NONE";
            let headerHandle = null;

            if (["IMAGE", "DOCUMENT", "VIDEO"].includes(headerType)) {
                if (!req.file) {
                    return res.status(400).json({ ErrorMessage: "Header media file is required", data: {} });
                }
                headerHandle = await metaService.uploadMedia({
                    appId: process.env.FB_APP_ID,
                    accessToken: user.whatsappAcessToken,
                    file: req.file
                });
                if (!headerHandle) {
                    return res.status(400).json({ ErrorMessage: "Media upload could not be verified by Meta", data: {} });
                }
            }

            const components = buildMetaComponents({
                headerType,
                headerText: headerComponent?.text,
                headerHandle,
                body,
                footer,
                buttons,
                variableComponent
            });

            const metaTemplate = await metaService.createMetaTemplate({
                wabaId: user.whatsappAccountId,
                accessToken: user.whatsappAcessToken,
                payload: { name, category, language, components }
            });

            const saved = await templateService.saveTemplateRecord({
                userId: user._id,
                templateId: metaTemplate.id,
                name,
                status: metaTemplate.status || "PENDING",
                type: headerType,
                imageUrl: headerHandle,
                variableComponent
            });

            return res.status(200).json({ ErrorMessage: "Template submitted for approval", result: saved });
        } catch (error) {
            console.error("Template create error:", error?.response?.data || error);
            return res.status(500).json({
                ErrorMessage: error?.response?.data?.error?.message || "Something went wrong",
                data: {}
            });
        }
    }

    // DELETE /templates/:templateId
    async remove(req, res) {
        try {
            const user = await userModel.findById(req.user._id);
            const record = await templateService.findByTemplateId(req.params.templateId);

            await metaService.deleteMetaTemplate({
                wabaId: user.whatsappAccountId,
                accessToken: user.whatsappAcessToken,
                name: record?.name || req.query.name
            });

            await templateService.softDeleteTemplate(req.params.templateId);

            return res.status(200).json({ ErrorMessage: "Template deleted successfully", data: {} });
        } catch (error) {
            console.error("Template delete error:", error?.response?.data || error);
            return res.status(500).json({ ErrorMessage: "Something went wrong", data: {} });
        }
    }

    // GET /templates/webhook - Meta verification handshake (setup ke time ek baar)
    async verifyWebhook(req, res) {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        if (mode === "subscribe" && token === process.env.FB_WEBHOOK_VERIFY_TOKEN) {
            return res.status(200).send(challenge);
        }
        return res.sendStatus(403);
    }

    // POST /templates/webhook - Meta yahan status change bhejta hai (APPROVED/REJECTED/PAUSED)
    async statusWebhook(req, res) {
        try {
            const entry = req.body.entry?.[0];
            const change = entry?.changes?.[0]?.value;

            if (change?.event && change?.message_template_id) {
                await templateService.updateTemplateRecord(String(change.message_template_id), {
                    status: change.event
                });
            }

            return res.sendStatus(200); // Meta ko hamesha 200 chahiye, warna wo retries karta rahega
        } catch (error) {
            console.error("Template webhook error:", error);
            return res.sendStatus(200);
        }
    }
}

module.exports = new TemplateController();