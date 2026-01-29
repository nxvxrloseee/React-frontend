const Modal = ({ title, children, onClose, size = 'default' }) => {
    const sizes = {
        small: '400px',
        default: '500px',
        large: '700px',
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div 
                style={{...styles.modal, maxWidth: sizes[size]}} 
                onClick={(e) => e.stopPropagation()}
            >
                <div style={styles.header}>
                    <h3 style={styles.title}>{title}</h3>
                    <button 
                        style={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        ✕
                    </button>
                </div>
                <div style={styles.body}>
                    {children}
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease',
        padding: '20px',
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.3s ease',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 24px',
        borderBottom: '1px solid #e0e4e8',
    },
    title: {
        margin: 0,
        fontSize: '18px',
        fontWeight: '600',
        color: '#2c3e50',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '18px',
        cursor: 'pointer',
        color: '#7f8c8d',
        padding: '4px 8px',
        borderRadius: '4px',
        transition: 'all 0.2s',
    },
    body: {
        padding: '24px',
        overflowY: 'auto',
        maxHeight: 'calc(90vh - 80px)',
    },
};

export default Modal;