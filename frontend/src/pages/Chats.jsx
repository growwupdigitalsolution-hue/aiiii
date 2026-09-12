import { useCallback, useEffect, useRef, useState } from "react";
import {
    Search, Phone, Video, Star, Archive, MoreVertical, ArrowLeft,
    Smile, Paperclip, Image as ImageIcon, FileText, MapPin, Mic, Send, CheckCheck,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import { getThreads, getMessages, sendMessage } from "../api/chats";
import { formatRelativeTime, formatMessageTime, getInitials } from "../helper/chatHelpers";
import "./chats.css";

const FILTERS = ["All", "Unread", "VIP", "Complaints"];
const QUICK_REPLIES = [
    "Thank you for contacting us!",
    "Let me check that for you.",
    "Your order is on the way!",
    "I'll escalate this to our team.",
];
const MOBILE_BREAKPOINT = 760;

function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
    const [isMobile, setIsMobile] = useState(
        () => typeof window !== "undefined" && window.innerWidth <= breakpoint
    );
    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const handler = (e) => setIsMobile(e.matches);
        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
    }, [breakpoint]);
    return isMobile;
}

export default function Chats() {
    const isMobile = useIsMobile();

    const [threads, setThreads] = useState([]);
    const [threadsLoading, setThreadsLoading] = useState(true);
    const [threadsError, setThreadsError] = useState("");

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");
    const [selectedId, setSelectedId] = useState(null);

    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);

    const scrollRef = useRef(null);

    const fetchThreads = useCallback(async () => {
        setThreadsLoading(true);
        setThreadsError("");
        try {
            const { threads: data } = await getThreads();
            setThreads(Array.isArray(data) ? data : []);
        } catch (err) {
            setThreadsError(err.response?.data?.ErrorMessage || "Unable to load chats. Please try again.");
        } finally {
            setThreadsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchThreads();
    }, [fetchThreads]);

    const filteredThreads = threads.filter((t) => {
        const q = search.trim().toLowerCase();
        const matchesSearch = !q || t.name?.toLowerCase().includes(q) || t.lastMessage?.toLowerCase().includes(q);
        const matchesFilter =
            filter === "All" ||
            (filter === "Unread" && t.unreadCount > 0) ||
            (filter === "VIP" && t.tag === "VIP") ||
            (filter === "Complaints" && t.tag === "Complaint");
        return matchesSearch && matchesFilter;
    });

    const selectedThread = threads.find((t) => t._id === selectedId) || null;

    const openThread = async (thread) => {
        setSelectedId(thread._id);
        setMessagesLoading(true);
        try {
            const { messages: data } = await getMessages(thread._id);
            setMessages(Array.isArray(data) ? data : []);
        } catch {
            setMessages([]);
        } finally {
            setMessagesLoading(false);
        }
        // optimistic local "mark as read" — swap for a real API call once you have one
        setThreads((prev) => prev.map((t) => (t._id === thread._id ? { ...t, unreadCount: 0 } : t)));
    };

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        const text = draft.trim();
        if (!text || !selectedThread || sending) return;

        setSending(true);
        const optimistic = {
            _id: `temp-${Date.now()}`,
            sender: "agent",
            text,
            timestamp: new Date().toISOString(),
            status: "sent",
        };
        setMessages((prev) => [...prev, optimistic]);
        setDraft("");

        try {
            const saved = await sendMessage(selectedThread._id, text);
            setMessages((prev) => prev.map((m) => (m._id === optimistic._id ? saved || optimistic : m)));
            setThreads((prev) =>
                prev.map((t) =>
                    t._id === selectedThread._id
                        ? { ...t, lastMessage: text, lastMessageAt: optimistic.timestamp }
                        : t
                )
            );
        } catch {
            setMessages((prev) => prev.map((m) => (m._id === optimistic._id ? { ...m, status: "failed" } : m)));
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

    // mobile: only one pane visible at a time — list until a chat is opened,
    // then the full-screen conversation with a Back button (native app pattern)
    const showList = !isMobile || !selectedThread;
    const showConversation = !isMobile || Boolean(selectedThread);

    return (
        <AppLayout title="Chats">
            <div className="cht-shell">
                {showList && (
                    <div className="cht-list-pane">
                        <div className="cht-search">
                            <Search size={15} />
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="cht-filters">
                            {FILTERS.map((f) => (
                                <button
                                    type="button"
                                    key={f}
                                    className={`cht-filter-chip ${filter === f ? "cht-filter-chip--active" : ""}`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        <div className="cht-thread-list">
                            {threadsLoading ? (
                                <ThreadSkeleton />
                            ) : threadsError ? (
                                <div className="error-banner">{threadsError}</div>
                            ) : filteredThreads.length === 0 ? (
                                <div className="empty-state">No chats match here.</div>
                            ) : (
                                filteredThreads.map((t) => (
                                    <button
                                        type="button"
                                        key={t._id}
                                        className={`cht-thread ${selectedId === t._id ? "cht-thread--active" : ""}`}
                                        onClick={() => openThread(t)}
                                    >
                                        <div className="cht-avatar">
                                            {getInitials(t.name)}
                                            {t.online && <span className="cht-online-dot" />}
                                        </div>
                                        <div className="cht-thread-body">
                                            <div className="cht-thread-top">
                                                <span className="cht-thread-name">{t.name}</span>
                                                <span className="cht-thread-time">{formatRelativeTime(t.lastMessageAt)}</span>
                                            </div>
                                            <p className="cht-thread-preview">{t.lastMessage}</p>
                                            <div className="cht-thread-meta">
                                                {t.unreadCount > 0 && <span className="cht-unread-badge">{t.unreadCount}</span>}
                                                {t.tag && <span className={`cht-tag cht-tag--${t.tag.toLowerCase()}`}>{t.tag}</span>}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {showConversation && (
                    <div className="cht-convo-pane">
                        {!selectedThread ? (
                            <div className="cht-empty-convo">
                                <p>Select a conversation to start chatting.</p>
                            </div>
                        ) : (
                            <>
                                <div className="cht-convo-header">
                                    {isMobile && (
                                        <button type="button" className="cht-icon-btn" aria-label="Back" onClick={() => setSelectedId(null)}>
                                            <ArrowLeft size={18} />
                                        </button>
                                    )}
                                    <div className="cht-avatar cht-avatar--sm">{getInitials(selectedThread.name)}</div>
                                    <div className="cht-convo-header-info">
                                        <span className="cht-convo-name">{selectedThread.name}</span>
                                        <span className="cht-convo-status">
                                            {selectedThread.online ? "Online" : "Offline"}
                                            {selectedThread.phone ? ` · ${selectedThread.phone}` : ""}
                                        </span>
                                    </div>
                                    <div className="cht-convo-actions">
                                        <button type="button" className="cht-icon-btn" aria-label="Call"><Phone size={16} /></button>
                                        <button type="button" className="cht-icon-btn" aria-label="Video call"><Video size={16} /></button>
                                        <button type="button" className="cht-icon-btn cht-hide-narrow" aria-label="Star"><Star size={16} /></button>
                                        <button type="button" className="cht-icon-btn cht-hide-narrow" aria-label="Archive"><Archive size={16} /></button>
                                        <button type="button" className="cht-icon-btn" aria-label="More"><MoreVertical size={16} /></button>
                                    </div>
                                </div>

                                <div className="cht-messages" ref={scrollRef}>
                                    {messagesLoading ? (
                                        <div className="cht-messages-loading">Loading messages...</div>
                                    ) : messages.length === 0 ? (
                                        <div className="empty-state">No messages yet — say hello!</div>
                                    ) : (
                                        messages.map((m) => (
                                            <div
                                                key={m._id}
                                                className={`cht-msg-row ${m.sender === "agent" ? "cht-msg-row--out" : "cht-msg-row--in"}`}
                                            >
                                                {m.sender !== "agent" && (
                                                    <div className="cht-avatar cht-avatar--xs">{getInitials(selectedThread.name)}</div>
                                                )}
                                                <div className={`cht-bubble ${m.sender === "agent" ? "cht-bubble--out" : "cht-bubble--in"}`}>
                                                    <span>{m.text}</span>
                                                    <span className="cht-bubble-time">
                                                        {formatMessageTime(m.timestamp)}
                                                        {m.sender === "agent" && <CheckCheck size={13} />}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="cht-quick-replies">
                                    {QUICK_REPLIES.map((q) => (
                                        <button type="button" key={q} className="cht-quick-chip" onClick={() => setDraft(q)}>
                                            {q}
                                        </button>
                                    ))}
                                </div>

                                <div className="cht-input-bar">
                                    <button type="button" className="cht-icon-btn" aria-label="Emoji"><Smile size={18} /></button>
                                    <button type="button" className="cht-icon-btn cht-hide-narrow" aria-label="Attach"><Paperclip size={18} /></button>
                                    <button type="button" className="cht-icon-btn cht-hide-narrow" aria-label="Image"><ImageIcon size={18} /></button>
                                    <button type="button" className="cht-icon-btn cht-hide-narrow" aria-label="Document"><FileText size={18} /></button>
                                    <button type="button" className="cht-icon-btn cht-hide-narrow" aria-label="Location"><MapPin size={18} /></button>
                                    <button type="button" className="cht-icon-btn cht-show-narrow" aria-label="Attach"><Paperclip size={18} /></button>
                                    <input
                                        className="cht-input"
                                        type="text"
                                        placeholder="Type a message..."
                                        value={draft}
                                        onChange={(e) => setDraft(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                    />
                                    <button type="button" className="cht-icon-btn" aria-label="Voice message"><Mic size={18} /></button>
                                    <button
                                        type="button"
                                        className="cht-send-btn"
                                        aria-label="Send"
                                        onClick={handleSend}
                                        disabled={!draft.trim() || sending}
                                    >
                                        <Send size={17} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function ThreadSkeleton() {
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="cht-thread" style={{ cursor: "default" }}>
                    <div className="skeleton" style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0 }} />
                    <div className="cht-thread-body">
                        <div className="skeleton" style={{ width: "50%", height: 14, marginBottom: 8 }} />
                        <div className="skeleton" style={{ width: "80%", height: 12 }} />
                    </div>
                </div>
            ))}
        </>
    );
}