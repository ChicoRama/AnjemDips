import { Link } from 'react-router-dom';

const TILE_VARIANTS = {
  teal: {
    background: '#0F766E',
    color: '#fff',
    iconBg: 'rgba(255,255,255,.16)',
    subtitleColor: '#C9ECE8',
  },
  amber: {
    background: '#FDE9B8',
    color: '#4A2C03',
    iconBg: 'rgba(74,44,3,.1)',
    subtitleColor: '#6B4308',
  },
};

export default function Tile({
  to,
  variant = 'teal',
  icon,
  title,
  subtitle,
  style,
  className = '',
  ...props
}) {
  const theme = TILE_VARIANTS[variant] || TILE_VARIANTS.teal;

  return (
    <Link
      to={to}
      className={className}
      style={{
        flex: 1,
        borderRadius: '20px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        textDecoration: 'none',
        boxSizing: 'border-box',
        height: '150px',
        background: theme.background,
        color: theme.color,
        ...style,
      }}
      {...props}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '13px',
          background: theme.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontWeight: 800, fontSize: '16px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: theme.subtitleColor }}>
          {subtitle}
        </div>
      </div>
    </Link>
  );
}

