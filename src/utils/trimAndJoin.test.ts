import { trimAndJoin } from './trimAndJoin';

describe('trimAndJoin', () => {
    it('should correctly filter out empty values', () => {
        expect(trimAndJoin(['', ' a', '', ' ', 'b ', undefined, ' c ', ' '])).toBe('a b c');
    });
});
