import { useCallback, useEffect, useState } from "react";
import { Bot, Plus, Play, MoreHorizontal, Pencil, RefreshCw } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Flowbuilder from "../pages/Flowbuilder";
import { getChatbotList } from "../api/chatbots";
import "./chatbots.css";

function BotToggle({ checked, onChange }) {
    return (
        <button
            type="button"
            className={`bot-toggle ${checked ? "bot-toggle--on" : ""}`}
            onClick={onChange}
            aria-pressed={checked}
        >
            <span className="bot-toggle__knob" />
        </button>
    );
}

function BotCard({ bot, onToggle, onEdit }) {
    return (
        <div className="bot-card">
            <div className="bot-card__header">
                <div className="bot-card__title-group">
                    <div className="bot-card__icon">
                        <Bot size={22} />
                    </div>

                    <div>
                        <div className="bot-card__name">{bot.name}</div>
                        <div className="bot-card__flows">
                            {bot.description || "No description"}
                        </div>
                    </div>
                </div>

                <BotToggle
                    checked={bot.status === "published"}
                    onChange={() => onToggle(bot._id)}
                />
            </div>

            <div className="bot-card__triggers">
                <div className="bot-card__triggers-label">STATUS</div>
                <div className="bot-card__triggers-value">
                    {bot.status === "published" ? "Published" : "Draft"}
                </div>
            </div>

            <div className="bot-card__footer">
                <span className="bot-card__edited">
                    {bot.updatedAt
                        ? `Edited ${new Date(bot.updatedAt).toLocaleString()}`
                        : "Just now"}
                </span>

                <div className="bot-card__actions">
                    <button
                        type="button"
                        className="bot-card__open-btn"
                        onClick={() => onEdit(bot._id)}
                    >
                        <Pencil size={13} />
                        Edit
                    </button>

                    <button
                        type="button"
                        className="bot-card__more-btn"
                        aria-label="More options"
                    >
                        <MoreHorizontal size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ChatbotsList() {
    const [bots, setBots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [builderOpen, setBuilderOpen] = useState(false);
    const [selectedChatbotId, setSelectedChatbotId] = useState(null);

    const fetchBots = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getChatbotList();
            setBots(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(
                e?.response?.data?.ErrorMessage ||
                "Unable to load chatbots. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBots();
    }, [fetchBots]);

    const handleToggle = async (id) => {
        // Optimistic toggle; replace with real API call when ready
        setBots((prev) =>
            prev.map((b) =>
                b._id === id
                    ? { ...b, status: b.status === "published" ? "draft" : "published" }
                    : b
            )
        );
    };

    /* ---- Create ---- */
    const handleCreateChatbot = () => {
        setSelectedChatbotId(null);
        setBuilderOpen(true);
    };

    /* ---- Edit ---- */
    const handleEditChatbot = (chatbotId) => {
        setSelectedChatbotId(chatbotId);
        setBuilderOpen(true);
    };

    /* ---- Close + refresh ---- */
    const handleCloseBuilder = async () => {
        setBuilderOpen(false);
        setSelectedChatbotId(null);
        // Refresh so name/description/status changes appear immediately
        await fetchBots();
    };

    return (
        <AppLayout title="Chatbots">
            {error && <div className="error-banner">{error}</div>}

            <div className="chatbots-page">
                <div className="chatbots-page__body">
                    <div className="chatbots-page__header">
                        <div>
                            <h2 className="chatbots-page__title">Chatbots</h2>
                            <p className="chatbots-page__subtitle">
                                Build and manage automated conversation flows
                            </p>
                        </div>

                        <div className="chatbots-page__header-actions">
                            <button
                                type="button"
                                className="chatbots-page__refresh-btn"
                                onClick={fetchBots}
                                disabled={loading}
                            >
                                <RefreshCw size={15} />
                                {loading ? "Loading…" : "Refresh"}
                            </button>

                            <button
                                type="button"
                                className="chatbots-page__create-btn"
                                onClick={handleCreateChatbot}
                            >
                                <Plus size={16} />
                                Create Chatbot
                            </button>
                        </div>
                    </div>

                    {loading && bots.length === 0 ? (
                        <div className="chatbots-page__empty">Loading chatbots…</div>
                    ) : bots.length === 0 ? (
                        <div className="chatbots-page__empty">
                            No chatbots yet. Click <strong>Create Chatbot</strong> to get started.
                        </div>
                    ) : (
                        <div className="chatbots-grid">
                            {bots.map((bot) => (
                                <BotCard
                                    key={bot._id}
                                    bot={bot}
                                    onToggle={handleToggle}
                                    onEdit={handleEditChatbot}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Flowbuilder
                open={builderOpen}
                onClose={handleCloseBuilder}
                chatbotId={selectedChatbotId} // null => Create, ID => Edit
            />
        </AppLayout>
    );
}