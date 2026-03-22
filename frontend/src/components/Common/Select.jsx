import React from 'react';

const Select = ({ label, id, value, onChange, options = [], placeholder = 'Select...', required = false }) => {
    return (
        <div className="form-group">
            {label && <label htmlFor={id}>{label}{required && ' *'}</label>}
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                className="form-select"
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default Select;
