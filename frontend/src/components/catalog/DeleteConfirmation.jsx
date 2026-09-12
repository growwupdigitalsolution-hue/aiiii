import React from 'react';
import { AlertTriangle } from 'lucide-react';

const DeleteConfirmation = ({ isOpen, onClose, onConfirm, productName }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="delete-modal">
                <div className="delete-icon"><AlertTriangle size={24} /></div>
                <h3 className="delete-title">Delete Product?</h3>
                <p className="delete-text">
                    Are you sure you want to delete <strong>"{productName}"</strong>? This action cannot be undone.
                </p>
                <div className="delete-actions">
                    <button onClick={onClose} className="btn btn-secondary">Cancel</button>
                    <button onClick={onConfirm} className="btn btn-danger">Delete</button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmation;