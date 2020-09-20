import { readFileSync } from 'fs';
import { RSAKey } from 'jsrsasign';
import path from 'path';
import validateSignature from '../src/validators/rsaSignatureValidator';
import 'mocha'
import { expect } from 'chai'

describe('RSA Signature Validation', function () {
    function getSignature(toSign: string, hashAlgo = 'sha256'): string {
        const keyPath = path.join(__dirname, 'res', 'qrcode_private_key')
        const privateKey = readFileSync(keyPath, 'utf8');
        const key = new RSAKey();
        key.readPrivateKeyFromPEMString(privateKey);
        return key.sign(toSign, hashAlgo)
    }

    it('simple object is correctly verified', () => {
        const data = { "a": "x", "b": ["y", "z"], "c": 1 };
        const signature = getSignature(JSON.stringify(data, Object.keys(data).sort()));
        expect(validateSignature(data, signature)).to.equal(true);
    });

    it('unordered keys are correctly verified', () => {
        const data = { "a": "x", "c": 1, "b": ["y", "z"] };
        const signature = getSignature(JSON.stringify(data, Object.keys(data).sort()));
        expect(validateSignature(data, signature)).to.equal(true);
    });

    it('unordered keys in signature is not verified', () => {
        const data = { "a": "x", "c": 1, "b": ["y", "z"] };
        const signature = getSignature(JSON.stringify(data));
        expect(validateSignature(data, signature)).to.equal(false);
    });

    it('modified data is not verified', () => {
        const data = { "a": "x", "c": 1, "b": ["y", "z"] };
        const signature = getSignature(JSON.stringify(data, Object.keys(data).sort()));
        data["a"] = "y";
        expect(validateSignature(data, signature)).to.equal(false);
    });

    it('wrong hash-algorithm on signature is not verified', () => {
        const data = { "a": "x", "b": ["y", "z"], "c": 1 };
        const signature = getSignature(JSON.stringify(data, Object.keys(data).sort()), 'sha1');
        expect(validateSignature(data, signature)).to.equal(true);
    });
});
