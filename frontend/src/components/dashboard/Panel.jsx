import "./panel.css";

export default function Panel({ title, subtitle, action, children, className = "" }) {
    return (
        <div className={`panel card ${className}`}>
            {(title || action) && (
                <div className="panel__header">
                    <div>
                        {title && <h3 className="panel__title">{title}</h3>}
                        {subtitle && <p className="panel__subtitle">{subtitle}</p>}
                    </div>
                    {action}
                </div>
            )}
            <div className="panel__body">{children}</div>
        </div>
    );
}
