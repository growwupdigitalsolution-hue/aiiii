import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Handle,
    Position,
    addEdge,
    useEdgesState,
    useNodesState,
    ReactFlowProvider
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
    ArrowLeft,
    Zap,
    MessageSquare,
    GitBranch,
    Clock,
    Globe,
    MousePointerClick,
    UserRound,
    Webhook,
    Play,
    Save,
    Plus,
    X,
    Trash2,
    Flag,
    Link as LinkIcon,
    MousePointer,
    MoreVertical
} from "lucide-react";

import {
    createChatbot,
    updateChatbot,
    publishChatbot,
    getChatbotById
} from "../api/chatbots";
import useIsMobile from "../hooks/useIsMobile";

import "./Flowbuilder.css";

/* ------------------------------------------------------------------ */
/* Node type registry                                                  */
/* ------------------------------------------------------------------ */

const NODE_TYPES = {
    trigger: { label: "Trigger", color: "#16c784", icon: Zap },
    last: { label: "Last Node", color: "#0ea5e9", icon: Flag },
    message: { label: "Message", color: "#4285f4", icon: MessageSquare },
    condition: { label: "Condition", color: "#f59e0b", icon: GitBranch },
    delay: { label: "Delay", color: "#8b5cf6", icon: Clock },
    api: { label: "API Call", color: "#14b8a6", icon: Globe },
    buttons: { label: "Buttons", color: "#ec4899", icon: MousePointerClick },
    handover: { label: "Handover", color: "#ef4444", icon: UserRound },
    webhook: { label: "Webhook", color: "#6366f1", icon: Webhook }
};

const ENABLED_NODE_TYPES = ["trigger", "last"];
const MULTI_HANDLE_TYPES = ["trigger", "buttons"];
const TERMINAL_NODE_TYPES = ["last"];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const slugify = (text) =>
    (text || "").toString().trim().toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "option";

const detectVariables = (text) => {
    if (!text) return [];
    const matches = text.match(/\{\{\s*\d+\s*\}\}/g) || [];
    const seen = new Set();
    const out = [];
    matches.forEach((m) => {
        const key = m.replace(/\s+/g, "");
        if (!seen.has(key)) { seen.add(key); out.push(key); }
    });
    return out;
};

const syncVariables = (text, existing = []) => {
    const detected = detectVariables(text);
    const map = new Map(existing.map((v) => [v.name, v.value]));
    return detected.map((name) => ({ name, value: map.get(name) || "" }));
};

const resolveMessage = (data) => {
    const source = data?.message ?? data?.description ?? "";
    if (!source) return "";
    const map = new Map((data.variables || []).map((v) => [v.name, v.value]));
    return source.replace(/\{\{\s*\d+\s*\}\}/g, (m) => {
        const key = m.replace(/\s+/g, "");
        return map.get(key) ?? m;
    });
};

const uid = (prefix) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const defaultTriggerNode = () => ({
    id: "trigger-1",
    type: "trigger",
    position: { x: 220, y: 260 },
    data: {
        label: "User sends message",
        description: "When customer sends a message",
        buttons: [
            { id: "button-1", text: "A" },
            { id: "button-2", text: "B" }
        ],
        variables: []
    }
});

/* ------------------------------------------------------------------ */
/* Config Modal — Trigger / Buttons                                    */
/* ------------------------------------------------------------------ */

function NodeConfigModal({ node, onClose, onSave }) {
    const isTrigger = node.type === "trigger";
    const [message, setMessage] = useState(node.data.description || "");
    const [buttons, setButtons] = useState(
        node.data.buttons?.length
            ? node.data.buttons.map((b) => ({ id: b.id, text: b.text ?? b.label ?? "" }))
            : [{ id: "button-1", text: "" }]
    );
    const [variables, setVariables] = useState(
        syncVariables(node.data.description || "", node.data.variables || [])
    );
    const [error, setError] = useState("");

    useEffect(() => {
        setVariables((prev) => syncVariables(message, prev));
    }, [message]);

    const addButton = () => {
        if (buttons.length >= 2) { setError("Maximum 2 quick reply buttons allowed."); return; }
        setButtons([...buttons, { id: `button-${buttons.length + 1}`, text: "" }]);
        setError("");
    };
    const removeButton = (idx) => {
        if (buttons.length <= 1) { setError("At least 1 quick reply button is required."); return; }
        setButtons(buttons.filter((_, i) => i !== idx).map((b, i) => ({ ...b, id: `button-${i + 1}` })));
        setError("");
    };
    const updateButtonText = (idx, text) => {
        const next = [...buttons]; next[idx] = { ...next[idx], text }; setButtons(next);
    };
    const updateVariable = (name, value) => {
        setVariables((prev) => prev.map((v) => (v.name === name ? { ...v, value } : v)));
    };

    const handleSave = () => {
        const valid = buttons.filter((b) => b.text.trim());
        if (valid.length < 1) { setError("You must add at least 1 quick reply button with a label."); return; }
        if (buttons.length > 2) { setError("Maximum 2 quick reply buttons allowed."); return; }

        const normalized = buttons.filter((b) => b.text.trim()).map((b, i) => ({
            id: `button-${i + 1}`,
            text: b.text.trim(),
            value: slugify(b.text)
        }));

        onSave({ ...node.data, description: message, buttons: normalized, variables });
        onClose();
    };

    return (
        <div className="config-modal__overlay" onClick={onClose}>
            <div className="config-modal" onClick={(e) => e.stopPropagation()}>
                <div className="config-modal__header">
                    <h3>{isTrigger ? "Configure Trigger" : "Configure Quick Replies"}</h3>
                    <button onClick={onClose}><X size={18} /></button>
                </div>

                <div className="config-modal__body">
                    <label>Message</label>
                    <textarea rows={3} value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="e.g. Welcome to {{1}}, how are you {{2}}?" />

                    {variables.length > 0 && (
                        <div className="config-modal__section">
                            <div className="config-modal__section-head">
                                <span>Variables</span>
                                <span className="config-modal__count">{variables.length} detected</span>
                            </div>
                            {variables.map((v) => (
                                <div key={v.name} className="config-modal__variable-row">
                                    <span className="config-modal__variable-key">{v.name}</span>
                                    <span className="config-modal__variable-arrow">→</span>
                                    <input placeholder="Enter value" value={v.value}
                                        onChange={(e) => updateVariable(v.name, e.target.value)} />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="config-modal__section">
                        <div className="config-modal__section-head">
                            <span>Quick Reply Buttons ({buttons.length}/2)</span>
                            <button onClick={addButton} disabled={buttons.length >= 2}>
                                <Plus size={14} /> Add
                            </button>
                        </div>

                        {buttons.map((b, i) => (
                            <div key={b.id} className="config-modal__button-row">
                                <span className="config-modal__button-handle-tag">{b.id}</span>
                                <input placeholder={`Button ${i + 1} label`} value={b.text}
                                    onChange={(e) => updateButtonText(i, e.target.value)} />
                                <button onClick={() => removeButton(i)} disabled={buttons.length <= 1}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {error && <div className="config-modal__error">{error}</div>}
                </div>

                <div className="config-modal__footer">
                    <button onClick={onClose}>Cancel</button>
                    <button className="primary" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Config Modal — Last Node                                            */
/* ------------------------------------------------------------------ */

function LastNodeConfigModal({ node, onClose, onSave }) {
    const [message, setMessage] = useState(node.data.message || "");
    const [buttonText, setButtonText] = useState(node.data.button?.text || "Thank You");
    const [buttonType, setButtonType] = useState(node.data.button?.type || "normal");
    const [url, setUrl] = useState(node.data.button?.url || "");
    const [error, setError] = useState("");

    const handleSave = () => {
        if (!buttonText.trim()) { setError("Button text is required."); return; }
        if (buttonType === "website" && !url.trim()) { setError("Website URL is required when Button Type is Website."); return; }

        const button = { text: buttonText.trim(), type: buttonType };
        if (buttonType === "website") button.url = url.trim();

        onSave({ ...node.data, message, button });
        onClose();
    };

    return (
        <div className="config-modal__overlay" onClick={onClose}>
            <div className="config-modal" onClick={(e) => e.stopPropagation()}>
                <div className="config-modal__header">
                    <h3>Configure Last Node</h3>
                    <button onClick={onClose}><X size={18} /></button>
                </div>

                <div className="config-modal__body">
                    <label>Message</label>
                    <textarea rows={3} value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="e.g. Thank you for contacting us." />

                    <div className="config-modal__section">
                        <div className="config-modal__section-head"><span>Button</span></div>

                        <label>Button Text</label>
                        <input value={buttonText} onChange={(e) => setButtonText(e.target.value)}
                            placeholder="e.g. Visit Website" />

                        <label>Button Type</label>
                        <div className="config-modal__radio-group">
                            <label className={`config-modal__radio ${buttonType === "website" ? "is-active" : ""}`}>
                                <input type="radio" name="last-button-type" value="website"
                                    checked={buttonType === "website"}
                                    onChange={() => setButtonType("website")} />
                                <LinkIcon size={14} /> Website
                            </label>
                            <label className={`config-modal__radio ${buttonType === "normal" ? "is-active" : ""}`}>
                                <input type="radio" name="last-button-type" value="normal"
                                    checked={buttonType === "normal"}
                                    onChange={() => setButtonType("normal")} />
                                <MousePointer size={14} /> Normal Button
                            </label>
                        </div>

                        {buttonType === "website" && (
                            <>
                                <label>Website URL</label>
                                <input value={url} onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://example.com" />
                            </>
                        )}
                    </div>

                    {error && <div className="config-modal__error">{error}</div>}
                </div>

                <div className="config-modal__footer">
                    <button onClick={onClose}>Cancel</button>
                    <button className="primary" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Custom Node                                                         */
/* ------------------------------------------------------------------ */

function CustomNode({ data, type, selected, nodeIndex, isStart }) {
    const config = NODE_TYPES[type] || NODE_TYPES.message;
    const Icon = config.icon;

    const buttons = data.buttons || [];
    const isMultiHandle = MULTI_HANDLE_TYPES.includes(type);
    const isTerminal = TERMINAL_NODE_TYPES.includes(type);
    const isEnding = isTerminal || (type === "message" && buttons.length === 0);
    const headerTag = isStart ? "START NODE" : `NODE ${nodeIndex}`;

    return (
        <div className={`flow-node ${selected ? "flow-node--selected" : ""} ${isEnding ? "flow-node--ending" : ""} ${isStart ? "flow-node--start" : ""} ${isTerminal ? "flow-node--terminal" : ""}`}
            style={{ "--node-color": config.color }}>

            {!isStart && (<Handle type="target" position={Position.Left} className="flow-handle" />)}

            <div className="flow-node__header">
                <div className="flow-node__icon" style={{ backgroundColor: config.color }}>
                    <Icon size={16} />
                </div>
                <div className="flow-node__type">{isTerminal ? "LAST NODE" : config.label}</div>
                <span className={`flow-node__tag ${isStart ? "flow-node__tag--start" : ""}`}>
                    {headerTag}
                </span>
            </div>

            <div className="flow-node__title">{data.label}</div>

            {data.description && !isTerminal && (
                <div className="flow-node__description">{data.description}</div>
            )}

            {isTerminal && (
                <div className="flow-node__last-body">
                    {data.message && <div className="flow-node__description">{data.message}</div>}
                    {data.button && (
                        <div className="flow-node__button-row flow-node__button-row--last">
                            <span className="flow-node__button-label">{data.button.text}</span>
                            {data.button.type === "website" && (
                                <span className="flow-node__button-badge"><LinkIcon size={11} /></span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {isMultiHandle && buttons.length > 0 && (
                <div className="flow-node__buttons">
                    {buttons.map((b, i) => (
                        <div key={b.id || i} className="flow-node__button-row">
                            <span className="flow-node__button-label">{b.text || `Button ${i + 1}`}</span>
                            <Handle type="source" position={Position.Right}
                                id={b.id || `button-${i + 1}`}
                                className="flow-handle flow-handle--button" />
                        </div>
                    ))}
                </div>
            )}

            {!isMultiHandle && !isEnding && (
                <Handle type="source" position={Position.Right} className="flow-handle" />
            )}

            {isEnding && <span className="flow-node__end-badge">END</span>}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Inner Flow Builder                                                  */
/* ------------------------------------------------------------------ */

function FlowbuilderInner({
    open,
    onClose,
    chatbotId = null,
    onSaved = () => { }
}) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const [currentChatbotId, setCurrentChatbotId] = useState(chatbotId || null);
    const [status, setStatus] = useState("draft");

    const [selectedNode, setSelectedNode] = useState(null);
    const [configNode, setConfigNode] = useState(null);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [loadingExisting, setLoadingExisting] = useState(false);

    /* Mobile-only UI state */
    const isMobile = useIsMobile();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [addSheetOpen, setAddSheetOpen] = useState(false);
    const [mobileEditOpen, setMobileEditOpen] = useState(false);

    const lastLoadedRef = useRef(null);

    /* ---------- RESET / LOAD EFFECT ---------- */
    useEffect(() => {
        if (!open) return;

        const key = chatbotId || "__new__";
        if (lastLoadedRef.current === key) return;
        lastLoadedRef.current = key;

        /* Reset mobile UI state too */
        setMobileMenuOpen(false);
        setAddSheetOpen(false);
        setMobileEditOpen(false);

        if (!chatbotId) {
            setName("");
            setDescription("");
            setNodes([defaultTriggerNode()]);
            setEdges([]);
            setSelectedNode(null);
            setConfigNode(null);
            setCurrentChatbotId(null);
            setStatus("draft");
            return;
        }

        let cancelled = false;
        (async () => {
            setLoadingExisting(true);
            try {
                const data = await getChatbotById(chatbotId);
                if (cancelled || !data) return;

                setName(data.name || "");
                setDescription(data.description || "");
                setNodes(Array.isArray(data.nodes) ? data.nodes : []);
                setEdges(Array.isArray(data.edges) ? data.edges : []);
                setStatus(data.status || "draft");
                setCurrentChatbotId(data._id || chatbotId);
                setSelectedNode(null);
                setConfigNode(null);
            } catch (e) {
                console.error("Failed to load chatbot", e);
                alert("Failed to load chatbot. Please try again.");
            } finally {
                if (!cancelled) setLoadingExisting(false);
            }
        })();

        return () => { cancelled = true; };
    }, [open, chatbotId, setNodes, setEdges]);

    /* ---------- Start node + index map ---------- */
    const { nodeIndexMap, startNodeId } = useMemo(() => {
        const map = {};
        if (nodes.length === 0) return { nodeIndexMap: map, startNodeId: null };

        const incoming = new Set(edges.map((e) => e.target));
        let root = nodes.find((n) => !incoming.has(n.id));
        if (!root) root = nodes[0];

        map[root.id] = 0;

        const queue = [root.id];
        const visited = new Set([root.id]);
        let counter = 2;

        while (queue.length) {
            const current = queue.shift();
            const outgoing = edges.filter((e) => e.source === current).map((e) => e.target);
            for (const target of outgoing) {
                if (visited.has(target)) continue;
                visited.add(target);
                map[target] = counter++;
                queue.push(target);
            }
        }

        nodes.forEach((n) => { if (!(n.id in map)) map[n.id] = counter++; });
        return { nodeIndexMap: map, startNodeId: root.id };
    }, [nodes, edges]);

    const nodeTypes = useMemo(() => {
        const make = (type) => (props) => (
            <CustomNode {...props} type={type}
                nodeIndex={nodeIndexMap[props.id]}
                isStart={props.id === startNodeId} />
        );
        return {
            trigger: make("trigger"), last: make("last"), message: make("message"),
            condition: make("condition"), delay: make("delay"), api: make("api"),
            buttons: make("buttons"), handover: make("handover"), webhook: make("webhook")
        };
    }, [nodeIndexMap, startNodeId]);

    /* Strip outgoing edges from terminal nodes */
    useEffect(() => {
        const terminalIds = nodes.filter(
            (n) => TERMINAL_NODE_TYPES.includes(n.type) ||
                (n.type === "message" && !(n.data?.buttons?.length))
        ).map((n) => n.id);
        if (!terminalIds.length) return;
        setEdges((curr) => curr.filter((e) => !terminalIds.includes(e.source)));
    }, [nodes, setEdges]);

    /* Remove edges whose sourceHandle no longer exists */
    useEffect(() => {
        const valid = new Set();
        nodes.forEach((n) => {
            if (MULTI_HANDLE_TYPES.includes(n.type)) {
                (n.data?.buttons || []).forEach((b) => valid.add(`${n.id}::${b.id}`));
            } else if (!TERMINAL_NODE_TYPES.includes(n.type)) {
                valid.add(`${n.id}::__default__`);
            }
        });
        setEdges((curr) => curr.filter((e) => {
            const key = `${e.source}::${e.sourceHandle || "__default__"}`;
            return valid.has(key);
        }));
    }, [nodes, setEdges]);

    const onConnect = useCallback((params) => {
        const sourceNode = nodes.find((n) => n.id === params.source);

        if (sourceNode && TERMINAL_NODE_TYPES.includes(sourceNode.type)) {
            alert("Last Node is an ending node and cannot connect to another node.");
            return;
        }
        if (sourceNode && sourceNode.type === "message" && !(sourceNode.data?.buttons?.length)) {
            alert("Message-only nodes are ending nodes. Use a Buttons/Quick Reply node to continue the flow.");
            return;
        }

        setEdges((currentEdges) => {
            const filtered = currentEdges.filter(
                (e) => !(e.source === params.source &&
                    (e.sourceHandle || null) === (params.sourceHandle || null))
            );

            let label = "";
            if (sourceNode && MULTI_HANDLE_TYPES.includes(sourceNode.type)) {
                const btn = (sourceNode.data?.buttons || []).find((b) => b.id === params.sourceHandle);
                if (btn) label = btn.text;
            }
            return addEdge({ ...params, animated: true, label }, filtered);
        });
    }, [nodes, setEdges]);

    const handleNodeClick = useCallback((event, node) => {
        event.stopPropagation();
        setSelectedNode(node);
        if (MULTI_HANDLE_TYPES.includes(node.type) || node.type === "last") {
            setConfigNode(node);
        } else if (isMobile) {
            setMobileEditOpen(true);
        }
    }, [isMobile]);

    const handlePaneClick = useCallback(() => setSelectedNode(null), []);

    const addNode = (type) => {
        if (!ENABLED_NODE_TYPES.includes(type)) return;
        const isMulti = MULTI_HANDLE_TYPES.includes(type);
        const isLast = type === "last";

        const newNode = {
            id: uid(type),
            type,
            position: { x: 300 + Math.random() * 500, y: 150 + Math.random() * 400 },
            data: isLast
                ? {
                    label: "Thank You", message: "Thank you for contacting us.",
                    button: { text: "Thank You", type: "normal" }
                }
                : {
                    label: getDefaultLabel(type), description: getDefaultDescription(type),
                    ...(isMulti ? { buttons: [{ id: "button-1", text: "Option 1" }], variables: [] } : {})
                }
        };
        setNodes((curr) => [...curr, newNode]);
    };

    const deleteSelectedNode = () => {
        if (!selectedNode) return;
        setNodes((curr) => curr.filter((n) => n.id !== selectedNode.id));
        setEdges((curr) => curr.filter(
            (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
        ));
        setSelectedNode(null);
    };

    const handleConfigSave = (updatedData) => {
        setNodes((curr) => curr.map((n) =>
            n.id === configNode.id ? { ...n, data: updatedData } : n
        ));
        setSelectedNode((cur) => cur && cur.id === configNode.id
            ? { ...cur, data: updatedData } : cur);
    };

    const validateFlow = () => {
        if (!name || !name.trim()) return "Chatbot name is required.";
        const trigger = nodes.find((n) => n.type === "trigger");
        if (!trigger) return "A Trigger node is required.";

        const triggerButtons = trigger.data?.buttons || [];
        const validTriggerButtons = triggerButtons.filter((b) => (b.text ?? b.label)?.trim());
        if (validTriggerButtons.length < 1) return "Trigger must have at least 1 quick reply button.";
        if (triggerButtons.length > 2) return "Trigger can have a maximum of 2 quick reply buttons.";

        for (const n of nodes) {
            if (MULTI_HANDLE_TYPES.includes(n.type)) {
                const btns = n.data.buttons || [];
                const valid = btns.filter((b) => (b.text ?? b.label)?.trim());
                if (valid.length < 1) return `"${n.data.label}" (${n.type}) must have at least 1 quick reply button.`;
                if (btns.length > 2) return `"${n.data.label}" (${n.type}) can have a maximum of 2 buttons.`;
            }
            if (n.type === "last") {
                if (!n.data?.button?.text?.trim()) return `Last Node "${n.data.label}" must have a button text.`;
                if (n.data.button.type === "website" && !n.data.button.url?.trim())
                    return `Last Node "${n.data.label}" requires a website URL.`;
            }
        }

        for (const edge of edges) {
            const src = nodes.find((n) => n.id === edge.source);
            if (!src) continue;
            if (TERMINAL_NODE_TYPES.includes(src.type))
                return `"${src.data.label}" is a Last Node and cannot connect to another node.`;
            if (src.type === "message" && !(src.data?.buttons?.length))
                return `Message-only node "${src.data.label}" cannot connect to another node.`;
            if (MULTI_HANDLE_TYPES.includes(src.type) && edge.sourceHandle) {
                const validHandle = (src.data.buttons || []).some((b) => b.id === edge.sourceHandle);
                if (!validHandle) return `Edge from "${src.data.label}" uses invalid button handle "${edge.sourceHandle}".`;
            }
        }
        return null;
    };

    const buildPayload = (overrideStatus) => ({
        name: name.trim(),
        description: description.trim(),
        nodes: nodes.map((n) => ({
            id: n.id, type: n.type, position: n.position,
            data: { ...n.data, resolvedMessage: resolveMessage(n.data) }
        })),
        edges: edges.map((e) => ({
            id: e.id, source: e.source,
            sourceHandle: e.sourceHandle || null,
            target: e.target, label: e.label || null
        })),
        status: overrideStatus || status
    });

    const saveFlow = async () => {
        const err = validateFlow();
        if (err) { alert("Validation failed: " + err); return; }

        setSaving(true);
        try {
            const payload = buildPayload("draft");
            let saved;
            if (currentChatbotId) {
                saved = await updateChatbot(currentChatbotId, payload);
            } else {
                saved = await createChatbot(payload);
                if (saved?._id) setCurrentChatbotId(saved._id);
            }
            alert("Chatbot saved successfully");
            onSaved(saved);
        } catch (e) {
            const backendMsg = e?.response?.data?.ErrorMessage || e?.message || "Failed to save chatbot";
            alert("Failed to save chatbot: " + backendMsg);
        } finally {
            setSaving(false);
        }
    };

    const publishFlow = async () => {
        const err = validateFlow();
        if (err) { alert("Cannot publish: " + err); return; }
        if (!currentChatbotId) { alert("Please save the chatbot before publishing."); return; }

        setPublishing(true);
        try {
            await publishChatbot(currentChatbotId);
            setStatus("published");
            alert("Chatbot published successfully");
        } catch (e) {
            const backendMsg = e?.response?.data?.ErrorMessage || e?.message || "Failed to publish chatbot";
            alert("Cannot publish: " + backendMsg);
        } finally {
            setPublishing(false);
        }
    };

    if (!open) return null;

    return (
        <div className="flowbuilder">
            {/* ================= Desktop header ================= */}
            {!isMobile && (
                <div className="flowbuilder__topbar">
                    <div className="flowbuilder__brand">
                        <button className="flowbuilder__back" onClick={onClose}>
                            <ArrowLeft size={18} /> Back
                        </button>

                        <div className="flowbuilder__divider" />

                        <div className="flowbuilder__meta">
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="flowbuilder__name"
                                placeholder={currentChatbotId ? "Chatbot name" : "Enter chatbot name"}
                            />
                            <input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="flowbuilder__description"
                                placeholder="Short description (optional)"
                            />
                        </div>

                        <span className="flowbuilder__status">
                            {status === "published" ? "Published" : "Active"}
                        </span>
                    </div>

                    <div className="flowbuilder__actions">
                        <button className="flowbuilder__button" onClick={saveFlow}
                            disabled={saving || loadingExisting}>
                            <Save size={16} /> {saving ? "Saving…" : "Save"}
                        </button>

                        <button className="flowbuilder__button flowbuilder__test">
                            <Play size={16} /> Test Bot
                        </button>

                        <button className="flowbuilder__publish" onClick={publishFlow}
                            disabled={publishing || loadingExisting}>
                            <Play size={16} /> {publishing ? "Publishing…" : "Publish"}
                        </button>

                        <button className="flowbuilder__close" onClick={onClose}>
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* ================= Mobile header ================= */}
            {isMobile && (
                <div className="flowbuilder__topbar flowbuilder__topbar--mobile">
                    <button className="flowbuilder__icon-btn" onClick={onClose}>
                        <ArrowLeft size={22} />
                    </button>

                    <div className="flowbuilder__mobile-meta">
                        <input
                            className="flowbuilder__mobile-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Chatbot name"
                        />
                        <input
                            className="flowbuilder__mobile-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Short description"
                        />
                    </div>

                    <button
                        className="flowbuilder__icon-btn"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <MoreVertical size={22} />
                    </button>
                </div>
            )}

            {/* ================= Desktop toolbar ================= */}
            {!isMobile && (
                <div className="flowbuilder__toolbar">
                    {ENABLED_NODE_TYPES.map((type) => {
                        const config = NODE_TYPES[type];
                        if (!config) return null;
                        const Icon = config.icon;
                        return (
                            <button key={type} className="node-tool"
                                style={{ "--tool-color": config.color }}
                                onClick={() => addNode(type)}>
                                <Icon size={15} /> {config.label}
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="flowbuilder__canvas">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={handleNodeClick}
                    onPaneClick={handlePaneClick}
                    nodeTypes={nodeTypes}
                    fitView
                    snapToGrid
                    snapGrid={[15, 15]}
                    deleteKeyCode={null}
                    defaultEdgeOptions={{ type: "smoothstep", animated: true }}>
                    <Background gap={24} size={1} color="#d9e1eb" />
                    <Controls />
                    <MiniMap nodeColor={(node) => NODE_TYPES[node.type]?.color || "#94a3b8"} />
                </ReactFlow>

                {/* Mobile floating Add Node button */}
                {isMobile && (
                    <button className="flowbuilder__fab" onClick={() => setAddSheetOpen(true)}>
                        <Plus size={20} /> Add Node
                    </button>
                )}

                {/* Desktop side panel */}
                {!isMobile && selectedNode && (
                    <div className="node-settings">
                        <div className="node-settings__header">
                            <div>
                                <span className="node-settings__small">{NODE_TYPES[selectedNode.type]?.label}</span>
                                <h3>{selectedNode.data.label}</h3>
                            </div>
                            <button onClick={() => setSelectedNode(null)}><X size={17} /></button>
                        </div>

                        <div className="node-settings__body">
                            <label>Node Name</label>
                            <input value={selectedNode.data.label}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setNodes((curr) => curr.map((n) =>
                                        n.id === selectedNode.id ? { ...n, data: { ...n.data, label: value } } : n
                                    ));
                                    setSelectedNode((cur) => ({ ...cur, data: { ...cur.data, label: value } }));
                                }} />

                            {selectedNode.type !== "last" && (
                                <>
                                    <label>Description</label>
                                    <textarea value={selectedNode.data.description || ""}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setNodes((curr) => curr.map((n) =>
                                                n.id === selectedNode.id
                                                    ? {
                                                        ...n, data: {
                                                            ...n.data, description: value,
                                                            variables: syncVariables(value, n.data.variables || [])
                                                        }
                                                    }
                                                    : n
                                            ));
                                            setSelectedNode((cur) => ({
                                                ...cur,
                                                data: {
                                                    ...cur.data, description: value,
                                                    variables: syncVariables(value, cur.data.variables || [])
                                                }
                                            }));
                                        }} />
                                </>
                            )}

                            {(MULTI_HANDLE_TYPES.includes(selectedNode.type) || selectedNode.type === "last") && (
                                <button className="configure-node" onClick={() => setConfigNode(selectedNode)}>
                                    <MousePointerClick size={16} />
                                    {selectedNode.type === "last" ? "Configure Last Node" : "Configure Quick Replies"}
                                </button>
                            )}

                            <button className="delete-node" onClick={deleteSelectedNode}>
                                <Trash2 size={16} /> Delete Node
                            </button>
                        </div>
                    </div>
                )}

                {/* Existing config modals (auto-render as bottom sheet on mobile via CSS) */}
                {configNode && configNode.type === "last" && (
                    <LastNodeConfigModal node={configNode}
                        onClose={() => setConfigNode(null)}
                        onSave={handleConfigSave} />
                )}

                {configNode && configNode.type !== "last" && (
                    <NodeConfigModal node={configNode}
                        onClose={() => setConfigNode(null)}
                        onSave={handleConfigSave} />
                )}

                {/* ================= Mobile bottom sheets ================= */}
                {isMobile && mobileMenuOpen && (
                    <div className="mobile-sheet__overlay" onClick={() => setMobileMenuOpen(false)}>
                        <div className="mobile-sheet mobile-sheet--menu" onClick={(e) => e.stopPropagation()}>
                            <div className="mobile-sheet__handle" />

                            <button className="mobile-sheet__item"
                                onClick={() => { setMobileMenuOpen(false); saveFlow(); }}
                                disabled={saving || loadingExisting}>
                                <Save size={18} />
                                {saving ? "Saving…" : "Save"}
                            </button>

                            <button className="mobile-sheet__item"
                                onClick={() => setMobileMenuOpen(false)}>
                                <Play size={18} /> Test Bot
                            </button>

                            <button className="mobile-sheet__item mobile-sheet__item--primary"
                                onClick={() => { setMobileMenuOpen(false); publishFlow(); }}
                                disabled={publishing || loadingExisting}>
                                <Play size={18} />
                                {publishing ? "Publishing…" : "Publish"}
                            </button>
                        </div>
                    </div>
                )}

                {isMobile && addSheetOpen && (
                    <div className="mobile-sheet__overlay" onClick={() => setAddSheetOpen(false)}>
                        <div className="mobile-sheet" onClick={(e) => e.stopPropagation()}>
                            <div className="mobile-sheet__handle" />
                            <div className="mobile-sheet__title">Add Node</div>

                            {ENABLED_NODE_TYPES.map((type) => {
                                const config = NODE_TYPES[type];
                                if (!config) return null;
                                const Icon = config.icon;
                                return (
                                    <button key={type} className="mobile-sheet__item"
                                        style={{ "--tool-color": config.color }}
                                        onClick={() => { addNode(type); setAddSheetOpen(false); }}>
                                        <Icon size={18} /> {config.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {isMobile && mobileEditOpen && selectedNode && (
                    <div className="mobile-sheet__overlay"
                        onClick={() => { setMobileEditOpen(false); setSelectedNode(null); }}>
                        <div className="mobile-sheet mobile-sheet--edit" onClick={(e) => e.stopPropagation()}>
                            <div className="mobile-sheet__handle" />
                            <div className="mobile-sheet__title">
                                Edit {NODE_TYPES[selectedNode.type]?.label}
                            </div>

                            <label className="mobile-sheet__label">Node Name</label>
                            <input className="mobile-sheet__input"
                                value={selectedNode.data.label}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setNodes((curr) => curr.map((n) =>
                                        n.id === selectedNode.id ? { ...n, data: { ...n.data, label: value } } : n
                                    ));
                                    setSelectedNode((cur) => ({ ...cur, data: { ...cur.data, label: value } }));
                                }} />

                            {selectedNode.type !== "last" && (
                                <>
                                    <label className="mobile-sheet__label">Description</label>
                                    <textarea className="mobile-sheet__textarea"
                                        value={selectedNode.data.description || ""}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setNodes((curr) => curr.map((n) =>
                                                n.id === selectedNode.id
                                                    ? {
                                                        ...n, data: {
                                                            ...n.data, description: value,
                                                            variables: syncVariables(value, n.data.variables || [])
                                                        }
                                                    }
                                                    : n
                                            ));
                                            setSelectedNode((cur) => ({
                                                ...cur,
                                                data: {
                                                    ...cur.data, description: value,
                                                    variables: syncVariables(value, cur.data.variables || [])
                                                }
                                            }));
                                        }} />
                                </>
                            )}

                            <button className="mobile-sheet__item mobile-sheet__item--danger"
                                onClick={() => { deleteSelectedNode(); setMobileEditOpen(false); }}>
                                <Trash2 size={18} /> Delete Node
                            </button>

                            <div className="mobile-sheet__footer">
                                <button className="mobile-sheet__btn mobile-sheet__btn--ghost"
                                    onClick={() => { setMobileEditOpen(false); setSelectedNode(null); }}>
                                    Cancel
                                </button>
                                <button className="mobile-sheet__btn mobile-sheet__btn--primary"
                                    onClick={() => { setMobileEditOpen(false); setSelectedNode(null); }}>
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Flowbuilder(props) {
    return (
        <ReactFlowProvider>
            <FlowbuilderInner {...props} />
        </ReactFlowProvider>
    );
}

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

function getDefaultLabel(type) {
    return {
        trigger: "User sends message", last: "Thank You", message: "Send Message",
        condition: "Check Condition", delay: "Wait", api: "API Request",
        buttons: "Show Buttons", handover: "Assign to Agent", webhook: "Webhook"
    }[type];
}

function getDefaultDescription(type) {
    return {
        trigger: "When customer sends a message", last: "Thank you for contacting us.",
        message: "Enter your message", condition: "Check customer response",
        delay: "Wait before next action", api: "GET /api/example",
        buttons: "How can we help you?", handover: "Transfer conversation",
        webhook: "Webhook endpoint"
    }[type];
}