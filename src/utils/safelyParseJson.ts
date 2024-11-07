export const safelyParseJson = <T = unknown>(parseString: string): T | null => {
    try {
        return JSON.parse(parseString);
    } catch (e) {
        return null;
    }
};
