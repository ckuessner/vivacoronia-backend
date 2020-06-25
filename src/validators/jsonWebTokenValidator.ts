import { readFileSync } from 'fs';
import { KJUR } from 'jsrsasign';
import path from 'path';

function loadKeyFromFile(filename: string): String {
  const filePath = path.join(__dirname, '..', '..', 'res', 'jwtKeys', filename);
  const fileContent = readFileSync(filePath, 'utf8');

  return fileContent;
}

export function generateJWT(userId: String): String {
  const privateKey = loadKeyFromFile('private_key');

  // Header
  var oHeader = {
    alg: 'RS256',
    typ: 'JWT'
  }

  // Payload
  var oPayload = {
    sub: userId,
    exp: KJUR.jws.IntDate.get('now + 1day')
  }

  // Sign JWT
  var sJWT = KJUR.jws.JWS.sign("RS256", oHeader, oPayload, privateKey.toString());

  return sJWT
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
