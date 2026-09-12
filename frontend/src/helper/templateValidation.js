// WhatsApp template conventions this validates against:
// - name: lowercase letters, numbers, underscores only
// - body: max 1024 chars
// - variables {{1}}, {{2}}... must be sequential starting at 1, no gaps, no repeats-out-of-order
// - header text: max 60 chars, at most one variable, must be {{1}}
// - footer: max 60 chars, no variables allowed
// - max 3 buttons total; only one PHONE_NUMBER button and one URL button allowed
// - a URL button may be "dynamic": the URL ends in exactly one {{1}} placeholder,
//   and needs an example value (Meta requires an example for every variable it approves)

export const CATEGORIES = ["MARKETING", "UTILITY", "AUTHENTICATION"];
export const STATUSES = ["APPROVED", "PENDING", "REJECTED"];

export const HEADER_TYPES = [
    { value: "NONE", label: "None" },
    { value: "TEXT", label: "Text" },
    { value: "IMAGE", label: "Image" },
    { value: "VIDEO", label: "Video" },
    { value: "DOCUMENT", label: "Document" },
];

export const BUTTON_TYPES = [
    { value: "QUICK_REPLY", label: "Quick Reply" },
    { value: "URL", label: "Website URL" },
    { value: "PHONE_NUMBER", label: "Call Phone Number" },
];

export const VARIABLE_TYPES = [
    { value: "TEXT", label: "Text" },
    { value: "NUMBER", label: "Number" },
    { value: "CURRENCY", label: "Currency" },
    { value: "DATE_TIME", label: "Date / Time" },
    { value: "EMAIL", label: "Email" },
    { value: "PHONE", label: "Phone Number" },
];

const NAME_PATTERN = /^[a-z0-9_]+$/;
const MAX_BODY_LEN = 1024;
const MAX_BUTTONS = 3;

export function extractVariables(text) {
    const matches = [...(text || "").matchAll(/\{\{(\d+)\}\}/g)];
    return matches.map((m) => Number(m[1]));
}

// unique, ascending — drives the "Variables" editor rows
export function extractUniqueVariables(text) {
    return [...new Set(extractVariables(text))].sort((a, b) => a - b);
}

export function validateTemplateName(name) {
    const trimmed = (name || "").trim();
    if (!trimmed) return "Template name is required";
    if (!NAME_PATTERN.test(trimmed)) return "Use lowercase letters, numbers and underscores only (e.g. order_confirmation)";
    if (trimmed.length > 512) return "Template name is too long";
    return "";
}

export function validateBody(body) {
    const trimmed = (body || "").trim();
    if (!trimmed) return "Message body is required";
    if (trimmed.length > MAX_BODY_LEN) return `Body must be under ${MAX_BODY_LEN} characters`;

    const vars = extractVariables(trimmed);
    if (vars.length > 0) {
        const unique = [...new Set(vars)].sort((a, b) => a - b);
        const expected = unique.map((_, i) => i + 1);
        const sequential = unique.every((v, i) => v === expected[i]);
        if (!sequential) {
            return "Variables must be numbered sequentially starting from {{1}} with no gaps";
        }
    }
    return "";
}

// bodyVariables: { [variableNumber]: { name, type, example } }
export function validateBodyVariables(variableNumbers, bodyVariables) {
    const errors = {};
    variableNumbers.forEach((n) => {
        const v = bodyVariables[n] || {};
        const err = {};
        if (!v.name?.trim()) err.name = "Required";
        if (!v.example?.trim()) err.example = "Required";
        if (Object.keys(err).length) errors[n] = err;
    });
    return errors;
}

// header: { type, text, example, mediaUrl }
// returns { text?, example?, media? } — empty object when everything's valid
export function validateHeader(header) {
    const errors = {};
    if (!header || header.type === "NONE") return errors;

    if (header.type === "TEXT") {
        const trimmed = (header.text || "").trim();
        if (!trimmed) {
            errors.text = "Header text is required";
        } else if (trimmed.length > 60) {
            errors.text = "Header must be under 60 characters";
        } else {
            const vars = extractVariables(trimmed);
            if (vars.length > 1) errors.text = "Header can contain at most one variable";
            else if (vars.length === 1 && vars[0] !== 1) errors.text = "Header variable must be {{1}}";
            else if (vars.length === 1 && !header.example?.trim()) errors.example = "Example value is required";
        }
        return errors;
    }

    // IMAGE / VIDEO / DOCUMENT — needs a public sample URL for Meta's review
    if (!header.mediaUrl?.trim()) {
        errors.media = `Please provide an example ${header.type.toLowerCase()} URL`;
    } else if (!/^https?:\/\/.+/.test(header.mediaUrl.trim())) {
        errors.media = "Must start with http:// or https://";
    }
    return errors;
}

// Footer is plain static text — WhatsApp doesn't allow variables in it at all.
export function validateFooter(footer) {
    const trimmed = (footer || "").trim();
    if (!trimmed) return "";
    if (trimmed.length > 60) return "Footer must be under 60 characters";
    if (/\{\{\d+\}\}/.test(trimmed)) return "Footer cannot contain variables";
    return "";
}

export function validateButtons(buttons) {
    const errors = [];
    if (buttons.length > MAX_BUTTONS) {
        errors.push(`No more than ${MAX_BUTTONS} buttons are allowed`);
    }

    const urlCount = buttons.filter((b) => b.type === "URL").length;
    const phoneCount = buttons.filter((b) => b.type === "PHONE_NUMBER").length;
    if (urlCount > 1) errors.push("Only one URL button is allowed");
    if (phoneCount > 1) errors.push("Only one phone number button is allowed");

    const perButtonErrors = buttons.map((b) => {
        const err = {};
        const maxLen = b.type === "QUICK_REPLY" ? 20 : 25;
        if (!b.text?.trim()) {
            err.text = "Button text is required";
        } else if (b.text.trim().length > maxLen) {
            err.text = `Max ${maxLen} characters`;
        }

        if (b.type === "URL") {
            const value = b.value?.trim() || "";
            if (!value) {
                err.value = "URL is required";
            } else if (b.dynamic) {
                const varMatches = [...value.matchAll(/\{\{(\d+)\}\}/g)];
                if (varMatches.length !== 1) {
                    err.value = "Dynamic URL must contain exactly one variable, e.g. {{1}}";
                } else if (varMatches[0][1] !== "1") {
                    err.value = "The URL variable must be numbered {{1}}";
                } else if (!value.endsWith("{{1}}")) {
                    err.value = "The {{1}} variable must be at the end of the URL";
                } else if (!/^https?:\/\/.+/.test(value)) {
                    err.value = "Must start with http:// or https://";
                }
                if (!err.value && !b.example?.trim()) {
                    err.example = "Example value is required for a dynamic URL";
                }
            } else if (!/^https?:\/\/.+/.test(value)) {
                err.value = "Must start with http:// or https://";
            } else if (/\{\{\d+\}\}/.test(value)) {
                err.value = "Turn on \"Dynamic URL\" to use a {{1}} variable here";
            }
        }

        if (b.type === "PHONE_NUMBER") {
            if (!b.value?.trim()) {
                err.value = "Phone number is required";
            } else if (!/^\+?[0-9]{7,15}$/.test(b.value.trim())) {
                err.value = "Enter a valid phone number (with country code)";
            }
        }

        return err;
    });

    return { formErrors: errors, buttonErrors: perButtonErrors };
}

export function renderPreviewBody(body, variableValues = {}) {
    return (body || "").replace(/\{\{(\d+)\}\}/g, (match, n) => variableValues[n] || match);
}

export function renderPreviewHeaderText(header, example) {
    if (!header?.text) return "";
    if (!/\{\{1\}\}/.test(header.text)) return header.text;
    return header.text.replace("{{1}}", example || "{{1}}");
}

export function renderPreviewUrl(button) {
    if (button.type !== "URL") return button.value;
    if (!button.dynamic) return button.value;
    return (button.value || "").replace("{{1}}", button.example || "{{1}}");
}