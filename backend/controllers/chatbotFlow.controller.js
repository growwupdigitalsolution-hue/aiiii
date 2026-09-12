const ObjectId = require("mongoose").Types.ObjectId;
const authToken = require("../helper/authToken.helper");
const chatbotFlowService = require("../services/chatbotFlow.service");
const { validateChatbotFlow } = require("../helper/chatbotFlow.validator");

class Controller {
    constructor() {
        this.createChatbot = this.createChatbot.bind(this);
        this.updateChatbot = this.updateChatbot.bind(this);
        this.publishChatbot = this.publishChatbot.bind(this);
        this.getChatbot = this.getChatbot.bind(this);
    }

    async createChatbot(req, res) {
        try {
            const bearerToken = req.headers["authorization"]?.split(" ")[1];
            if (!bearerToken)
                return res
                    .status(401)
                    .json({ ErrorMessage: "Unauthorized access", data: {} });

            const userDetails = await authToken.decodedToken(bearerToken);
            const { name, description, nodes, edges, status } = req.body;

            const validationError = validateChatbotFlow({
                name,
                nodes,
                edges
            });
            if (validationError)
                return res
                    .status(400)
                    .json({ ErrorMessage: validationError, data: {} });

            const payload = {
                userId: userDetails._id,
                name: name.trim(),
                description: (description || "").trim(),
                nodes,
                edges,
                status: status || "draft"
            };

            const inserted = await chatbotFlowService.createChatbotFlow(payload);
            if (!inserted)
                return res
                    .status(500)
                    .json({ ErrorMessage: "Failed to save chatbot", data: {} });

            return res
                .status(200)
                .json({ ErrorMessage: "success", data: inserted });
        } catch (e) {
            console.error(e);
            return res
                .status(500)
                .json({ ErrorMessage: "Internal server error", data: {} });
        }
    }

    async updateChatbot(req, res) {
        try {
            const bearerToken = req.headers["authorization"]?.split(" ")[1];
            if (!bearerToken)
                return res
                    .status(401)
                    .json({ ErrorMessage: "Unauthorized access", data: {} });

            const userDetails = await authToken.decodedToken(bearerToken);
            const { id } = req.params;
            const { name, description, nodes, edges, status } = req.body;

            const validationError = validateChatbotFlow({
                name,
                nodes,
                edges
            });
            if (validationError)
                return res
                    .status(400)
                    .json({ ErrorMessage: validationError, data: {} });

            const updatePayload = {
                name: name.trim(),
                description: (description || "").trim(),
                nodes,
                edges
            };
            if (status) updatePayload.status = status;

            const updated = await chatbotFlowService.updateChatbotFlow(
                id,
                userDetails._id,
                updatePayload
            );

            if (!updated)
                return res
                    .status(404)
                    .json({ ErrorMessage: "Chatbot not found", data: {} });

            return res
                .status(200)
                .json({ ErrorMessage: "success", data: updated });
        } catch (e) {
            console.error(e);
            return res
                .status(500)
                .json({ ErrorMessage: "Internal server error", data: {} });
        }
    }

    async publishChatbot(req, res) {
        try {
            const bearerToken = req.headers["authorization"]?.split(" ")[1];
            if (!bearerToken)
                return res
                    .status(401)
                    .json({ ErrorMessage: "Unauthorized access", data: {} });

            const userDetails = await authToken.decodedToken(bearerToken);
            const { id } = req.params;

            const existing = await chatbotFlowService.getChatbotFlowById(
                id,
                userDetails._id
            );
            if (!existing)
                return res
                    .status(404)
                    .json({ ErrorMessage: "Chatbot not found", data: {} });

            const validationError = validateChatbotFlow({
                name: existing.name,
                nodes: existing.nodes,
                edges: existing.edges
            });
            if (validationError)
                return res
                    .status(400)
                    .json({ ErrorMessage: validationError, data: {} });

            const published = await chatbotFlowService.publishChatbotFlow(
                id,
                userDetails._id
            );

            if (!published)
                return res
                    .status(500)
                    .json({ ErrorMessage: "Failed to publish chatbot", data: {} });

            return res
                .status(200)
                .json({ ErrorMessage: "success", data: published });
        } catch (e) {
            console.error(e);
            return res
                .status(500)
                .json({ ErrorMessage: "Internal server error", data: {} });
        }
    }

    async getChatbot(req, res) {
        try {
            const bearerToken = req.headers["authorization"]?.split(" ")[1];
            if (!bearerToken)
                return res
                    .status(401)
                    .json({ ErrorMessage: "Unauthorized access", data: {} });

            const userDetails = await authToken.decodedToken(bearerToken);
            const { id } = req.params;

            const data = await chatbotFlowService.getChatbotFlowById(
                id,
                userDetails._id
            );
            if (!data)
                return res
                    .status(404)
                    .json({ ErrorMessage: "Chatbot not found", data: {} });

            return res
                .status(200)
                .json({ ErrorMessage: "success", data });
        } catch (e) {
            console.error(e);
            return res
                .status(500)
                .json({ ErrorMessage: "Internal server error", data: {} });
        }
    }
    async getChatbotList(req, res) {
        try {
            const bearerToken = req.headers["authorization"]?.split(" ")[1];
            if (!bearerToken)
                return res
                    .status(401)
                    .json({ ErrorMessage: "Unauthorized access", data: {} });

            const userDetails = await authToken.decodedToken(bearerToken);
            const list = await chatbotFlowService.getChatbotList(userDetails._id);

            return res
                .status(200)
                .json({ ErrorMessage: "success", data: list });
        } catch (e) {
            console.error(e);
            return res
                .status(500)
                .json({ ErrorMessage: "Internal server error", data: {} });
        }
    }
}

module.exports = new Controller();