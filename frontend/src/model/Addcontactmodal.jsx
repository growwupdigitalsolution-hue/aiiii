import { useEffect, useRef, useState } from "react";
import { X, Plus, MinusCircle, Loader2, Download } from "lucide-react";
import { COUNTRIES, getFlagEmoji } from "../constants/countries";
import { isValidMobileNumber } from "../helper/mobile.validate";
import { createContactsManual, bulkUploadContacts } from "../api/contacts";
import "./addContactModal.css";

const emptyRow = () => ({ name: "", mobileCode: "+91", mobileNo: "" });

/**
 * open: boolean
 * groups: [{ _id, name }] - for the group dropdown
 * onClose: () => void
 * onSaved: () => void - called after either manual or bulk save succeeds, so parent can refetch
 */
export default function AddContactModal({ open, groups = [], onClose, onSaved }) {
    const [groupId, setGroupId] = useState("");
    const [rows, setRows] = useState([emptyRow()]);
    const [rowErrors, setRowErrors] = useState([]);
    const [groupError, setGroupError] = useState("");
    const [manualError, setManualError] = useState("");
    const [manualSubmitting, setManualSubmitting] = useState(false);

    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState("");
    const [bulkSubmitting, setBulkSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (open) {
            setGroupId(groups[0]?._id || "");
            setRows([emptyRow()]);
            setRowErrors([]);
            setGroupError("");
            setManualError("");
            setFile(null);
            setFileError("");
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }, [open, groups]);

    useEffect(() => {
        if (!open) return;
        const handleKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, onClose]);

    if (!open) return null;

    const updateRow = (index, field, value) => {
        setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
    };

    const addRow = () => setRows((prev) => [...prev, emptyRow()]);

    const removeRow = (index) => {
        setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
    };

    const validateManual = () => {
        let ok = true;
        const nextErrors = rows.map((row) => {
            const err = {};
            if (!row.name.trim()) {
                err.name = "Required";
                ok = false;
            }
            if (!row.mobileNo.trim() || !isValidMobileNumber(row.mobileCode, row.mobileNo)) {
                err.mobileNo = "Enter a valid number";
                ok = false;
            }
            return err;
        });
        setRowErrors(nextErrors);

        if (!groupId) {
            setGroupError("Please select a group");
            ok = false;
        } else {
            setGroupError("");
        }

        return ok;
    };

    const handleManualSave = async (e) => {
        e.preventDefault();
        setManualError("");
        if (!validateManual()) return;

        setManualSubmitting(true);
        try {
            await createContactsManual({
                groupId,
                contacts: rows.map((r) => ({
                    name: r.name.trim(),
                    mobileCode: r.mobileCode,
                    mobileNo: r.mobileNo.trim(),
                })),
            });
            onSaved?.();
            onClose();
        } catch (err) {
            setManualError(err.response?.data?.ErrorMessage || "Could not save contacts. Please try again.");
        } finally {
            setManualSubmitting(false);
        }
    };

    const handleDownloadSample = () => {
        const csv = "name,mobileCode,mobileNo\nJohn Doe,+91,9876543210\nJane Smith,+91,9123456780\n";
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "contacts-sample.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleBulkSave = async (e) => {
        e.preventDefault();
        setFileError("");

        if (!groupId) {
            setGroupError("Please select a group");
            return;
        }
        setGroupError("");

        if (!file) {
            setFileError("Please choose a file to upload");
            return;
        }

        setBulkSubmitting(true);
        try {
            await bulkUploadContacts({ groupId, file });
            onSaved?.();
            onClose();
        } catch (err) {
            setFileError(err.response?.data?.ErrorMessage || "Could not upload file. Please try again.");
        } finally {
            setBulkSubmitting(false);
        }
    };

    return (
        <div className="acm-backdrop" onClick={onClose}>
            <div
                className="acm-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-contact-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="acm-header">
                    <h2 id="add-contact-title" className="acm-title">Add Contact</h2>
                    <button className="acm-close-btn" onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <div className="acm-body">
                    {/* Group applies to both manual rows and the bulk file, since every contact
                        must belong to a group (groupContacts join table) */}
                    <label className="acm-label" htmlFor="acm-group">Group</label>
                    <select
                        id="acm-group"
                        className={`acm-input ${groupError ? "acm-input--error" : ""}`}
                        value={groupId}
                        onChange={(e) => setGroupId(e.target.value)}
                    >
                        <option value="" disabled>Select a group</option>
                        {groups.map((g) => (
                            <option key={g._id} value={g._id}>{g.name}</option>
                        ))}
                    </select>
                    {groupError && <p className="acm-field-error">{groupError}</p>}
                    {groups.length === 0 && (
                        <p className="acm-hint">No groups yet — create a group first before adding contacts.</p>
                    )}

                    <div className="acm-panels">
                        {/* --- Add Manually --- */}
                        <form className="acm-panel" onSubmit={handleManualSave}>
                            <h3 className="acm-panel-title">Add Manually</h3>

                            {manualError && <div className="error-banner">{manualError}</div>}

                            {rows.map((row, i) => (
                                <div className="acm-row" key={i}>
                                    <div className="acm-row-fields">
                                        <div className="acm-field">
                                            <input
                                                className={`acm-input ${rowErrors[i]?.name ? "acm-input--error" : ""}`}
                                                type="text"
                                                placeholder="Contact Name *"
                                                value={row.name}
                                                onChange={(e) => updateRow(i, "name", e.target.value)}
                                                disabled={manualSubmitting}
                                            />
                                            {rowErrors[i]?.name && <p className="acm-field-error">{rowErrors[i].name}</p>}
                                        </div>

                                        <div className="acm-field acm-field--mobile">
                                            <div className="acm-mobile-row">
                                                <select
                                                    className="acm-input acm-code-select"
                                                    value={row.mobileCode}
                                                    onChange={(e) => updateRow(i, "mobileCode", e.target.value)}
                                                    disabled={manualSubmitting}
                                                >
                                                    {COUNTRIES.map((c) => (
                                                        <option key={c.iso2} value={c.dialCode}>
                                                            {getFlagEmoji(c.iso2)} {c.dialCode}
                                                        </option>
                                                    ))}
                                                </select>
                                                <input
                                                    className={`acm-input ${rowErrors[i]?.mobileNo ? "acm-input--error" : ""}`}
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="Mobile Number *"
                                                    value={row.mobileNo}
                                                    onChange={(e) => updateRow(i, "mobileNo", e.target.value.replace(/[^0-9]/g, ""))}
                                                    disabled={manualSubmitting}
                                                />
                                            </div>
                                            {rowErrors[i]?.mobileNo && <p className="acm-field-error">{rowErrors[i].mobileNo}</p>}
                                        </div>
                                    </div>

                                    <div className="acm-row-btn">
                                        {i === rows.length - 1 ? (
                                            <button type="button" className="acm-row-icon acm-row-icon--add" onClick={addRow} aria-label="Add row" disabled={manualSubmitting}>
                                                <Plus size={18} />
                                            </button>
                                        ) : (
                                            <button type="button" className="acm-row-icon acm-row-icon--remove" onClick={() => removeRow(i)} aria-label="Remove row" disabled={manualSubmitting}>
                                                <MinusCircle size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <button type="submit" className="acm-save-btn" disabled={manualSubmitting}>
                                {manualSubmitting ? <Loader2 size={16} className="spin" /> : "Save"}
                            </button>
                        </form>

                        {/* --- Bulk Upload --- */}
                        <form className="acm-panel acm-panel--bulk" onSubmit={handleBulkSave}>
                            <h3 className="acm-panel-title">Bulk Upload</h3>

                            <button type="button" className="acm-sample-link" onClick={handleDownloadSample}>
                                <Download size={14} />
                                Download Sample file
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                className="acm-file-input"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                disabled={bulkSubmitting}
                            />
                            {file && <p className="acm-file-name">{file.name}</p>}
                            {fileError && <p className="acm-field-error">{fileError}</p>}

                            <button type="submit" className="acm-save-btn" disabled={bulkSubmitting}>
                                {bulkSubmitting ? <Loader2 size={16} className="spin" /> : "Save"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}