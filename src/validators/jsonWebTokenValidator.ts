import { readFileSync } from 'fs';
import { KJUR } from 'jsrsasign';
import path from 'path';

function loadKeyFromFile(filename: string): string {
  const filePath = path.join(__dirname, '..', '..', 'res', 'jwtKeys', filename);
  const fileContent = readFileSync(filePath, 'utf8');

  return fileContent;
}

export function generateJWT(userId: string): string {
  const privateKey = loadKeyFromFile('private_key');

  // Header
  const oHeader = {
    alg: 'RS256',
    typ: 'JWT'
  }

  // Token expires in one week
  const calExp = String(KJUR.jws.IntDate.getNow() + 24 * 60 * 60 * 7)

  // Payload
  const oPayload = {
    sub: userId,
    exp: KJUR.jws.IntDate.get(calExp)
  }

  // Sign JWT
  const sJWT = KJUR.jws.JWS.sign("RS256", oHeader, oPayload, privateKey);

  return sJWT
}

export function generateAdminJWT(): string {
  const privateKey = loadKeyFromFile('private_key');

  // Header
  const oHeader = {
    alg: 'RS256',
    typ: 'JWT'
  }

  // Payload
  const oPayload = {
    sub: "admin",
    exp: KJUR.jws.IntDate.get('now + 1day')
  }

  // Sign JWT
  const sJWT = KJUR.jws.JWS.sign("RS256", oHeader, oPayload, privateKey);

  return sJWT
}

export function validateJWT(token: string, userId: string): boolean {
  // we can use this function with userId = "admin" as admin jwt validation
  // https://kjur.github.io/jsrsasign/api/symbols/KJUR.jws.JWS.html#.verifyJWT
  // https://kjur.github.io/jsrsasign/api/symbols/KJUR.jws.IntDate.html
  const pubkey = loadKeyFromFile("public_key")

  try {
    return KJUR.jws.JWS.verifyJWT(token, pubkey, {
      alg: ['RS256'],
      iss: [],
      sub: [userId],
      verifyAt: KJUR.jws.IntDate.getNow(),
      aud: []
    });
  } catch (error) {
    // if token is invalid it raises an TypeError
    console.error("Invalid Token")
    return false
  }
}
