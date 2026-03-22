import React from 'react';

const DatePicker = ({ value, onChange, label, id }) => {
    return (
        <div className="form-group">
            {label && <label htmlFor={id}>{label}</label>}
            <input
                type="date"
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="form-input"
            />
        </div>
    );
};

export default DatePicker;
