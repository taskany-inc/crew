const escapeSpecialChars = (value: string, separator: string): string => {
    if (value.includes(separator) || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
};

export const createCsvDocument = <T extends Record<string, any>, C extends { key: keyof T; name: string }>(
    data: T[],
    columns: C[],
    separator = ',',
) => {
    let csv = columns
        .map((c) => c.name)
        .map((v) => escapeSpecialChars(v, separator))
        .join(separator);
    data.forEach((d) => {
        const row = columns
            .map((c) => d[c.key])
            .map(String)
            .map((v) => escapeSpecialChars(v, separator))
            .join(separator);
        csv += `\n${row}`;
    });
    return csv;
};
