import { readFileSync } from 'fs';
import { KJUR } from 'jsrsasign';
import path from 'path';

function loadKeyFromFile(filename: string): String {
  const filePath = path.join(__dirname, '..', '..', 'res', 'jwtKeys', filename);
  const fileContent = readFileSync(filePath, 'utf8');

  return fileContent;
}

export function generateJWT(header: String, payload: String): String {
  const privateKey = loadKeyFromFile('private_key');

  // https://kjur.github.io/jsrsasign/api/symbols/KJUR.crypto.Signature.html
  var sig = new KJUR.crypto.Signature({ "alg": "SHA256withRSA" })
  sig.init(privateKey.toString())
  sig.updateString(header + "." + payload)
  var hSigVal = sig.sign()

  return header + "." + payload + "." + hSigVal
}

export function validateJWT(token: String, userId: String): boolean {
  // https://kjur.github.io/jsrsasign/api/symbols/KJUR.jws.JWS.html#.verifyJWT
  // https://kjur.github.io/jsrsasign/api/symbols/KJUR.jws.IntDate.html
  const pubkey = loadKeyFromFile("public_key")

  var isValid = KJUR.jws.JWS.verifyJWT(token.toString(), pubkey.toString(), {
    alg: ['RS256'],
    iss: [],
    sub: [userId.toString()],
    verifyAt: KJUR.jws.IntDate.getNow(),
    aud: []
  });

  return isValid
}