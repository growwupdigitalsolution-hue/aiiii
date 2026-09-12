const componentsHelper = require('./componentsHelper');
const broadcastService = require('../services/broadcast.service');
const messageService = require('../services/message.service');

function resolveContactVariables(templateData, contact) {
    const bodyDefs = templateData?.variableComponent?.body || [];
    if (bodyDefs.length === 0) return [];

    const sorted = [...bodyDefs].sort((a, b) => a.position - b.position);

    return sorted.map((def) => {
        if (def.source === 'static') {
            return def.value || '';
        }
        return contact?.[def.field] ?? '';
    });
}

async function sendBroadcastRequest(getData) {
    let phoneNumbers = getData.contactNumber;

    const promises = phoneNumbers.map(async (number, numberIndex) => {
        if (numberIndex === 0) {
            await broadcastService.updateBroadcastRecord(getData.brodcastId, { boradcastStatus: 'Inprogress' });
            io.to("user_" + getData.createdby).emit('broadCastStatus', {
                "message": "Broadcast Inprogress successfully. Broadcast ID: " + getData.brodcastId
            });
        }

        try {
            const bodyVariables = resolveContactVariables(getData.templateData, number);
            const components = await componentsHelper.generateWhatsAppComponents(
                getData.templateData,
                bodyVariables
            );

            const response = await axios.post(
                `${process.env.WHATSAPP_API_URL}${getData.whatsappNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: "individual",
                    to: number.mobileNumber,
                    type: 'template',
                    template: {
                        language: { code: getData.language || getData.templateMeta?.language },
                        name: getData.name || getData.templateMeta?.name,
                        components: components
                    },
                },
                {
                    headers: {
                        'Authorization': `Bearer ${getData.whatsappAcessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            let whatsAppMessageId = response.data.messages[0].id;
            let templateSnapshot = buildTemplateSnapshot(getData.templateMeta, components);

            await messageService.saveMessageRecord({
                "broadcastId": getData.brodcastId,
                "createdby": getData.createdby,
                "contactId": number.contactId,
                "templateId": getData.templateId,
                "chatbotTemplateId": getData.chatbotTemplateId,
                "sendBy": 'system',
                "msgType": 'template',
                "message": templateSnapshot.body,
                "templateSnapshot": templateSnapshot,
                "whatsAppMessageId": whatsAppMessageId,
                "isSent": 1,
                "isSentTime": new Date()
            });

            await broadcastService.updateBroadcastRecord(getData.brodcastId, { $inc: { sentCount: 1 } });

        } catch (error) {
            console.error(`Failed to send message to ${number.mobileNumber}:`, error.response ? error.response.data : error.message);

            await messageService.saveMessageRecord({
                "broadcastId": getData.brodcastId,
                "createdby": getData.createdby,
                "contactId": number.contactId,
                "templateId": getData.templateId,
                "chatbotTemplateId": getData.chatbotTemplateId,
                "sendBy": 'system',
                "msgType": 'template',
                "isSent": 0,
                "isFailed": 1,
                "isFailedTime": new Date(),
                "errorObject": error.response ? error.response.data : error.message
            });

            await broadcastService.updateBroadcastRecord(getData.brodcastId, { $inc: { failedCount: 1 } });
        }
    });

    await Promise.all(promises);

    const finalBroadcast = await broadcastService.findByBroadcastId(getData.brodcastId);
    const finalStatus = (finalBroadcast.sentCount === 0 && finalBroadcast.failedCount > 0)
        ? 'Failed'
        : 'Completed';

    await broadcastService.updateBroadcastRecord(getData.brodcastId, { boradcastStatus: finalStatus });

    setTimeout(() => {
        io.to("user_" + getData.createdby).emit('broadCastStatus', {
            "message": `Broadcast ${finalStatus.toLowerCase()}. Broadcast ID: ` + getData.brodcastId
        });
    }, 5000);
}

function buildTemplateSnapshot(templateMeta, components) {
    const bodyComponent = components.find(c => c.type === 'body');
    const headerComponent = components.find(c => c.type === 'header');
    const buttonComponents = components.filter(c => c.type === 'button');

    return {
        headerType: templateMeta?.headerType || 'NONE',
        headerText: headerComponent?.parameters?.find(p => p.type === 'text')?.text || null,
        headerMediaUrl: headerComponent?.parameters?.find(p => ['image', 'video', 'document'].includes(p.type))
            ?.[headerComponent.parameters[0].type]?.link || null,
        body: bodyComponent
            ? resolveBodyText(templateMeta?.bodyText, bodyComponent.parameters)
            : (templateMeta?.bodyText || ''),
        footer: templateMeta?.footerText || null,
        buttons: buttonComponents.map(b => ({ type: b.sub_type, text: b?.text || null }))
    };
}

function resolveBodyText(bodyText, parameters) {
    if (!bodyText || !parameters) return bodyText || '';
    let resolved = bodyText;
    parameters.forEach((p, i) => {
        resolved = resolved.replace(`{{${i + 1}}}`, p.text || '');
    });
    return resolved;
}

module.exports = { sendBroadcastRequest };