export const formatCPF = (value: string) => {
    const v = value.replace(/\D/g, '').substring(0, 11);
    if (v.length <= 3) return v;
    if (v.length <= 6) return `${v.substring(0, 3)}.${v.substring(3)}`;
    if (v.length <= 9) return `${v.substring(0, 3)}.${v.substring(3, 6)}.${v.substring(6)}`;
    return `${v.substring(0, 3)}.${v.substring(3, 6)}.${v.substring(6, 9)}-${v.substring(9)}`;
};

export const formatPhone = (value: string) => {
    const v = value.replace(/\D/g, '').substring(0, 11);
    if (!v) return '';
    if (v.length <= 2) return `(${v}`;
    if (v.length <= 3) return `(${v.substring(0, 2)}) ${v.substring(2)}`;
    if (v.length <= 7) return `(${v.substring(0, 2)}) ${v.substring(2, 3)} ${v.substring(3)}`;
    return `(${v.substring(0, 2)}) ${v.substring(2, 3)} ${v.substring(3, 7)}-${v.substring(7)}`;
};

export const formatCurrency = (value: number | string) => {
    if (value === undefined || value === null || value === '') return '';

    // If it's already a number, format exactly as is
    if (typeof value === 'number') {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }

    // If it's a string, treat it as input digits (ATM style)
    const v = value.replace(/\D/g, '');

    if (!v) return '';

    const floatValue = parseFloat(v) / 100;

    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(floatValue);
};

export const parseCurrency = (value: string): number => {
    return Number(value.replace(/\./g, '').replace(',', '.'));
};

export const formatPercent = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(value / 100);
};
