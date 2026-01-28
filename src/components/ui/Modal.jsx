const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
};

const modalStyle = {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    minWidth: '400px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
};

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
};

const Modal = ({ title, children, onClose }) => {
    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                <div style={headerStyle}>
                    <h3>{title}</h3>
                    <button onClick={onClose}>✖</button>
                </div>
                {children}
            </div>
        </div>
    );
};

export default Modal;
