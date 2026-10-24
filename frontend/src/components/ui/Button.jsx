// Botão do design system. Variantes: primary | secondary | ghost | danger.
// Use no máximo um "primary" por tela.
export default function Button({
  variant = 'secondary', size, block = false, loading = false, icon: Icon,
  type = 'button', className = '', children, disabled, ...props
}) {
  const classes = ['btn', `btn--${variant}`, size && `btn--${size}`, block && 'btn--block',
    loading && 'btn--loading', className].filter(Boolean).join(' ');
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      {Icon && <Icon aria-hidden="true" />}
      {children}
    </button>
  );
}
