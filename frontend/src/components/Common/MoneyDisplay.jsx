import React from 'react';

const MoneyDisplay = ({ amount, currency = '₦', className = '' }) => {
    const formatted = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
    }).format(amount / 100); // Convert from kobo to naira

    return (
        <span className={`money-display ${className}`}>
            {formatted}
        </span>
    );
};

export default MoneyDisplay;
