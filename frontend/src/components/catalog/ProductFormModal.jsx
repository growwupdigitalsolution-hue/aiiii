import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ProductFormModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [form, setForm] = useState({
        name: '', sku: '', category: 'Clothing', price: '', stock: '', status: 'Active', description: ''
    });

    useEffect(() => {
        if (initialData) setForm(initialData);
        else setForm({ name: '', sku: '', category: 'Clothing', price: '', stock: '', status: 'Active', description: '' });
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name || !form.sku || !form.price) return;
        const stockNum = Number(form.stock);
        let status = 'Active';
        if (stockNum === 0) status = 'Out of Stock';
        else if (stockNum < 20) status = 'Low Stock';
        onSave({ ...form, price: Number(form.price), stock: stockNum, status });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">{initialData ? 'Edit Product' : 'Add New Product'}</h3>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Product Name</label>
                            <input required name="name" value={form.name} onChange={handleChange} className="form-input" placeholder="Classic White T-Shirt" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">SKU</label>
                                <input required name="sku" value={form.sku} onChange={handleChange} className="form-input" placeholder="CLT-001" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select name="category" value={form.category} onChange={handleChange} className="form-select">
                                    <option>Clothing</option>
                                    <option>Footwear</option>
                                    <option>Accessories</option>
                                    <option>Electronics</option>
                                    <option>Ethnic Wear</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Price (₹)</label>
                                <input required type="number" name="price" value={form.price} onChange={handleChange} className="form-input" placeholder="799" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Stock</label>
                                <input required type="number" name="stock" value={form.stock} onChange={handleChange} className="form-input" placeholder="450" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea name="description" value={form.description} onChange={handleChange} className="form-textarea" placeholder="Product description..."></textarea>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary">
                            {initialData ? 'Save Changes' : 'Add Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductFormModal;