import { useCallback, useEffect, useState } from "react";
import { Users, Pencil, Trash2, Upload, Download, Plus, Search } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import NewGroupModal from "../model/Newgroupmodal";
import AddContactModal from "../model/Addcontactmodal";
import { getGroups, deleteGroup } from "../api/groups";
import { getContacts, deleteContact } from "../api/contacts";
import "./groupManagement.css";

export default function GroupManagement() {
    const [tab, setTab] = useState("groups"); // "groups" | "contacts"

    const [groups, setGroups] = useState([]);
    const [groupsLoading, setGroupsLoading] = useState(true);

    const [contacts, setContacts] = useState([]);
    const [contactsLoading, setContactsLoading] = useState(true);
    const [contactSearch, setContactSearch] = useState("");

    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [addContactOpen, setAddContactOpen] = useState(false);
    const [toast, setToast] = useState(null); // { type: "success" | "error", message }

    // Groups list is needed on mount regardless of tab — the Add Contact modal's
    // group dropdown needs it even while sitting on the Contacts tab.
    const fetchGroups = useCallback(async () => {
        setGroupsLoading(true);
        setError("");
        try {
            const { groups: data } = await getGroups();
            setGroups(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.response?.data?.ErrorMessage || "Unable to load groups. Please try again.");
        } finally {
            setGroupsLoading(false);
        }
    }, []);

    const fetchContacts = useCallback(async () => {
        setContactsLoading(true);
        setError("");
        try {
            const { contacts: data } = await getContacts();
            setContacts(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.response?.data?.ErrorMessage || "Unable to load contacts. Please try again.");
        } finally {
            setContactsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    useEffect(() => {
        if (tab === "contacts") fetchContacts();
    }, [tab, fetchContacts]);

    // toast 3 second baad apne aap gayab ho jaye
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    const groupNameById = groups.reduce((map, g) => {
        map[g._id] = g.name;
        return map;
    }, {});

    const resolveGroupName = (contact) => {
        // groupId may arrive populated ({_id, name, ...}) or as a plain id string —
        // handle both since the controller shape wasn't available to confirm.
        if (contact.groupId && typeof contact.groupId === "object") return contact.groupId.name || "—";
        if (contact.group?.name) return contact.group.name;
        return groupNameById[contact.groupId] || "—";
    };

    const filteredContacts = contacts.filter((c) => {
        if (!contactSearch.trim()) return true;
        const q = contactSearch.trim().toLowerCase();
        return (
            c.name?.toLowerCase().includes(q) ||
            c.mobileNoWithCode?.toLowerCase().includes(q) ||
            c.mobileNo?.toLowerCase().includes(q)
        );
    });

    const handleDeleteGroup = async (groupId, groupName) => {
        if (!window.confirm(`Delete "${groupName}"? This cannot be undone.`)) return;
        setDeletingId(groupId);
        setError("");
        try {
            await deleteGroup(groupId);
            await fetchGroups();
            setToast({ type: "success", message: `"${groupName}" deleted successfully` });
        } catch (err) {
            const msg = err.response?.data?.ErrorMessage || "Could not delete group. Please try again.";
            setError(msg);
            setToast({ type: "error", message: msg });
        } finally {
            setDeletingId(null);
        }
    };

    const handleDeleteContact = async (contactId, contactName) => {
        if (!window.confirm(`Delete "${contactName}"? This cannot be undone.`)) return;
        setDeletingId(contactId);
        setError("");
        try {
            await deleteContact(contactId);
            await fetchContacts();
            setToast({ type: "success", message: `"${contactName}" deleted successfully` });
        } catch (err) {
            const msg = err.response?.data?.ErrorMessage || "Could not delete contact. Please try again.";
            setError(msg);
            setToast({ type: "error", message: msg });
        } finally {
            setDeletingId(null);
        }
    };

    const openCreateModal = () => {
        setEditingGroup(null);
        setModalOpen(true);
    };

    const openEditModal = (group) => {
        setEditingGroup(group);
        setModalOpen(true);
    };

    const handleGroupSaved = async (savedGroup, mode) => {
        setError("");
        await fetchGroups();
        setToast({
            type: "success",
            message: mode === "edit" ? "Group updated successfully" : "Group created successfully",
        });
    };

    const handleContactsSaved = async () => {
        setError("");
        await fetchContacts();
        await fetchGroups(); // totalContact counts on group cards likely changed too
        setToast({ type: "success", message: "Contacts saved successfully" });
    };

    return (
        <AppLayout title="Group Management">
            <div className="gm-toolbar">
                <div className="gm-tabs">
                    <button
                        className={`gm-tab ${tab === "groups" ? "gm-tab--active" : ""}`}
                        onClick={() => setTab("groups")}
                    >
                        Groups
                    </button>
                    <button
                        className={`gm-tab ${tab === "contacts" ? "gm-tab--active" : ""}`}
                        onClick={() => setTab("contacts")}
                    >
                        Contacts
                    </button>
                </div>

                {tab === "groups" ? (
                    <div className="gm-actions">
                        {/* <button className="gm-btn gm-btn--ghost">
                            <Upload size={15} />
                            <span>Import</span>
                        </button>
                        <button className="gm-btn gm-btn--ghost">
                            <Download size={15} />
                            <span>Export</span>
                        </button> */}
                        <button className="gm-btn gm-btn--primary" onClick={openCreateModal}>
                            <Plus size={16} />
                            <span>New Group</span>
                        </button>
                    </div>
                ) : (
                    <div className="gm-actions">
                        {/* <button className="gm-btn gm-btn--ghost">
                            <Upload size={15} />
                            <span>Import</span>
                        </button>
                        <button className="gm-btn gm-btn--ghost">
                            <Download size={15} />
                            <span>Export</span>
                        </button> */}
                        <button className="gm-btn gm-btn--primary" onClick={() => setAddContactOpen(true)}>
                            <Plus size={16} />
                            <span>Add Contact</span>
                        </button>
                    </div>
                )}
            </div>

            {error && <div className="error-banner">{error}</div>}

            {tab === "groups" ? (
                groupsLoading ? (
                    <GroupGridSkeleton />
                ) : groups.length === 0 ? (
                    <div className="empty-state">No groups yet — create your first one to get started.</div>
                ) : (
                    <div className="gm-grid">
                        {groups.map((group) => (
                            <div className="gm-card card" key={group._id}>
                                <div className="gm-card__top">
                                    <div className="gm-card__icon">
                                        <Users size={20} />
                                    </div>
                                    <div className="gm-card__row-actions">
                                        <button
                                            className="gm-icon-btn"
                                            aria-label={`Edit ${group.name}`}
                                            onClick={() => openEditModal(group)}
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            className="gm-icon-btn gm-icon-btn--danger"
                                            aria-label={`Delete ${group.name}`}
                                            onClick={() => handleDeleteGroup(group._id, group.name)}
                                            disabled={deletingId === group._id}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="gm-card__name">{group.name}</div>
                                <div className="gm-card__count">{(group.totalContact ?? 0).toLocaleString()}</div>
                                <div className="gm-card__label">contacts</div>

                                {group.description && (
                                    <div className="gm-card__desc">{group.description}</div>
                                )}
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <div className="gm-contacts">
                    <div className="gm-contacts__header">
                        <h3 className="gm-contacts__title">Contacts</h3>
                        <div className="gm-search">
                            <Search size={15} />
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                value={contactSearch}
                                onChange={(e) => setContactSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {contactsLoading ? (
                        <div className="empty-state">Loading contacts…</div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="empty-state">
                            {contactSearch ? "No contacts match your search." : "No contacts yet — add your first one."}
                        </div>
                    ) : (
                        <div className="gm-table-wrap">
                            <table className="gm-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Phone</th>
                                        <th>Group</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredContacts.map((c) => (
                                        <tr key={c._id}>
                                            <td className="gm-table__name">{c.contact.name}</td>
                                            <td>{c.contact.mobileNoWithCode || `${c.contact.mobileCode} ${c.contact.mobileNo}`}</td>
                                            <td>{resolveGroupName(c)}</td>
                                            <td>
                                                <div className="gm-card__row-actions">
                                                    {/* <button className="gm-icon-btn" aria-label={`Edit ${c.contact.name}`}>
                                                        <Pencil size={14} />
                                                    </button> */}
                                                    <button
                                                        className="gm-icon-btn gm-icon-btn--danger"
                                                        aria-label={`Delete ${c.contact.name}`}
                                                        onClick={() => handleDeleteContact(c._id, c.contact.name)}
                                                        disabled={deletingId === c._id}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Mobile: primary action floats within thumb reach, above the bottom tab bar */}
            <button
                className="gm-fab"
                aria-label={tab === "groups" ? "New Group" : "Add Contact"}
                onClick={tab === "groups" ? openCreateModal : () => setAddContactOpen(true)}
            >
                <Plus size={22} />
            </button>

            <NewGroupModal
                open={modalOpen}
                group={editingGroup}
                onClose={() => setModalOpen(false)}
                onSaved={handleGroupSaved}
            />

            <AddContactModal
                open={addContactOpen}
                groups={groups}
                onClose={() => setAddContactOpen(false)}
                onSaved={handleContactsSaved}
            />

            {toast && (
                <div className={`gm-toast gm-toast--${toast.type}`} role="status">
                    {toast.message}
                </div>
            )}
        </AppLayout>
    );
}

function GroupGridSkeleton() {
    return (
        <div className="gm-grid">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card gm-card">
                    <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 14 }} />
                    <div className="skeleton" style={{ width: "70%", height: 16, marginBottom: 10 }} />
                    <div className="skeleton" style={{ width: "40%", height: 24, marginBottom: 8 }} />
                    <div className="skeleton" style={{ width: "30%", height: 12 }} />
                </div>
            ))}
        </div>
    );
}