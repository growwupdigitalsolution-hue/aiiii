import React from 'react';
import { Package, Link2, RefreshCw } from 'lucide-react';

const CatalogHeader = ({ onSync, onUpdateId, isLoading }) => (
    <div className="catalog-header">
        <div className="catalog-header-left">
            <div className="catalog-icon-box">
                <Package size={26} strokeWidth={2.2} />
            </div>
            <div>
                <h1 className="catalog-title">Meta Commerce Catalog</h1>
                <div className="catalog-meta">
                    <span className="connected-badge">
                        <span className="connected-dot"></span>
                        Connected
                    </span>
                    <span className="waba-id">
                        <Link2 size={13} />
                        WAB-1234567890
                    </span>
                </div>
            </div>
        </div>

        <div className="catalog-header-actions">
            <button onClick={onUpdateId} className="btn btn-secondary">
                Update Catalog ID
            </button>
            <button onClick={onSync} disabled={isLoading} className="btn btn-primary">
                <RefreshCw size={15} />
                Sync Now
            </button>
        </div>
    </div>
);

export default CatalogHeader;