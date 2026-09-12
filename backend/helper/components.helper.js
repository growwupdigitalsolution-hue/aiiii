var { nanoid } = require('nanoid');

const buttonTemplateComponent = async (getData) => {
    try {
        const buttons = [];
        const buttonTypes = getData.buttonType || [];

        for (const type of buttonTypes) {
            switch (type) {
                case "quickReply":
                    (getData.quickReplies || []).forEach((item) => {
                        buttons.push({ type: "QUICK_REPLY", text: item.replyButton });
                    });
                    break;

                case "visitWebsite":
                    (getData.visitWebsiteButtons || []).forEach((item) => {
                        buttons.push({
                            type: "URL",
                            text: item.buttonText,
                            url: item.websiteUrl,
                        });
                    });
                    break;

                case "callPhoneNumber":
                    (getData.callPhoneNumberButtons || []).forEach((item) => {
                        buttons.push({
                            type: "PHONE_NUMBER",
                            text: item.buttonText,
                            phone_number: `${item.countryCode}${item.phoneNumber}`,
                        });
                    });
                    break;

                case "copyOfferCode":
                    (getData.copyOfferCodeButtons || []).forEach((item) => {
                        buttons.push({ type: "COPY_CODE", example: item.offerCode });
                    });
                    break;

                default:
                    console.warn(`Unknown button type: ${type}`);
            }
        }

        return buttons.length > 0 ? { type: "BUTTONS", buttons } : false;

    } catch (error) {
        console.error("Error processing button data:", error.message);
        return false;
    }
};

/**
 * Header component banata hai - agar dynamic header hai (media link ya text placeholder)
 */
const buildHeaderComponent = (getData) => {
    const headerType = (getData.headerType || '').toUpperCase();

    if (!headerType || headerType === 'NONE') return null;

    if (headerType === 'TEXT') {
        // Text header sirf tab component chahiye jab usme variable ho
        if (!getData.headerText) return null;
        return {
            type: 'header',
            parameters: [{ type: 'text', text: getData.headerText }]
        };
    }

    // IMAGE / VIDEO / DOCUMENT
    if (!getData.headerFile) return null;

    const mediaKey = headerType.toLowerCase(); // 'image' | 'video' | 'document'
    return {
        type: 'header',
        parameters: [{
            type: mediaKey,
            [mediaKey]: { link: getData.headerFile }
        }]
    };
};

/**
 * Body component banata hai - bodyVariables us contact ke liye resolve hui values hain
 * bodyVariables: ["Rahul", "ORD1234"]  -> {{1}}, {{2}} ki jagah
 */
const buildBodyComponent = (bodyVariables) => {
    if (!bodyVariables || bodyVariables.length === 0) return null;

    return {
        type: 'body',
        parameters: bodyVariables.map((value) => ({ type: 'text', text: String(value) }))
    };
};

/**
 * Button components banata hai. Har dynamic button (URL with variable, COPY_CODE) ke liye
 * alag component chahiye Meta ko, apne actual "index" (position) ke saath — ek combined
 * array me multiple codes daalna galat hai.
 */
const buildButtonComponents = (getData) => {
    const buttonComponents = [];
    const buttonTypes = getData.buttonType || [];
    let overallIndex = 0; // buttons ka overall position, template me jis order me bane the

    for (const type of buttonTypes) {
        switch (type) {
            case "quickReply":
                (getData.quickReplies || []).forEach(() => {
                    overallIndex++; // static button - Meta ko dynamic value nahi chahiye
                });
                break;

            case "visitWebsite":
                (getData.visitWebsiteButtons || []).forEach((item) => {
                    // Sirf tab component bhejo jab URL me dynamic part ho ({{1}})
                    if (item.isDynamic && item.dynamicValue) {
                        buttonComponents.push({
                            type: 'button',
                            sub_type: 'URL',
                            index: overallIndex,
                            parameters: [{ type: 'text', text: item.dynamicValue }]
                        });
                    }
                    overallIndex++;
                });
                break;

            case "callPhoneNumber":
                (getData.callPhoneNumberButtons || []).forEach(() => {
                    overallIndex++; // static
                });
                break;

            case "copyOfferCode":
                (getData.copyOfferCodeButtons || []).forEach((item) => {
                    buttonComponents.push({
                        type: 'button',
                        sub_type: 'COPY_CODE',
                        index: overallIndex,
                        parameters: [{ type: 'coupon_code', coupon_code: item.offerCode }]
                    });
                    overallIndex++;
                });
                break;

            default:
                console.warn(`Unknown button type: ${type}`);
        }
    }

    return buttonComponents;
};

/**
 * Ek contact ke liye final Meta "components" array banata hai
 * getData        -> local templateData (headerType, headerFile, buttonType, etc.)
 * bodyVariables   -> is specific contact ke liye resolved {{1}}, {{2}}... values
 */
const generateWhatsAppComponents = async (getData, bodyVariables = []) => {
    let components = [];

    const header = buildHeaderComponent(getData);
    if (header) components.push(header);

    const body = buildBodyComponent(bodyVariables);
    if (body) components.push(body);

    const buttonComponents = buildButtonComponents(getData);
    components.push(...buttonComponents);

    return components;
};

const generateInteractiveComponents = async (templateData) => {
    // ... (chatbot flow - abhi isko touch nahi kiya, chatbot design confirm hone ke baad update karenge)
};

const generateShortCode = (length) => {
    return nanoid(length);
};

module.exports = {
    buttonTemplateComponent,
    generateWhatsAppComponents,
    generateInteractiveComponents,
    generateShortCode
};