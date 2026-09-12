
const metaService = require("../services/metaTemplate.service");
const broadcastService = require("../services/broadcast.service");
const templateService = require("../services/template.service");
const groupService = require("../services/group.service");
const componentsHelper = require("../helper/components.helper");
const userModel = require("../models/users.model");

class BroadcastController {
    async sendBroadcast(req, res) {
        try {
            const user = await userModel.findById(req.user._id);
            if (!user?.whatsappAccountId || !user?.whatsappAcessToken) {
                return res.status(400).json({ ErrorMessage: "WhatsApp account not connected", data: {} });
            }

            const { templateId, groupId, name, description, chatbotTemplateId } = req.body;

            if (!templateId || !groupId || !name) {
                return res.status(400).json({ ErrorMessage: "templateId, groupId and name are required", data: {} });
            }
            console.log("sendBroadcast called with:", { templateId, groupId, name, description, chatbotTemplateId });
            // Local reference record - Meta templateId, header type, variableComponent yahin se
            let templateData = await templateService.findByTemplateId(templateId);

            if (!templateData) {
                return res.status(400).json({ ErrorMessage: "Template not found", data: {} });
            }

            // Poora template content (body, language, buttons) - Meta ki live API se
            let liveTemplate;
            try {
                const metaRes = await metaService.getMetaTemplateById(templateId, user.whatsappAcessToken);
                liveTemplate = metaRes.data;
            } catch (err) {
                console.error("Failed to fetch live template from Meta:", err.response ? err.response.data : err.message);
                return res.status(400).json({ ErrorMessage: "Could not fetch template details from WhatsApp", data: {} });
            }

            // Group ke contacts pehle nikal lo - khali group ke liye broadcast record hi na bane
            let allCustomers = await groupService.getContactByGroupId(groupId);
            if (!allCustomers || !allCustomers.data || allCustomers.data.length === 0) {
                return res.status(400).json({ ErrorMessage: "No data found.", data: {} });
            }

            let contactNumber = allCustomers.data.map((element) => ({
                mobileNumber: `${element.contactId.mobileCode}${element.contactId.mobileNo}`,
                contactId: element.contactId._id,
                name: element.contactId.name,       // agar variable me customer name chahiye
                // koi aur field jo templates me variable ban sakta hai, yahan add karo
            }));

            let broadcastObject = {
                createdby: user._id,
                templateId: templateData._id,
                groupId: groupId,
                name: name,
                description: description || null,
                totalContacts: contactNumber.length
            };

            let createBroadcast = await broadcastService.saveBroadcastRecord(broadcastObject);
            if (!createBroadcast) {
                return res.status(400).json({ ErrorMessage: "Bad request", data: {} });
            }

            let component = [];
            let buttonTypeIndex = -1;
            if (templateData?.variableComponent?.buttonType?.length > 0) {
                buttonTypeIndex = templateData.variableComponent.buttonType.indexOf('copyOfferCode');
            }

            if ((templateData.type && templateData.type !== 'TEXT' && templateData.type !== 'NONE') || buttonTypeIndex >= 0) {
                component = await componentsHelper.generateWhatsAppComponents(liveTemplate, templateData);
            }

            let setTemplateObject = {
                templateData: templateData,      // raw local record - ab andar use hoga
                templateMeta: liveTemplate,       // Meta se aaya data - snapshot/text ke liye
                language: liveTemplate.language,
                name: liveTemplate.name,
                brodcastId: createBroadcast._id,
                contactNumber: contactNumber,
                whatsappNumberId: user.whatsappNumberId,
                whatsappAccountId: user.whatsappAccountId,
                whatsappAcessToken: user.whatsappAcessToken,
                createdby: user._id,
                templateId: templateData._id,
                chatbotTemplateId: chatbotTemplateId || null,
            };

            templateHelper.sendBroadcastRequest(setTemplateObject).catch((err) => {
                console.error("sendBroadcastRequest failed:", err);
            });

            return res.status(200).json({
                ErrorMessage: "Broadcast started successfully",
                data: { broadcastId: createBroadcast._id, totalContacts: contactNumber.length }
            });

        } catch (error) {
            console.error("sendBroadcast error:", error.response ? error.response.data : error.message);
            return res.status(500).json({ ErrorMessage: "Something went wrong", data: {} });
        }
    }
    async getBroadcastStats(req, res) {
        try {
            const stats = await broadcastService.getOverallStatsByUser(req.user._id);
            return res.status(200).json({ ErrorMessage: "Successfully", result: stats });
        } catch (error) {
            console.error("getBroadcastStats error:", error.message);
            return res.status(500).json({ ErrorMessage: "Something went wrong", data: {} });
        }
    }

    async getBroadcastList(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;

            const { data, count } = await broadcastService.findBroadcastListByUser(req.user._id, { skip, limit });

            return res.status(200).json({
                ErrorMessage: "Successfully",
                result: { count, data }
            });
        } catch (error) {
            console.error("getBroadcastList error:", error.message);
            return res.status(500).json({ ErrorMessage: "Something went wrong", data: {} });
        }
    }

    async getBroadcastDetail(req, res) {
        try {
            const { broadcastId } = req.params;
            const broadcast = await broadcastService.findByBroadcastId(broadcastId, req.user._id);
            if (!broadcast) {
                return res.status(404).json({ ErrorMessage: "Broadcast not found", data: {} });
            }
            return res.status(200).json({ ErrorMessage: "Successfully", result: broadcast });
        } catch (error) {
            console.log("getBroadcastDetail error:", error.message);
            return res.status(500).json({ ErrorMessage: "Something went wrong", data: {} });
        }
    }

    async deleteBroadcast(req, res) {
        try {
            const { broadcastId } = req.params;
            const deleted = await broadcastService.softDeleteBroadcast(broadcastId, req.user._id);
            if (!deleted) {
                return res.status(404).json({ ErrorMessage: "Broadcast not found", data: {} });
            }
            return res.status(200).json({ ErrorMessage: "Broadcast deleted successfully", data: {} });
        } catch (error) {
            console.error("deleteBroadcast error:", error.message);
            return res.status(500).json({ ErrorMessage: "Something went wrong", data: {} });
        }
    }
}

module.exports = new BroadcastController();