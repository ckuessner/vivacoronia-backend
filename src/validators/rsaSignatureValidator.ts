import { readFileSync } from 'fs';
import { KEYUTIL, RSAKey } from 'jsrsasign';
import path from 'path';

function loadKeyFromFile(filename: string): RSAKey {
    const filePath = path.join(__dirname, '..', '..', 'res', 'qrcode_keys', filename);
    const fileContent = readFileSync(filePath, 'utf8');
    const publicKey = KEYUTIL.getKey(fileContent);

    if (!(publicKey instanceof RSAKey)) {
        throw Error("Error trying to load a public key. The provided key has an invalid format.");
    }

    return publicKey;
}

export default function validate(receivedObject: any, signature: string): boolean {
    const publicKey = loadKeyFromFile('public_key');
    const dataString = JSON.stringify(receivedObject, Object.keys(receivedObject).sort())
    const isValid = publicKey.verify(dataString, signature);
    return isValid == 1;
}
