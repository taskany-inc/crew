export const regexEscape = (input: string) => input.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');

export const regexName = (name: string) => regexEscape(name).replaceAll(/(е|ё)/gi, '(е|ё)');
