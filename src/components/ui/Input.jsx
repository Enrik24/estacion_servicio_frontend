import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

function Input({
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  label,
  required = false,
  error,
  icon: Icon,
  showPasswordToggle = false,
  className = '',
  variant = 'outlined'
}) {
  const [showPassword, setShowPassword] = useState(false);
  
  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;
  
  const variantStyles = {
    outlined: 'border border-gray-300 bg-white focus:ring-orange-500',
    filled: 'border-0 bg-gray-100 focus:ring-orange-500'
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`block w-full rounded-lg focus:ring-2 focus:border-transparent transition py-3 ${variantStyles[variant]} ${Icon ? 'pl-10' : 'px-4'} ${showPasswordToggle ? 'pr-10' : 'pr-4'} ${error ? 'ring-2 ring-red-500' : ''}`}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default Input;
