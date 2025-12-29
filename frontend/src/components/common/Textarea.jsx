import React from 'react';

/**
 * Composant Textarea réutilisable
 */
const Textarea = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  rows = 4,
  maxLength,
  showCharCount = false,
  className = '',
  textareaClassName = '',
  ...props
}) => {
  const textareaClasses = `input-field resize-none ${error ? 'border-red-500 focus:ring-red-500' : ''} ${
    disabled ? 'bg-gray-100 cursor-not-allowed' : ''
  } ${textareaClassName}`;

  const currentLength = value?.length || 0;

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={textareaClasses}
        {...props}
      />

      <div className="flex justify-between items-center mt-1">
        <div className="flex-1">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
        </div>

        {showCharCount && maxLength && (
          <p className="text-xs text-gray-500">
            {currentLength} / {maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export default Textarea;
