import React from 'react';
import ProductRow from './ProductRow';

const ProductTable = ({ products, onEdit, onDelete }) => {
    if (products.length === 0) {
        return (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No products found.
            </div>
        );
    }

    return (
        <>
            {/* Desktop Table */}
            <div className="table-scroll">
                <table className="product-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th className="th-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p) => (
                            <ProductRow key={p.id} product={p} onEdit={onEdit} onDelete={onDelete} />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="mobile-products">
                {products.map((p) => (
                    <ProductRow key={p.id} product={p} onEdit={onEdit} onDelete={onDelete} isMobile />
                ))}
            </div>
        </>
    );
};

export default ProductTable;