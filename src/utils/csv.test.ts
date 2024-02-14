import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createCsvDocument } from './csv';

describe('CSV generation', () => {
    it('creates csv string and escapes values', () => {
        const expected = [
            'Title,"Count, integer"',
            'with spaces,0',
            '"with , comma",1',
            'with ; semicolon,2',
            '"with ""quotes""",3',
        ].join('\n');

        assert.equal(
            createCsvDocument(
                [
                    { title: 'with spaces', count: 0, unused: '' },
                    { title: 'with , comma', count: 1, unused: '' },
                    { title: 'with ; semicolon', count: 2, unused: '' },
                    { title: 'with "quotes"', count: 3, unused: '' },
                ],
                [
                    { key: 'title', name: 'Title' },
                    { key: 'count', name: 'Count, integer' },
                ],
            ),
            expected,
        );
    });
});
