import React from 'react';

const Input = ({ label, id, type = 'text', value, onChange, placeholder, required = false }) => {
    return (
        <div className="form-group">
            {label && <label htmlFor={id}>{label}{required && ' *'}</label>}
            <input
                type={type}
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                className="form-input"
            />
        </div>
    );
};

export default Input;
