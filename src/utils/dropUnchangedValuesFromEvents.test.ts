import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { dropUnchangedValuesFromEvent } from './dropUnchangedValuesFromEvents';

describe('dropUnchangedValuesFromEvent', () => {
    it('drops unchanged', () => {
        const before = {
            first: '1',
            second: '-',
            third: '3',
        };
        const after = {
            first: '1',
            second: '2',
            third: '-',
        };
        const expected = {
            before: {
                second: '-',
                third: '3',
            },
            after: {
                second: '2',
                third: '-',
            },
        };
        assert.deepStrictEqual(dropUnchangedValuesFromEvent(before, after), expected);
    });

    it('converts nulls to undefined', () => {
        const before: { first: string | null; second: string | null } = {
            first: null,
            second: '2',
        };
        const after = {
            first: '1',
            second: null,
        };
        const expected = {
            before: {
                first: undefined,
                second: '2',
            },
            after: {
                first: '1',
                second: undefined,
            },
        };
        assert.deepStrictEqual(dropUnchangedValuesFromEvent(before, after), expected);
    });
});
