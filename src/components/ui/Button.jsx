const baseStyle = {
    padding: '8px 14px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
};

const variants = {
    primary: {
        backgroundColor: '#27ae60',
        color: '#fff',
    },
    secondary: {
        backgroundColor: '#34495e',
        color: '#ecf0f1',
    },
    danger: {
        backgroundColor: '#e74c3c',
        color: '#fff',
    },
};

const Button = ({ children, variant = 'primary', style, ...props }) => (
    <button
        style={{
            ...baseStyle,
            ...variants[variant],
            ...style,
        }}
        {...props}
    >
        {children}
    </button>
);

export default Button;
