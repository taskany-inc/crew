import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { hashPassword, verifyPassword } from './passwords';

describe('Password hashing', () => {
    it('should correctly hash and verify passwords', async () => {
        const password = 'sdj07ajsdhf*&*a';
        const hashed = await hashPassword(password);
        const verifiedFalse = await verifyPassword('wrong input', hashed);
        const verifiedTrue = await verifyPassword(password, hashed);
        assert.equal(verifiedFalse, false);
        assert.equal(verifiedTrue, true);
    });
});
