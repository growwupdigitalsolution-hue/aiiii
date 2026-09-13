const ejs = require('ejs');
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const moment = require('moment');
const axios = require('axios'); // axios import
const Razorpay = require("razorpay");
const { parsePhoneNumber } = require('libphonenumber-js');
const authToken = require('../../helper/authToken.helper');
var awsFile = require("../../helper/awsFileUpload.js")
var userService = require('../../services/singInUp.service');
var contactsService = require('../../services/contact.service');
var broadCastHistoryService = require('../../services/boardcast.service');
var messageService = require('../../services/message.service');
var templateService = require('../../services/whatsappCloud/template.service');
var templateHelper = require('../../helper/cloudTemplate.helper');
var socketHelper = require("../../helper/socket.helper.js");
var ticketService = require("../../services/ticket.service.js");
var chatbotService = require("../../services/chatbot.service.js");
var menuService = require("../../services/menu.service.js");
var broadcastController = require("../../controllers/whatsappCloud/broadcast.controler.js");
const { text } = require('express');

const io = socketHelper.getIO();

class Controller {
    constructor() {
        this.webHookPostResponse = this.webHookPostResponse.bind(this);
        this.updateBroadCastHistory = this.updateBroadCastHistory.bind(this);
        this.updateMessageHistory = this.updateMessageHistory.bind(this);
        this.updateTemplateHistory = this.updateTemplateHistory.bind(this);
        this.chatboatMessageHistory = this.chatboatMessageHistory.bind(this);
        this.checkChatbotByText = this.checkChatbotByText.bind(this);

    }
    async testSocket(req, res) {
        const param = req.query;
        // //console.log(req);

        io.to("user_" + param.id).emit('publicNotification', { "message": "brooadcast to user id " + param.id });
        io.emit('publicNotification', { "message": "brooadcast to all " });

        return res.status(200).json({
            "ErrorMessage": "successfully",
            "data": {}
        })
    }
    async webHookPostResponse(req, res) {
        const param = req.body;
        console.log('param', JSON.stringify(param))

        if (param.entry && param.entry[0].changes) {
            let setdata = param.entry[0]

            if (setdata.changes[0].value.statuses && setdata.changes[0].value.statuses[0]) {
                this.updateBroadCastHistory(setdata)
            } else if (setdata.changes[0].value.messages && setdata.changes[0].value.messages[0]) {
                this.updateMessageHistory(setdata)
            } else if (setdata.changes[0].value.event && setdata.changes[0].value.message_template_id) {
                this.updateTemplateHistory(setdata)
            }
            return res.status(200).json({
                "ErrorMessage": "successfully",
                "data": {}
            })
        } else {
            return res.status(200).json({
                "ErrorMessage": "No changes found",
                "data": {}
            })
        }
    }
    async webHookGetResponse(req, res) {
        const VERIFY_TOKEN = "my_verify_token_123";

        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        if (mode && token === VERIFY_TOKEN) {
            return res.status(200).send(challenge);
        }

        return res.sendStatus(403);
    }
    async updateBroadCastHistory(getData) {
        //console.log("step 001", getData)
        let statusData = getData.changes[0].value.statuses[0]
        // console.log("step 002", statusData)
        let status = statusData.status
        // console.log("step 003", status)

        let whatsAppMessageId = statusData.id
        // console.log("step 004", whatsAppMessageId)

        let whereObject = { "whatsAppMessageId": whatsAppMessageId }
        let setData = {}
        if (status == "sent") {
            setData.isSent = 1;
            setData.isSentDate = moment.unix(statusData.timestamp).format('YYYY-MM-DDTHH:mm:ss')
        } else if (status == "delivered") {
            setData.isDelivered = 1;
            setData.isSent = 1;
            setData.isFailed = 0;
            setData.isDeliveredTime = moment.unix(statusData.timestamp).format('YYYY-MM-DDTHH:mm:ss')
        } else if (status == "read") {
            setData.isRead = 1;
            setData.isDelivered = 1;
            setData.isSent = 1;
            setData.isFailed = 0;
            setData.isReadTime = moment.unix(statusData.timestamp).format('YYYY-MM-DDTHH:mm:ss')
        } else if (status == "response") {
            setData.isResponse = 1;
            setData.isRead = 1;
            setData.isDelivered = 1;
            setData.isSent = 1;
            setData.isFailed = 0;
            setData.isResponseTime = moment.unix(statusData.timestamp).format('YYYY-MM-DDTHH:mm:ss')
        } else if (status == "failed") {
            setData.isFailed = 1
            setData.isResponse = 0
            setData.isSent = 1
            setData.isDelivered = 0
            setData.isRead = 0
            setData.isFailedTime = moment.unix(statusData.timestamp).format('YYYY-MM-DDTHH:mm:ss')
            setData.errorObject = statusData.errors
        }

        let getBroadcastData = await messageService.findOneByCondition(whereObject)

        if (getBroadcastData) {


            // io.emit('messageStatus', { whatsAppMessageId: whatsAppMessageId, contactId: setData.contactId });
            let updateBroadCastHistoryData = await broadCastHistoryService.updateByCondition(whereObject, setData)
            // if (updateBroadCastHistoryData) {

            // } else {

            messageService.updateByMessageId(whatsAppMessageId, setData)
            // }
            setData.whatsAppMessageId = whatsAppMessageId


            io.to("user_" + getBroadcastData.createdby).emit('messageStatus', {
                "message": "Manage Template Status", statusData: setData
            });
        } else {

        }


    }
    async updateMessageHistory(getData) {
        let data = getData.changes[0].value
        // console.log('data webhook', JSON.stringify(data));
        let phone_number_id = data.metadata.phone_number_id;
        let mobileNo = data.messages[0].from;
        let userName = data.contacts[0].profile.name;
        let message_id; let message; let reciveMessageTime; let msg_id; let fileType; let mediaId; let filename; let msgType;
        let replyMsg_id = null; let msgfileUrl;
        if (data.messages[0].context) {
            message_id = data.messages[0].context.id;
        }
        if (data.messages[0].text) {
            message = data.messages[0].text.body;
            reciveMessageTime = data.messages[0].timestamp;
            msg_id = data.messages[0].id;
            fileType = null
            mediaId = null
            filename = null
            msgType = data.messages[0].type;
            if (data.messages[0].context) {
                replyMsg_id = data.messages[0].context.id
            }
            if (data.messages[0].referral) {
                msgfileUrl = data.messages[0].referral.image_url
            } else {
                msgfileUrl = null
            }


        } else if (data.messages[0].interactive) {
            if (data.messages[0].interactive.type == "list_reply") {
                message = data.messages[0].interactive.list_reply.title;
            } else {
                message = data.messages[0].interactive.button_reply.title;
            }
            reciveMessageTime = data.messages[0].timestamp;
            msg_id = data.messages[0].id;
            fileType = null
            mediaId = null
            filename = null
            msgType = data.messages[0].type;
            if (data.messages[0].context) {
                replyMsg_id = data.messages[0].context.id
            }
        } else if (data.messages[0].image || data.messages[0].video || data.messages[0].audio || data.messages[0].document) {

            if (data.messages[0].type === 'video') {
                fileType = data.messages[0].video.mime_type;
                message = data.messages[0].video.caption;
                mediaId = data.messages[0].video.id;
            } else if (data.messages[0].type == 'audio') {
                fileType = data.messages[0].audio.mime_type;
                message = data.messages[0].audio.caption;
                mediaId = data.messages[0].audio.id;
            } else if (data.messages[0].type == 'image') {
                fileType = data.messages[0].image.mime_type;
                message = data.messages[0].image.caption;
                mediaId = data.messages[0].image.id;
            }
            message = null
            reciveMessageTime = data.messages[0].timestamp;
            msgType = data.messages[0].type;
            msg_id = data.messages[0].id;
            if (data.messages[0].context) {
                replyMsg_id = data.messages[0].context.id
            }
        } else if (data.messages[0].button) {
            // console.log('data.messages[0]', data.messages[0])
            // buttonResponce = data.messages[0].button.text;
            message = data.messages[0].button.text;
            reciveMessageTime = data.messages[0].timestamp;
            fileType = null;
            msgType = "text";
            msg_id = data.messages[0].id
            if (data.messages[0].context) {
                replyMsg_id = data.messages[0].context.id
            }

        } else if (data.messages[0].reaction) {

            message = data.messages[0].reaction.emoji;
            reciveMessageTime = data.messages[0].timestamp;
            msg_id = data.messages[0].id;
            fileType = null
            mediaId = null
            msgType = "text"
            if (data.messages[0].reaction) {
                replyMsg_id = data.messages[0].reaction.message_id
            }

        } else if (data.messages[0].location) {
            msgInfo = data.messages[0].location;
            reciveMessageTime = data.messages[0].timestamp;
            msg_id = data.messages[0].id;
            fileType = null
            mediaId = null
            filename = null
            message = null
            msgType = data.messages[0].type;
            if (data.messages[0].context) {
                replyMsg_id = data.messages[0].context.id
            }

        } else if (data.messages[0].contacts) {
            msgInfo = data.messages[0].contacts;
            reciveMessageTime = data.messages[0].timestamp;
            msg_id = data.messages[0].id;
            fileType = null
            mediaId = null
            filename = null
            message = null
            msgType = data.messages[0].type;
            if (data.messages[0].context) {
                replyMsg_id = data.messages[0].context.id
            }

        }

        // handel reply message

        if (replyMsg_id) {

            // Manage for broadcast messages

            let whereObject = { "whatsAppMessageId": replyMsg_id }
            let getBroadcastData = await messageService.findOneByCondition(whereObject)
            if (getBroadcastData) {
                let setResponceObject = {
                    isResponse: 1,
                    isResponseTime: moment.unix(data.messages[0].timestamp).format('YYYY-MM-DDTHH:mm:ss')

                }
                let updateBroadCastHistoryData = await broadCastHistoryService.updateByCondition(whereObject, setResponceObject)
            }

            // manage for chatbot message history

            this.chatboatMessageHistory(data.messages[0])

        }



        // //console.log('setData', setData)
        let userData = await userService.getDataByCondition({ whatsappNumberId: phone_number_id })

        if (data.messages[0].image || data.messages[0].video || data.messages[0].audio || data.messages[0].document) {

            if (data.messages[0].type === 'image') {
                let caption = data.messages[0].image.caption
                message = caption != undefined && caption != '' ? caption : ''
            } else if (data.messages[0].type === 'video') {
                let caption = data.messages[0].video.caption
                message = caption != undefined && caption != '' ? caption : ''
            } else if (data.messages[0].type === 'document') {
                let caption = data.messages[0].document.caption
                message = caption != undefined && caption != '' ? caption : ''
            }
            let mediaIdData = await templateHelper.getMediaUrl({ mediaId: mediaId, accessToken: userData[0].whatsappAcessToken })

            data.mimeType = mediaIdData?.mime_type
            data.mediaUrl = mediaIdData.url
            // data.id = mediaIdData.id


            let setImageUrlObject = {
                "whatsappAcesstoken": userData[0].whatsappAcessToken,
                "mediaUrl": mediaIdData.url,
                "msgType": msgType,
                "mimeType": mediaIdData.mime_type,
                "id": mediaIdData.id
            }
            console.log('setImageUrlObject', setImageUrlObject)
            let mediaUrlData = await templateHelper.getMediaUrlDecode(setImageUrlObject)

            let awsData = await awsFile.uploadFile({ originalname: mediaUrlData.originalname, buffer: mediaUrlData.buffer, mimeType: mediaUrlData.mimeType })
            //
            msgfileUrl = awsData.Location
        }
        let whereObject = { "msgId": msg_id }
        let setData = {
            "phone_number_id": phone_number_id,
            "mobileNo": mobileNo,
            "userName": userName,
            "message": message,
            "reciveMessageTime": reciveMessageTime,
            "whatsAppMessageId": msg_id,
            "fileType": fileType,
            "mediaId": mediaId,
            "filename": filename,
            "msgType": msgType,
            "whatsappReplyMsgId": replyMsg_id,
            "msgfile": msgfileUrl,
            "sendBy": "customer",
            "isSent": 1,
            "isDelivered": 1,
            "isSentTime": moment.unix(data.messages[0].timestamp).format('YYYY-MM-DDTHH:mm:ss'),
            "isDeliveredTime": moment.unix(data.messages[0].timestamp).format('YYYY-MM-DDTHH:mm:ss'),
            "responseObject": data.messages[0] ? data.messages[0] : null,

        }

        let contactData = await contactsService.getDataByCondition({ userId: new ObjectId(userData[0]._id), mobileNoWithCode: mobileNo })
        // console.log('contactData', contactData.length)

        if (contactData.length == 0 || contactData.length == undefined || contactData.length == '') {
            const parsedNumber = parsePhoneNumber(`+${mobileNo}`);

            if (parsedNumber) {
                console.log('Country Code:', parsedNumber.countryCallingCode); // Example: 91
                console.log('National Number:', parsedNumber.nationalNumber);  // Example: 8959697176
            } else {
                console.log('Invalid phone number');
            }
            let setContactData = {
                "userId": new ObjectId(userData[0]._id),
                "mobileNoWithCode": mobileNo,
                "mobileCode": parsedNumber.countryCallingCode,
                "mobileNo": parsedNumber.nationalNumber,
                "name": userName,
            }
            console.log('setContactData:', setContactData);
            let newContactData = await contactsService.insertData(setContactData)
            console.log('newContactData:', newContactData);

            setData.contactId = newContactData._id !== undefined && newContactData._id != null ? newContactData._id : null
        } else {
            setData.contactId = contactData[0]._id !== undefined && contactData[0]._id != null ? contactData[0]._id : null
        }
        //console.log('customerData', contactData[0]._id)
        setData.createdby = userData[0]._id != undefined ? userData[0]._id : null

        // //console.log('setData', setData)
        // return false
        let createMessage = await messageService.create(setData)
        // console.log('createMessage', createMessage)
        io.to("user_" + userData[0]._id).emit('newMessage', {
            "message": "new message", data: createMessage, tem1: "datajshfkjs"
        });
        setData.lastMessageId = createMessage._id
        let ticketData = await ticketService.create(setData)
        if (ticketData) {
            io.to("user_" + userData[0]._id).emit('ticketMessage', {
                "message": "new ticket", data: ticketData
            });
        }

        if (msgfileUrl == null && replyMsg_id == null) {
            let setDataQr = {
                text: message,
                userId: userData[0]._id,
                contactId: setData.contactId
            }
            console.log('setDataQr', setDataQr);

            this.checkChatbotByText(setDataQr)
        }

        // io.emit('message', { userId: userData[0]._id, contactId: setData.contactId });
    }
    async updateTemplateHistory(getData) {
        let data = getData.changes[0].value
        var metaTemplatedId = data.message_template_id
        var status = data.event
        let templateData = await templateService.getDataByCondition({ templateId: metaTemplatedId })
        if (templateData) {
            let setData = {
                "status": status
            }

            let updateTemplateHistoryData = await templateService.updateTemplate(templateData[0]._id, setData)
            //console.log('updateTemplateHistoryData', updateTemplateHistoryData)

            // io.emit('templateStatus', { whatsAppMessageId: templateData[0].createdby, templateData: templateData[0]._id });
            io.to("user_" + templateData[0].createdby).emit('templateStatus', {
                "message": "new message", data: { templateData: templateData[0]._id, createdby: templateData[0].createdby }
            });

        }
    }
    async chatboatMessageHistory(getData) {
        console.log('chatboatMessageHistory', JSON.stringify(getData))
        let replyMsg_id = getData.context.id
        let message = await messageService.getMessage(replyMsg_id)
        // console.log('getData 01', message)
        let buttonText
        console.log('chatboatMessageHistory 01', getData.type)

        if (getData.type == "interactive") {
            buttonText = getData.interactive.button_reply.title;
        } else {
            buttonText = getData.button.text;
        }
        console.log('chatboatMessageHistory 02', message.chatbotTemplateId?._id)
        if (message.chatbotTemplateId?._id != null && message.chatbotTemplateId?._id != undefined && message.chatbotTemplateId?._id != '') {
            let actionData = await chatbotService.getActionData({ id: message.chatbotTemplateId._id, button: buttonText })
            console.log('chatboatMessageHistory 03', actionData)

            if (actionData) {



                let setData = {
                    templateId: actionData.responceChatbotTemplateId.templateId,
                    chatbotTemplateId: actionData.responceChatbotTemplateId._id,
                    userId: message.createdby,
                    contactId: message.contactId,
                    chatbotId: actionData.chatbotId

                }
                console.log('chatboatMessageHistory 04', setData)

                await broadcastController.sendChatbotTemplate(setData)
            }
        } else {
            let template = await templateService.getDataById(message.templateId)
            if (template.name == 'paymentoption') {
                let setWhereObject = {
                    userId: new ObjectId(message.createdby),
                    contactId: new ObjectId(message.contactId),
                    orderStatus: "pending"
                }
                let orderList = await menuService.getOrders(setWhereObject)
                let contactsData = await contactsService.getById(message.contactId)
                let user = await userService.getUserDetails(message.createdby);

                const orderLines = orderList[0].orderItems.map(order =>
                    `•${order.itemName.charAt(0).toUpperCase() + order.itemName.slice(1)}: ${order.quantity} Q × ${order.unitPrice} = ${order.totalPrice}`
                );


                const orderNumber = orderList[0].orderNumber;
                const total = orderList[0].totalAmount;
                const messageText = `🧾 *✨Order Invoice✨*\n\n📦 *Order No:* *${orderNumber}*\n\n🔸* Items Ordered:* \n${orderLines.join('\n')}\n\n💵 *Total Amount:* *₹${total}*\n\n✅ *Your order has been successfully completed!*\nWe hope you enjoyed your meal. 😊\n🙏 *Thank you for choosing us! `;

                // const messageText = `🧾 *Order Invoice*\n*Order No:* ${orderNumber}\n\n${orderLines.join('\n')}\n\n💰 *Total:* ₹${total}\n\nThank you for your order!`;

                let setData = {
                    message: messageText,
                    whatsappNumberId: user.whatsappNumberId,
                    whatsappAccountId: user.whatsappAccountId,
                    whatsappAcessToken: user.whatsappAcessToken,
                    contactId: message.contactId,
                    contactNumber: contactsData.mobileNoWithCode,
                    messageType: 'text',
                    createdby: user._id,
                    tempWhatsAppMessageId: replyMsg_id,
                }
                await templateHelper.sendMessage(setData)
                let updateOrder = {
                    orderStatus: "paid"
                }
                menuService.updateOrder(orderList[0]._id, updateOrder)


            } else if (template.name == 'order-confirmation') {
                console.log('order-confirmation template found')
                let setWhereObject = {
                    userId: new ObjectId(message.createdby),
                    contactId: new ObjectId(message.contactId),
                    orderStatus: "pending"
                }
                let orderList = await menuService.getOrders(setWhereObject)
                let contactsData = await contactsService.getById(message.contactId)
                let user = await userService.getUserDetails(message.createdby);
                let total = orderList[0].totalAmount;
                let amount = +total * 100; // Convert to rupees
                const options = {
                    amount: amount, // amount in paise
                    currency: "INR",
                    accept_partial: false,
                    reference_id: `txn_${Date.now()}`,
                    description: "Payment for your order",
                    customer: {
                        name: contactsData?.name ? contactsData.name : 'Customer',
                        email: 'growwupsCustomer@mailinator.com',
                        contact: contactsData?.mobileNoWithCode ? `+${contactsData.mobileNoWithCode}` : '0000000000',
                    },
                    notify: {
                        sms: true,
                        email: true
                    },
                    callback_url: `${process.env.FRONTEND_BASE_URL}/callback-payment`,
                    callback_method: "get"
                };
                console.log('order-confirmation template found', options)

                const razorpay = new Razorpay({
                    key_id: process.env.Key_Id,   // add in .env
                    key_secret: process.env.Key_secret
                });
                // console.log('order-confirmation template found', razorpay)

                try {
                    const link = await razorpay.paymentLink.create(options);
                    console.log('Payment link created:', link);

                    let setData = {
                        message: 'Please complete your payment using the button below',
                        whatsappNumberId: user.whatsappNumberId,
                        whatsappAccountId: user.whatsappAccountId,
                        whatsappAcessToken: user.whatsappAcessToken,
                        contactId: message.contactId,
                        contactNumber: contactsData.mobileNoWithCode,
                        messageType: 'curl_url',
                        createdby: user._id,
                        tempWhatsAppMessageId: replyMsg_id,
                        displayText: 'Pay Now',
                        ctaUrl: link.short_url
                    }
                    await templateHelper.sendMessage(setData)

                    let updateOrder = {
                        orderStatus: "send payment link",
                        paymentLink: link.short_url,
                        paymentLinkId: link.id
                    }
                    menuService.updateOrder(orderList[0]._id, updateOrder)
                } catch (error) {
                    console.error('Error creating payment link:', error);
                }

                // let setData = {

            }
        }
    }
    async checkChatbotByText(getData) {
        let setData = {
            userId: new ObjectId(getData.userId),
            text: getData.text
        }
        let getchatbot = await chatbotService.lastqr(setData)
        let chatbotData = await chatbotService.getchatbotAction(getchatbot?.chatbotId)

        if (chatbotData) {

            const match = getData.text.match(/table='(\d+)'/);
            console.log('match', match)
            let tableNumber
            if (match) {
                tableNumber = match[1]; // "001"

                console.log("Table Number:", tableNumber);
            } else {
                console.log("Table number not found.");
            }

            // console.log('actionData===>', actionData)
            let setData = {
                templateId: chatbotData.requestChatbotTemplateId.templateId,
                chatbotTemplateId: chatbotData.requestChatbotTemplateId._id,
                userId: getData.userId,
                contactId: getData.contactId,
                tableNumber: tableNumber ? tableNumber : 0,
                chatbotId: getchatbot.chatbotId
            }
            console.log('checkChatbotByText 01 ', setData)
            broadcastController.sendChatbotTemplate(setData)
        }
        //                 // console.log('chatbotData', chatbotData)
        //                 let chatbotTemplateId = chatbotData.requestChatbotTemplateId._id;
        //                 let templateId = chatbotData.requestChatbotTemplateId.templateId
        // console.log('getchatbot', getchatbot);

    }


}

module.exports = new Controller();
