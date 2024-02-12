import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { trimAndJoin } from './trimAndJoin';

describe('trimAndJoin', () => {
    it('should correctly filter out empty values', () => {
        assert.equal(trimAndJoin(['', ' a', '', ' ', 'b ', undefined, ' c ', ' ']), 'a b c');
    });
});
