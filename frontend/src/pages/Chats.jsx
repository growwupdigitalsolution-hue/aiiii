import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
    Search, Send, Loader2, MessageSquare, Phone, Video, Star, Archive,
    MoreVertical, Paperclip, Image as ImageIcon, MapPin, Smile, Mic, FileText
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import { useAuth } from "../context/AuthContext";
import { socket } from "../socket";
import { chatlist, getMessagesByContact, sendMessage } from "../api/chats";
import "./chats.css";

const PAGE_LIMIT = 10;

// TODO: agar backend files ka full URL nahi bhejta (sirf "/uploads/xxx" jaisa relative path),
// to yahan apna actual API/CDN base URL daal do.
const FILE_BASE_URL = "";
const buildFileUrl = (path) => {
    if (!path) return "";
    return /^https?:\/\//.test(path) ? path : `${FILE_BASE_URL}${path}`;
};

const STATUS_FILTERS = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "pending", label: "Pending" },
    { key: "inProgress", label: "In Progress" },
    { key: "closed", label: "Closed" },
];

const TICKET_STATUS_LABEL = {
    pending: "Pending",
    inProgress: "In Progress",
    closed: "Closed",
};

const QUICK_REPLIES = [
    "Thank you for contacting us!",
    "Let me check that for you.",
    "Your order is on the way!",
    "I'll escalate this to our team.",
];

export default function Chats() {
    const { user } = useAuth();

    const [contacts, setContacts] = useState([]);
    const [contactsLoading, setContactsLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [contactsError, setContactsError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedContact, setSelectedContact] = useState(null); // pura chat item store hoga

    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messagesError, setMessagesError] = useState("");

    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef(null);
    const sidebarListRef = useRef(null);
    const imageInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const skipRef = useRef(0); // ref me rakha taaki closure/dependency issues na ho
    const isFetchingRef = useRef(false);
    const prevKeyRef = useRef(null); // null = abhi tak koi load nahi hua (search + statusFilter combo)

    /* =========================================================
       1. Load contacts (reset = fresh load/search, false = append/scroll)
       ========================================================= */
    const loadContacts = useCallback(async (searchTerm = "", status = "all", reset = true) => {
        // Agar already ek call chal rahi hai aur ye bhi reset (fresh) request hai, to skip kar do
        if (reset && isFetchingRef.current) return;

        try {
            if (reset) {
                isFetchingRef.current = true;
                setContactsLoading(true);
                setContactsError("");
                skipRef.current = 0;
            } else {
                if (loadingMore || !hasMore) return;
                setLoadingMore(true);
            }

            const res = await chatlist({
                limit: PAGE_LIMIT,
                skip: skipRef.current,
                search: searchTerm,
                status,
            });

            const newItems = Array.isArray(res?.data) ? res.data : [];
            setContacts((prev) => (reset ? newItems : [...prev, ...newItems]));
            skipRef.current += newItems.length;
            setHasMore(
                typeof res?.hasMore === "boolean" ? res.hasMore : newItems.length === PAGE_LIMIT
            );
        } catch (err) {
            console.error("loadContacts failed:", err);
            setContactsError(err?.response?.data?.ErrorMessage || "Failed to load contacts");
            if (reset) setContacts([]);
            // Success nahi hua — isFetchingRef ko false hi rehne do taaki agla attempt (retry) ho sake
            if (reset) isFetchingRef.current = false;
            return;
        } finally {
            setContactsLoading(false);
            setLoadingMore(false);
        }

        // Data safal (chahe khaali array ho) mil gaya — ab dubara fresh-load call nahi hogi
        if (reset) isFetchingRef.current = false;
    }, [loadingMore, hasMore]);

    /* Combined: initial load (no debounce) + search/status-triggered load (debounced).
       YEH EK HI EFFECT HAI mount, search aur filter teeno handle karta hai —
       alag se koi doosra "mount par load" useEffect NAHI hona chahiye,
       warna call duplicate ho jaayegi. */
    useEffect(() => {
        const key = `${search}|${statusFilter}`;
        // StrictMode double-invoke: 2nd invocation par value same milegi -> yahin ruk jaayega
        if (prevKeyRef.current === key) return;

        const isFirstLoad = prevKeyRef.current === null;
        prevKeyRef.current = key;

        if (isFirstLoad) {
            loadContacts(search, statusFilter, true); // pehli load turant, bina debounce
            return;
        }

        const t = setTimeout(() => loadContacts(search, statusFilter, true), 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, statusFilter]);

    /* Scroll pagination — sidebar list ke neeche pahochte hi next page load */
    const handleSidebarScroll = () => {
        const el = sidebarListRef.current;
        if (!el || contactsLoading || loadingMore || !hasMore) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            loadContacts(search, statusFilter, false);
        }
    };

    /* =========================================================
       2. Load messages when a contact is selected
       ========================================================= */
    const loadMessages = useCallback(async (contactId) => {
        if (!contactId) return;
        try {
            setMessagesLoading(true);
            setMessagesError("");
            setMessages([]);
            const res = await getMessagesByContact(contactId, { limit: 100 });
            setMessages(Array.isArray(res?.data) ? res.data : []);

            // Header ke liye fresh contact info (group / ticket status / online) merge kar do
            if (res?.contact) {
                setSelectedContact((prev) =>
                    prev && prev.contactId === contactId
                        ? {
                            ...prev,
                            isOnline: res.contact.isOnline,
                            groupName: res.contact.group?.name ?? prev.groupName,
                            ticketStatus: res.contact.ticketStatus ?? prev.ticketStatus,
                        }
                        : prev
                );
            }
        } catch (err) {
            console.error("loadMessages failed:", err);
            setMessagesError(err?.response?.data?.ErrorMessage || "Failed to load messages");
        } finally {
            setMessagesLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!selectedContact?.contactId) {
            setMessages([]);
            return;
        }
        loadMessages(selectedContact.contactId);
    }, [selectedContact?.contactId, loadMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* =========================================================
       3. Socket
       ========================================================= */
    useEffect(() => {
        if (!socket) return;

        const onIncoming = (msg) => {
            if (!msg) return;

            const isForOpenChat =
                selectedContact?.contactId &&
                String(msg.contactId) === String(selectedContact.contactId);

            if (isForOpenChat) {
                setMessages((prev) => {
                    if (prev.some((m) => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
                // Customer ne abhi msg kiya hai -> 24hr window fresh, online dikhao
                setSelectedContact((prev) =>
                    prev && prev.contactId === msg.contactId ? { ...prev, isOnline: true } : prev
                );
            }

            setContacts((prev) => {
                const idx = prev.findIndex((c) => c.contactId === msg.contactId);
                if (idx === -1) return prev; // naya contact hai jo abhi loaded list me nahi — chhod do
                const updated = [...prev];
                updated[idx] = {
                    ...updated[idx],
                    isOnline: true,
                    lastMessage: {
                        ...updated[idx].lastMessage,
                        message: msg.message,
                        msgType: msg.msgType,
                        createdAt: msg.createdAt,
                        sendBy: msg.sendBy
                    },
                    unreadCount: isForOpenChat
                        ? updated[idx].unreadCount
                        : (updated[idx].unreadCount || 0) + 1
                };
                return updated.sort(
                    (a, b) =>
                        new Date(b.lastMessage?.createdAt || 0) -
                        new Date(a.lastMessage?.createdAt || 0)
                );
            });
        };

        const onSent = (msg) => {
            if (!msg) return;
            setMessages((prev) => {
                if (prev.some((m) => m._id === msg._id)) return prev;
                if (
                    selectedContact?.contactId &&
                    String(msg.contactId) === String(selectedContact.contactId)
                ) {
                    return [...prev, msg];
                }
                return prev;
            });
        };

        socket.on("message_received", onIncoming);
        socket.on("ticket_message_received", (ticket) => {
            if (ticket?.contactId) loadContacts(search, statusFilter, true);
        });
        socket.on("message_sent", onSent);

        return () => {
            socket.off("message_received", onIncoming);
            socket.off("ticket_message_received");
            socket.off("message_sent", onSent);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedContact?.contactId]);

    /* =========================================================
       4. Send message (text / image / document / location)
       ========================================================= */
    const appendOutgoing = (msg) => {
        if (!msg) return;
        setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
    };

    const handleSend = async () => {
        if (!selectedContact?.contactId || !draft.trim() || sending) return;
        const text = draft.trim();
        setDraft("");
        try {
            setSending(true);
            const res = await sendMessage({ contactId: selectedContact.contactId, message: text });
            appendOutgoing(res?.data);
        } catch (err) {
            console.error("sendMessage failed:", err);
            setDraft(text);
            setMessagesError(err?.response?.data?.ErrorMessage || "Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const handleSendFile = async (file, msgType) => {
        if (!selectedContact?.contactId || !file || sending) return;
        try {
            setSending(true);
            const res = await sendMessage({ contactId: selectedContact.contactId, msgType, file });
            appendOutgoing(res?.data);
        } catch (err) {
            console.error("sendMessage (file) failed:", err);
            setMessagesError(err?.response?.data?.ErrorMessage || "Failed to send file");
        } finally {
            setSending(false);
        }
    };

    const handleSendLocation = () => {
        if (!selectedContact?.contactId || sending) return;
        if (!navigator.geolocation) {
            setMessagesError("Location sharing is not supported on this device");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                try {
                    setSending(true);
                    const res = await sendMessage({
                        contactId: selectedContact.contactId,
                        msgType: "location",
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                    });
                    appendOutgoing(res?.data);
                } catch (err) {
                    console.error("sendMessage (location) failed:", err);
                    setMessagesError(err?.response?.data?.ErrorMessage || "Failed to send location");
                } finally {
                    setSending(false);
                }
            },
            () => setMessagesError("Couldn't get your current location"),
        );
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const openChat = (c) => {
        setSelectedContact(c);
        // local unread badge turant clear kar do (UX ke liye); backend mark-as-read alag call ho to yahan lagana
        setContacts((prev) =>
            prev.map((item) =>
                item.contactId === c.contactId ? { ...item, unreadCount: 0 } : item
            )
        );
    };

    const filteredCount = useMemo(() => contacts.length, [contacts]);

    /* =========================================================
       RENDER
       ========================================================= */
    return (
        <AppLayout title="Chats">
            <div className="chats-page">
                <aside className="chats-sidebar">
                    <div className="chats-search">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="chats-filters">
                        {STATUS_FILTERS.map((f) => (
                            <button
                                key={f.key}
                                className={`chats-filter-pill ${statusFilter === f.key ? "active" : ""}`}
                                onClick={() => setStatusFilter(f.key)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {contactsLoading && (
                        <div className="chats-empty">
                            <Loader2 className="spin" size={18} /> Loading contacts…
                        </div>
                    )}
                    {contactsError && !contactsLoading && (
                        <div className="chats-error">{contactsError}</div>
                    )}
                    {!contactsLoading && !contactsError && filteredCount === 0 && (
                        <div className="chats-empty">No contacts yet.</div>
                    )}

                    <ul
                        className="chats-list"
                        ref={sidebarListRef}
                        onScroll={handleSidebarScroll}
                    >
                        {contacts.map((c) => {
                            const info = c.contact || {};
                            const active = selectedContact?.contactId === c.contactId;
                            return (
                                <li
                                    key={c.contactId}
                                    className={`chats-item ${active ? "active" : ""}`}
                                    onClick={() => openChat(c)}
                                >
                                    <div className="chats-avatar-wrap">
                                        <div className="chats-avatar">
                                            {(info.name || "?").charAt(0).toUpperCase()}
                                        </div>
                                        <span className={`chats-status-dot ${c.isOnline ? "online" : "offline"}`} />
                                    </div>
                                    <div className="chats-item-body">
                                        <div className="chats-item-top">
                                            <span className="chats-item-name">
                                                {info.name || info.mobileNoWithCode || "Unknown"}
                                            </span>
                                            {c.lastMessage?.createdAt && (
                                                <span className="chats-item-time">
                                                    {new Date(c.lastMessage.createdAt).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                        <div className="chats-item-preview">
                                            {c.lastMessage?.message || info.mobileNoWithCode || "—"}
                                        </div>
                                        {(c.groupName || c.ticketStatus) && (
                                            <div className="chats-item-tags">
                                                {c.groupName && (
                                                    <span className="chats-tag chats-tag-group">{c.groupName}</span>
                                                )}
                                                {c.ticketStatus && (
                                                    <span className={`chats-tag chats-tag-status status-${c.ticketStatus}`}>
                                                        {TICKET_STATUS_LABEL[c.ticketStatus] || c.ticketStatus}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {c.unreadCount > 0 && (
                                        <span className="chats-badge">{c.unreadCount}</span>
                                    )}
                                </li>
                            );
                        })}

                        {loadingMore && (
                            <li className="chats-empty">
                                <Loader2 className="spin" size={16} /> Loading more…
                            </li>
                        )}
                    </ul>
                </aside>

                <section className="chats-window">
                    {!selectedContact ? (
                        <div className="chats-placeholder">
                            <MessageSquare size={42} />
                            <p>Select a contact to start chatting</p>
                        </div>
                    ) : (
                        <>
                            <header className="chats-header">
                                <div className="chats-avatar-wrap">
                                    <div className="chats-avatar">
                                        {(selectedContact.contact?.name || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <span className={`chats-status-dot ${selectedContact.isOnline ? "online" : "offline"}`} />
                                </div>
                                <div className="chats-header-info">
                                    <div className="chats-header-name">
                                        {selectedContact.contact?.name ||
                                            selectedContact.contact?.mobileNoWithCode}
                                    </div>
                                    <div className="chats-header-sub">
                                        <span className={selectedContact.isOnline ? "text-online" : "text-offline"}>
                                            {selectedContact.isOnline ? "Online" : "Offline"}
                                        </span>
                                        <span className="dot-sep">•</span>
                                        {selectedContact.contact?.mobileNoWithCode}
                                    </div>
                                    {(selectedContact.groupName || selectedContact.ticketStatus) && (
                                        <div className="chats-item-tags">
                                            {selectedContact.groupName && (
                                                <span className="chats-tag chats-tag-group">{selectedContact.groupName}</span>
                                            )}
                                            {selectedContact.ticketStatus && (
                                                <span className={`chats-tag chats-tag-status status-${selectedContact.ticketStatus}`}>
                                                    {TICKET_STATUS_LABEL[selectedContact.ticketStatus] || selectedContact.ticketStatus}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="chats-header-actions">
                                    <button title="Call">
                                        <Phone size={16} />
                                    </button>
                                    <button title="Video call">
                                        <Video size={16} />
                                    </button>
                                    <button title="Mark VIP">
                                        <Star size={16} />
                                    </button>
                                    <button title="Archive">
                                        <Archive size={16} />
                                    </button>
                                    <button title="More">
                                        <MoreVertical size={16} />
                                    </button>
                                </div>
                            </header>

                            <div className="chats-messages">
                                {messagesLoading && (
                                    <div className="chats-empty">
                                        <Loader2 className="spin" size={18} /> Loading messages…
                                    </div>
                                )}
                                {messagesError && <div className="chats-error">{messagesError}</div>}
                                {!messagesLoading && messages.length === 0 && !messagesError && (
                                    <div className="chats-empty">No messages yet.</div>
                                )}
                                {messages.map((m) => {
                                    const mine = m.sendBy === "system";
                                    return (
                                        <div key={m._id} className={`chats-bubble ${mine ? "mine" : "theirs"}`}>
                                            {m.msgType === "image" && m.msgfile && (
                                                <img
                                                    className="chats-bubble-image"
                                                    src={buildFileUrl(m.msgfile)}
                                                    alt={m.fileName || "image"}
                                                />
                                            )}
                                            {m.msgType === "document" && m.msgfile && (
                                                <a
                                                    className="chats-bubble-file"
                                                    href={buildFileUrl(m.msgfile)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <FileText size={16} />
                                                    {m.fileName || "Document"}
                                                </a>
                                            )}
                                            {m.msgType === "location" && m.templateSnapshot?.latitude && (
                                                <a
                                                    className="chats-bubble-file"
                                                    href={`https://www.google.com/maps?q=${m.templateSnapshot.latitude},${m.templateSnapshot.longitude}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <MapPin size={16} />
                                                    Shared location
                                                </a>
                                            )}
                                            {m.message && <div className="chats-bubble-text">{m.message}</div>}
                                            <div className="chats-bubble-time">
                                                {m.createdAt
                                                    ? new Date(m.createdAt).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    })
                                                    : ""}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="chats-quick-replies">
                                {QUICK_REPLIES.map((qr) => (
                                    <button key={qr} className="chats-quick-chip" onClick={() => setDraft(qr)}>
                                        {qr}
                                    </button>
                                ))}
                            </div>

                            <footer className="chats-composer">
                                <div className="chats-composer-tools">
                                    <button title="Emoji" type="button">
                                        <Smile size={18} />
                                    </button>
                                    <button title="Attach document" type="button" onClick={() => fileInputRef.current?.click()}>
                                        <Paperclip size={18} />
                                    </button>
                                    <button title="Send image" type="button" onClick={() => imageInputRef.current?.click()}>
                                        <ImageIcon size={18} />
                                    </button>
                                    <button title="Send location" type="button" onClick={handleSendLocation}>
                                        <MapPin size={18} />
                                    </button>
                                </div>

                                <textarea
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message…"
                                    rows={1}
                                />

                                <button title="Voice message" type="button" className="chats-mic">
                                    <Mic size={16} />
                                </button>

                                <button onClick={handleSend} disabled={sending || !draft.trim()} className="chats-send">
                                    {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                                </button>

                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleSendFile(file, "image");
                                        e.target.value = "";
                                    }}
                                />
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    hidden
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleSendFile(file, "document");
                                        e.target.value = "";
                                    }}
                                />
                            </footer>
                        </>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}