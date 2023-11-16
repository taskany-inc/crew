export const trimAndJoin = (values: (string | undefined)[], separator = ' ') => {
    const trimmedValues = values.map((v) => v?.trim()).filter((v) => v);
    return trimmedValues.join(separator);
};
