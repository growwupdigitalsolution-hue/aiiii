import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import ProductTable from './ProductTable';

const ProductSection = ({ products, onAddProduct, onEdit, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="products-container">
            <div className="products-header">
                <h2 className="products-title">Products</h2>
                <div className="products-controls">
                    <div className="search-box">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <button onClick={onAddProduct} className="btn btn-primary">
                        <Plus size={15} strokeWidth={2.5} />
                        Add Product
                    </button>
                </div>
            </div>

            <ProductTable products={filtered} onEdit={onEdit} onDelete={onDelete} />
        </div>
    );
};

export default ProductSection;