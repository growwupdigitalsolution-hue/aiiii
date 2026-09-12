import React, { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import CatalogHeader from '../components/catalog/CatalogHeader';
import CatalogStats from '../components/catalog/CatalogStats';
import ProductSection from '../components/catalog/ProductSection';
import ProductFormModal from '../components/catalog/ProductFormModal';
import DeleteConfirmation from '../components/catalog/DeleteConfirmation';
import './catalog.css';

const INITIAL_PRODUCTS = [
    { id: 1, name: 'Classic White T-Shirt', sku: 'CLT-001', category: 'Clothing', price: 799, stock: 450, status: 'Active', image: '👕' },
    { id: 2, name: 'Slim Fit Jeans', sku: 'CLT-002', category: 'Clothing', price: 2499, stock: 180, status: 'Active', image: '👖' },
    { id: 3, name: 'Running Shoes', sku: 'FTW-001', category: 'Footwear', price: 4299, stock: 12, status: 'Low Stock', image: '👟' },
    { id: 4, name: 'Leather Handbag', sku: 'ACC-001', category: 'Accessories', price: 3499, stock: 65, status: 'Active', image: '👜' },
    { id: 5, name: 'Smart Watch', sku: 'ELC-001', category: 'Electronics', price: 8999, stock: 0, status: 'Out of Stock', image: '⌚' },
    { id: 6, name: 'Silk Saree', sku: 'ETH-001', category: 'Ethnic Wear', price: 5999, stock: 30, status: 'Active', image: '🥻' },
];

const Catalog = () => {
    const [products, setProducts] = useState(INITIAL_PRODUCTS);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const stats = {
        total: products.length,
        active: products.filter(p => p.status === 'Active').length,
        lowStock: products.filter(p => p.status === 'Low Stock').length,
        outOfStock: products.filter(p => p.status === 'Out of Stock').length,
    };

    const handleAddProduct = () => { setEditingProduct(null); setIsFormOpen(true); };
    const handleEditProduct = (product) => { setEditingProduct(product); setIsFormOpen(true); };
    const handleDeleteClick = (product) => { setProductToDelete(product); setIsDeleteOpen(true); };

    const confirmDelete = () => {
        if (productToDelete) setProducts(products.filter(p => p.id !== productToDelete.id));
        setProductToDelete(null);
        setIsDeleteOpen(false);
    };

    const handleSaveProduct = (formData) => {
        if (editingProduct) {
            setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...formData } : p));
        } else {
            setProducts([{ ...formData, id: Date.now(), image: '📦' }, ...products]);
        }
        setIsFormOpen(false);
    };

    const handleSync = () => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 1000);
    };

    return (
        <AppLayout title="Catalog">
            <div className="catalog-page">
                <CatalogHeader onSync={handleSync} onUpdateId={() => { }} isLoading={isLoading} />
                <CatalogStats stats={stats} />
                <ProductSection
                    products={products}
                    onAddProduct={handleAddProduct}
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteClick}
                />
                <ProductFormModal
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSaveProduct}
                    initialData={editingProduct}
                />
                <DeleteConfirmation
                    isOpen={isDeleteOpen}
                    onClose={() => setIsDeleteOpen(false)}
                    onConfirm={confirmDelete}
                    productName={productToDelete?.name}
                />
            </div>
        </AppLayout>
    );
};

export default Catalog;