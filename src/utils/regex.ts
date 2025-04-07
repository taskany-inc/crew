import convertLayoutRu from 'convert-layout/ru';
import cyrillicToTranslit from 'cyrillic-to-translit-js';

const translit = cyrillicToTranslit();

export const regexEscape = (input: string) => input.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');

export const regexReplaceYo = (input: string) => input.replace(/(е|ё)/gi, '(е|ё)');

export const regexTestEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const regexWordSplit = (input: string) => {
    const split = input
        .split(' ')
        .filter((item) => item.length > 0)
        .map((item) => `(?=.*${item})`)
        .join('');

    return `^${split}.*$`;
};

export const getSearchRegex = (input: string) => {
    const translitEn = regexWordSplit(regexEscape(translit.transform(input)));
    const translitRu = regexWordSplit(regexReplaceYo(regexEscape(translit.reverse(input))));
    const layoutEn = regexWordSplit(regexEscape(convertLayoutRu.toEn(input)));
    const layoutRu = regexWordSplit(regexReplaceYo(regexEscape(convertLayoutRu.fromEn(input))));

    return `${translitEn}|${translitRu}|${layoutEn}|${layoutRu}`;
};
