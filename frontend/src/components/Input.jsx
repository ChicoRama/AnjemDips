const INPUT_VARIANTS = {
  filled: {
    height: '44px',
    background: '#F5F6F8',
    padding: '0 12px',
    font: "600 13px 'Plus Jakarta Sans',system-ui,sans-serif",
    boxShadow: 'none',
  },
  bordered: {
    height: '46px',
    background: '#fff',
    padding: '0 14px',
    font: "500 13px 'Plus Jakarta Sans',system-ui,sans-serif",
    boxShadow: 'inset 0 0 0 1.5px #E2E6EB',
  },
};

export default function Input({
  label,
  hideLabel = false,
  variant = 'filled',
  containerStyle,
  labelStyle,
  style,
  ...props
}) {
  const variantStyle = INPUT_VARIANTS[variant] || INPUT_VARIANTS.filled;

  const inputElement = (
    <input
      style={{
        width: '100%',
        boxSizing: 'border-box',
        border: 0,
        outline: 0,
        borderRadius: '12px',
        color: '#0F172A',
        ...variantStyle,
        ...style,
      }}
      {...props}
    />
  );

  if (!label) {
    return inputElement;
  }

  return (
    <label style={{ display: 'block', ...containerStyle }}>
      <span
        style={{
          display: hideLabel ? 'none' : 'block',
          fontSize: '11px',
          fontWeight: 600,
          color: '#475569',
          marginBottom: '6px',
          ...labelStyle,
        }}
      >
        {label}
      </span>
      {inputElement}
    </label>
  );
}

