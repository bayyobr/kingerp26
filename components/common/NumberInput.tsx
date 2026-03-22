import React, { useState, useEffect } from 'react';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: number;
    onChange: (val: number) => void;
}

const NumberInput: React.FC<NumberInputProps> = ({ 
    value, 
    onChange, 
    disabled = false, 
    className = '', 
    placeholder = '',
    step = '1',
    required = false,
    ...props
}) => {
    // Initialize with empty string if value is 0 (optional UX choice)
    const [localValue, setLocalValue] = useState(value === 0 ? '' : value.toString());

    // Update local state when prop value changes from the outside
    useEffect(() => {
        const numericLocal = localValue === '' ? 0 : parseFloat(localValue);
        // Only update local if the numeric representation differs
        if (value !== numericLocal) {
            setLocalValue(value === 0 ? '' : value.toString());
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalValue(val);
        
        if (val === '' || val === '-') {
            onChange(0);
        } else {
            const parsed = parseFloat(val);
            if (!isNaN(parsed)) {
                onChange(parsed);
            }
        }
    };

    const handleBlur = () => {
        // On blur, if the value is 0, we can re-format it to empty string or leave as '0'
        if (localValue === '') {
            setLocalValue('');
        }
    };

    return (
        <input
            {...props}
            type="number"
            step={step}
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={(e) => e.target.select()}
            disabled={disabled}
            className={className}
            placeholder={placeholder || '0'}
            required={required}
        />
    );
};

export default NumberInput;
