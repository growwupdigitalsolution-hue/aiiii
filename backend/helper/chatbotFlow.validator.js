const MULTI_HANDLE_TYPES = ["trigger", "buttons"];
const TERMINAL_NODE_TYPES = ["last"];

function validateChatbotFlow({ name, nodes, edges }) {
    if (!name || !name.trim()) return "Chatbot name is required.";
    if (!Array.isArray(nodes) || nodes.length === 0)
        return "At least one node is required.";
    if (!Array.isArray(edges)) return "Edges must be an array.";

    const trigger = nodes.find((n) => n.type === "trigger");
    if (!trigger) return "A Trigger node is required.";

    const triggerButtons = trigger.data?.buttons || [];
    const validTriggerButtons = triggerButtons.filter((b) =>
        (b.text || b.label || "").trim()
    );
    if (validTriggerButtons.length < 1)
        return "Trigger must have at least 1 quick reply button.";
    if (triggerButtons.length > 2)
        return "Trigger can have a maximum of 2 quick reply buttons.";

    for (const n of nodes) {
        if (!n.id || !n.type)
            return "Each node must have an id and a type.";

        if (MULTI_HANDLE_TYPES.includes(n.type)) {
            const btns = n.data?.buttons || [];
            const valid = btns.filter((b) =>
                (b.text || b.label || "").trim()
            );
            if (valid.length < 1)
                return `"${n.data?.label || n.id}" must have at least 1 button.`;
            if (btns.length > 2)
                return `"${n.data?.label || n.id}" can have a maximum of 2 buttons.`;
        }

        if (n.type === "last") {
            if (!n.data?.button?.text?.trim())
                return `Last Node "${n.data?.label || n.id}" must have a button text.`;
            if (
                n.data.button.type === "website" &&
                !n.data.button.url?.trim()
            )
                return `Last Node "${n.data?.label || n.id}" requires a website URL.`;
            if (!["website", "normal"].includes(n.data.button.type))
                return `Last Node "${n.data?.label || n.id}" has an invalid button type.`;
        }
    }

    for (const e of edges) {
        if (!e.source || !e.target)
            return "Each edge must have a source and a target.";

        const src = nodes.find((n) => n.id === e.source);
        const tgt = nodes.find((n) => n.id === e.target);
        if (!src) return `Edge references unknown source "${e.source}".`;
        if (!tgt) return `Edge references unknown target "${e.target}".`;

        if (TERMINAL_NODE_TYPES.includes(src.type))
            return `"${src.data?.label || src.id}" is a Last Node and cannot connect to another node.`;

        if (src.type === "message" && !(src.data?.buttons?.length))
            return `Message-only node "${src.data?.label || src.id}" cannot connect to another node.`;

        if (MULTI_HANDLE_TYPES.includes(src.type)) {
            if (!e.sourceHandle)
                return `Edge from "${src.data?.label || src.id}" must specify sourceHandle.`;
            const valid = (src.data?.buttons || []).some(
                (b) => b.id === e.sourceHandle
            );
            if (!valid)
                return `Edge from "${src.data?.label || src.id}" uses invalid button handle "${e.sourceHandle}".`;
        }
    }

    return null;
}

module.exports = { validateChatbotFlow };