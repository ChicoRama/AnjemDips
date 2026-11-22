const CHIP_VARIANTS = {
  teal: {
    background: '#E6F4F2',
    color: '#0B5F59',
  },
  success: {
    background: '#DDF3E4',
    color: '#14532D',
  },
  warning: {
    background: '#FDE9B8',
    color: '#6B4308',
  },
  danger: {
    background: '#FDECEC',
    color: '#991B1B',
  },
  off: {
    background: '#E8EAEE',
    color: '#475569',
  },
  neutral: {
    background: '#F1F3F6',
    color: '#475569',
  },
};

export default function Chip({
  children,
  variant = 'teal',
  style,
  className = '',
  ...props
}) {
  const variantStyle = CHIP_VARIANTS[variant] || CHIP_VARIANTS.teal;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        height: '24px',
        padding: '0 9px',
        borderRadius: '99px',
        fontSize: '11px',
        fontWeight: 700,
        ...variantStyle,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}

