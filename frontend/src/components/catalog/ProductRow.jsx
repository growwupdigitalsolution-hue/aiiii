import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

const statusClass = (s) => {
    if (s === 'Active') return 'active';
    if (s === 'Low Stock') return 'low-stock';
    return 'out-stock';
};

const stockClass = (stock) => {
    if (stock === 0) return 'out';
    if (stock < 20) return 'low';
    return 'normal';
};

const ProductRow = ({ product, onEdit, onDelete, isMobile }) => {
    const price = `₹${product.price.toLocaleString('en-IN')}`;

    if (isMobile) {
        return (
            <div className="mobile-product">
                <div className="mobile-product-top">
                    <div className="product-cell">
                        <div className="product-thumb">{product.image}</div>
                        <div>
                            <div className="product-name">{product.name}</div>
                            <div className="cell-muted" style={{ marginTop: 2, fontSize: 12 }}>
                                {product.sku} · {product.category}
                            </div>
                        </div>
                    </div>
                    <span className={`status-pill ${statusClass(product.status)}`}>{product.status}</span>
                </div>
                <div className="mobile-product-bottom">
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <span className="cell-price">{price}</span>
                        <span className={`stock-cell ${stockClass(product.stock)}`}>Stock: {product.stock}</span>
                    </div>
                    <div className="actions-cell">
                        <button className="icon-btn edit" onClick={() => onEdit(product)}>
                            <Pencil size={14} />
                        </button>
                        <button className="icon-btn delete" onClick={() => onDelete(product)}>
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <tr>
            <td>
                <div className="product-cell">
                    <div className="product-thumb">{product.image}</div>
                    <span className="product-name">{product.name}</span>
                </div>
            </td>
            <td className="cell-muted">{product.sku}</td>
            <td className="cell-muted">{product.category}</td>
            <td className="cell-price">{price}</td>
            <td className={`stock-cell ${stockClass(product.stock)}`}>{product.stock}</td>
            <td>
                <span className={`status-pill ${statusClass(product.status)}`}>{product.status}</span>
            </td>
            <td>
                <div className="actions-cell">
                    <button className="icon-btn edit" onClick={() => onEdit(product)} title="Edit">
                        <Pencil size={14} />
                    </button>
                    <button className="icon-btn delete" onClick={() => onDelete(product)} title="Delete">
                        <Trash2 size={14} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default ProductRow;