import { Link } from 'react-router-dom';

const VARIANT_STYLES = {
  default: {
    background: '#fff',
    borderRadius: '18px',
    padding: '14px',
    boxShadow: '0 1px 2px rgba(15,23,42,.05),0 0 0 1px rgba(15,23,42,.04)',
  },
  soft: {
    background: '#F0F7F6',
    borderRadius: '18px',
    padding: '14px',
    boxShadow: 'none',
  },
  danger: {
    background: '#FFF6F6',
    borderRadius: '18px',
    padding: '14px',
    boxShadow: '0 0 0 1.5px #F3C4C4',
  },
};

export default function Card({
  children,
  to,
  variant = 'default',
  style,
  className = '',
  ...props
}) {
  const mergedStyle = {
    ...VARIANT_STYLES[variant],
    ...style,
  };

  if (to) {
    return (
      <Link
        to={to}
        className={className}
        style={{
          textDecoration: 'none',
          color: 'inherit',
          ...mergedStyle,
        }}
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <div className={className} style={mergedStyle} {...props}>
      {children}
    </div>
  );
}

