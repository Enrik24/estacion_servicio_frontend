function Button({ 
  children, 
  type = 'button',
  disabled = false, 
  loading = false,
  onClick,
  className = '',
  icon: Icon,
  fullWidth = true,
  shadow = false,
  size = 'default'
}) {
  const widthClasses = fullWidth ? 'w-full flex' : 'inline-flex';
  const sizeClasses = size === 'small' ? 'py-2 px-3 text-sm' : 'py-4 px-4';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${widthClasses} items-center justify-center space-x-2 ${sizeClasses} bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed ${shadow ? 'shadow-lg' : ''} ${className}`}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
      ) : (
        <>
          <span>{children}</span>
          {Icon && <Icon className="w-5 h-5" />}
        </>
      )}
    </button>
  );
}

export default Button;
