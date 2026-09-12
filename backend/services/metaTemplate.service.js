// services/metaTemplate.service.js
const axios = require("axios");

const GRAPH_BASE = "https://graph.facebook.com/v26.0";

// list templates seedha Meta se, cursor-based pagination ke saath
const listMetaTemplates = async ({ wabaId, accessToken, after, limit = 20 }) => {
    const res = await axios.get(`${GRAPH_BASE}/${wabaId}/message_templates`, {
        params: { access_token: accessToken, limit, after }
    });
    return res.data; // { data: [...], paging: { cursors, next } }
};

const getMetaTemplateById = async ({ templateId, accessToken }) => {
    const res = await axios.get(`${GRAPH_BASE}/${templateId}`, {
        params: { access_token: accessToken }
    });
    return res.data;
};

// Resumable Upload API - 2 steps: session banao, phir bytes bhejo. Result "handle" milta hai
// jo template create karte waqt HEADER component me use hota hai.
const uploadMedia = async ({ appId, accessToken, file }) => {
    const sessionRes = await axios.post(`${GRAPH_BASE}/${appId}/uploads`, null, {
        params: {
            file_length: file.size,
            file_type: file.mimetype,
            access_token: accessToken
        }
    });
    const uploadSessionId = sessionRes.data.id; // "upload:XXXXX"

    const uploadRes = await axios.post(`${GRAPH_BASE}/${uploadSessionId}`, file.buffer, {
        headers: {
            Authorization: `OAuth ${accessToken}`,
            file_offset: 0
        }
    });

    // uploadRes.data.h hi wo "handle" hai jo verify hone ke baad milta hai -
    // agar ye undefined aaya, samjho upload/verification fail ho gaya
    return uploadRes.data.h || null;
};

const createMetaTemplate = async ({ wabaId, accessToken, payload }) => {
    const res = await axios.post(`${GRAPH_BASE}/${wabaId}/message_templates`, payload, {
        params: { access_token: accessToken }
    });
    return res.data; // { id, status, category }
};

const deleteMetaTemplate = async ({ wabaId, accessToken, name }) => {
    const res = await axios.delete(`${GRAPH_BASE}/${wabaId}/message_templates`, {
        params: { name, access_token: accessToken }
    });
    return res.data;
};

module.exports = {
    listMetaTemplates,
    getMetaTemplateById,
    uploadMedia,
    createMetaTemplate,
    deleteMetaTemplate
};