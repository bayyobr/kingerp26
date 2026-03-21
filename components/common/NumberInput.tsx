import React, { useState, useEffect } from 'react';

interface NumberInputProps {
    value: number;
    onChange: (val: number) => void;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
    step?: string;
    required?: boolean;
}

const NumberInput: React.FC<NumberInputProps> = ({ 
    value, 
    onChange, 
    disabled = false, 
    className = '', 
    placeholder = '',
    step = '1',
    required = false
}) => {
    const [localValue, setLocalValue] = useState(value === 0 ? '' : value.toString());

    useEffect(() => {
        const numericLocal = localValue === '' ? 0 : parseFloat(localValue);
        if (value !== numericLocal) {
            setLocalValue(value === 0 ? '' : value.toString());
        }
    }, [value, localValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalValue(val);
        if (val === '') {
            onChange(0);
        } else {
            const parsed = parseFloat(val);
            if (!isNaN(parsed)) {
                onChange(parsed);
            }
        }
    };

    return (
        <input
            type="number"
            step={step}
            value={localValue}
            onChange={handleChange}
            disabled={disabled}
            className={className}
            placeholder={placeholder}
            required={required}
        />
    );
};

export default NumberInput;
