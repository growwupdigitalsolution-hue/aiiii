import { useEffect, useRef, useState, useCallback } from "react";
import { Search, Send, Loader2, MessageSquare, User } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import { useAuth } from "../context/AuthContext";
import { socket } from "../socket";
import {
    listContacts,
    getMessagesByContact,
    sendMessage,
} from "../api/chats";
import "./chats.css";

export default function Chats() {
    const { user } = useAuth();

    const [contacts, setContacts] = useState([]);
    const [contactsLoading, setContactsLoading] = useState(true);
    const [contactsError, setContactsError] = useState("");

    const [search, setSearch] = useState("");
    const [selectedContact, setSelectedContact] = useState(null);

    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messagesError, setMessagesError] = useState("");

    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef(null);

    /* =========================================================
       1. Load contacts once
       ========================================================= */
    const loadContacts = useCallback(async (searchTerm = "") => {
        try {
            setContactsLoading(true);
            setContactsError("");
            const res = await listContacts({ limit: 100, search: searchTerm });
            setContacts(Array.isArray(res?.data) ? res.data : []);
        } catch (err) {
            console.error("loadContacts failed:", err);
            setContactsError(
                err?.response?.data?.ErrorMessage || "Failed to load contacts"
            );
            setContacts([]);
        } finally {
            setContactsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadContacts();
    }, [loadContacts]);

    /* Debounced search */
    useEffect(() => {
        const t = setTimeout(() => loadContacts(search), 350);
        return () => clearTimeout(t);
    }, [search, loadContacts]);

    /* =========================================================
       2. Load messages when a contact is selected
       ========================================================= */
    const loadMessages = useCallback(async (contactId) => {
        if (!contactId) return;
        try {
            setMessagesLoading(true);
            setMessagesError("");
            setMessages([]);       // clear immediately to prevent stale flash
            const res = await getMessagesByContact(contactId, { limit: 100 });
            setMessages(Array.isArray(res?.data) ? res.data : []);
        } catch (err) {
            console.error("loadMessages failed:", err);
            setMessagesError(
                err?.response?.data?.ErrorMessage || "Failed to load messages"
            );
        } finally {
            setMessagesLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!selectedContact?._id) {
            setMessages([]);
            return;
        }
        loadMessages(selectedContact._id);
    }, [selectedContact?._id, loadMessages]);

    /* =========================================================
       3. Auto-scroll to bottom when messages change
       ========================================================= */
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    /* =========================================================
       4. Socket — incoming messages / sent confirmations
       ========================================================= */
    useEffect(() => {
        if (!socket) return;

        const onIncoming = (msg) => {
            if (!msg) return;

            // Is this message for the currently open conversation?
            const isForOpenChat =
                selectedContact?._id &&
                String(msg.contactId) === String(selectedContact._id);

            if (isForOpenChat) {
                setMessages((prev) => {
                    // prevent duplicates by _id
                    if (prev.some((m) => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
            }

            // Update contacts preview + move to top
            setContacts((prev) => {
                const idx = prev.findIndex((c) => c._id === msg.contactId);
                if (idx === -1) return prev;
                const updated = [...prev];
                updated[idx] = {
                    ...updated[idx],
                    lastMessage: {
                        message: msg.message,
                        createdAt: msg.createdAt,
                        sendBy: msg.sendBy,
                    },
                    lastMessageAt: msg.createdAt,
                };
                return updated.sort(
                    (a, b) =>
                        new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)
                );
            });
        };

        const onSent = (msg) => {
            if (!msg) return;
            setMessages((prev) => {
                if (prev.some((m) => m._id === msg._id)) return prev;
                if (
                    selectedContact?._id &&
                    String(msg.contactId) === String(selectedContact._id)
                ) {
                    return [...prev, msg];
                }
                return prev;
            });
        };

        socket.on("message_received", onIncoming);
        socket.on("ticket_message_received", (ticket) => {
            // Optional: refresh contacts when a new ticket comes in
            if (ticket?.contactId) {
                loadContacts();
            }
        });
        socket.on("message_sent", onSent);

        return () => {
            socket.off("message_received", onIncoming);
            socket.off("ticket_message_received");
            socket.off("message_sent", onSent);
        };
    }, [selectedContact?._id, loadContacts]);

    /* =========================================================
       5. Send a message
       ========================================================= */
    const handleSend = async () => {
        if (!selectedContact?._id || !draft.trim() || sending) return;
        const text = draft.trim();
        setDraft("");
        try {
            setSending(true);
            const res = await sendMessage({
                contactId: selectedContact._id,
                message: text,
            });
            if (res?.data) {
                setMessages((prev) => {
                    if (prev.some((m) => m._id === res.data._id)) return prev;
                    return [...prev, res.data];
                });
            }
        } catch (err) {
            console.error("sendMessage failed:", err);
            setDraft(text); // restore
            setMessagesError(
                err?.response?.data?.ErrorMessage || "Failed to send message"
            );
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    /* =========================================================
       RENDER
       ========================================================= */
    return (
        <AppLayout title="Chats">
            <div className="chats-page">
                {/* LEFT — Contact list */}
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

                    {contactsLoading && (
                        <div className="chats-empty">
                            <Loader2 className="spin" size={18} /> Loading contacts…
                        </div>
                    )}
                    {contactsError && !contactsLoading && (
                        <div className="chats-error">{contactsError}</div>
                    )}
                    {!contactsLoading && !contactsError && contacts.length === 0 && (
                        <div className="chats-empty">No contacts yet.</div>
                    )}

                    <ul className="chats-list">
                        {contacts.map((c) => {
                            const active = selectedContact?._id === c._id;
                            return (
                                <li
                                    key={c._id}
                                    className={`chats-item ${active ? "active" : ""}`}
                                    onClick={() => setSelectedContact(c)}
                                >
                                    <div className="chats-avatar">
                                        {(c.name || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <div className="chats-item-body">
                                        <div className="chats-item-top">
                                            <span className="chats-item-name">
                                                {c.name || c.mobileNoWithCode || "Unknown"}
                                            </span>
                                            {c.lastMessageAt && (
                                                <span className="chats-item-time">
                                                    {new Date(c.lastMessageAt).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                        <div className="chats-item-preview">
                                            {c.lastMessage?.message || c.mobileNoWithCode || "—"}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </aside>

                {/* RIGHT — Chat window */}
                <section className="chats-window">
                    {!selectedContact ? (
                        <div className="chats-placeholder">
                            <MessageSquare size={42} />
                            <p>Select a contact to start chatting</p>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <header className="chats-header">
                                <div className="chats-avatar">
                                    {(selectedContact.name || "?").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="chats-header-name">
                                        {selectedContact.name || selectedContact.mobileNoWithCode}
                                    </div>
                                    <div className="chats-header-sub">
                                        {selectedContact.mobileNoWithCode}
                                    </div>
                                </div>
                            </header>

                            {/* Messages */}
                            <div className="chats-messages">
                                {messagesLoading && (
                                    <div className="chats-empty">
                                        <Loader2 className="spin" size={18} /> Loading messages…
                                    </div>
                                )}
                                {messagesError && (
                                    <div className="chats-error">{messagesError}</div>
                                )}
                                {!messagesLoading && messages.length === 0 && !messagesError && (
                                    <div className="chats-empty">No messages yet.</div>
                                )}

                                {messages.map((m) => {
                                    const mine = m.sendBy === "system";
                                    return (
                                        <div
                                            key={m._id}
                                            className={`chats-bubble ${mine ? "mine" : "theirs"}`}
                                        >
                                            <div className="chats-bubble-text">{m.message}</div>
                                            <div className="chats-bubble-time">
                                                {m.createdAt
                                                    ? new Date(m.createdAt).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })
                                                    : ""}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Composer */}
                            <footer className="chats-composer">
                                <textarea
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message…"
                                    rows={1}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={sending || !draft.trim()}
                                    className="chats-send"
                                >
                                    {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                                </button>
                            </footer>
                        </>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}