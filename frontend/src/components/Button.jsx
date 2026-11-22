import { Link } from 'react-router-dom';

const BUTTON_VARIANTS = {
  primary: {
    background: '#0F766E',
    color: '#fff',
    boxShadow: 'none',
  },
  amber: {
    background: '#F59E0B',
    color: '#3B2402',
    boxShadow: 'none',
  },
  outline: {
    background: '#fff',
    color: '#0F172A',
    boxShadow: 'inset 0 0 0 1.5px #D5DAE1',
  },
  danger: {
    background: '#B91C1C',
    color: '#fff',
    boxShadow: 'none',
  },
  dangerOutline: {
    background: '#fff',
    color: '#B91C1C',
    boxShadow: 'inset 0 0 0 1.5px #F3C4C4',
  },
  disabled: {
    background: '#E8EAEE',
    color: '#64748B',
    boxShadow: 'none',
  },
};

export default function Button({
  children,
  to,
  variant = 'primary',
  height = 48,
  disabled = false,
  type = 'button',
  style,
  className = '',
  ...props
}) {
  const activeVariant = disabled ? 'disabled' : variant;
  const variantStyle = BUTTON_VARIANTS[activeVariant] || BUTTON_VARIANTS.primary;

  const baseStyle = {
    height: `${height}px`,
    borderRadius: '14px',
    border: 0,
    font: "700 14px 'Plus Jakarta Sans',system-ui,sans-serif",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    width: '100%',
    textDecoration: 'none',
    boxSizing: 'border-box',
    ...variantStyle,
    ...style,
  };

  if (to && !disabled) {
    return (
      <Link to={to} className={className} style={baseStyle} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={className}
      style={baseStyle}
      {...props}
    >
      {children}
    </button>
  );
}

