import { readFileSync } from 'fs';
import { KJUR } from 'jsrsasign';
import path from 'path';

function loadKeyFromFile(filename: string): string {
  const filePath = path.join(__dirname, '..', '..', 'res', 'jwtKeys', filename);
  const fileContent = readFileSync(filePath, 'utf8');

  return fileContent;
}

function generateJWT(userId: string): string {
  // generates an access token for a user with userId or admin
  // we can use this function with userId = "admin" as admin jwt generation

  const privateKey = loadKeyFromFile('private_key');

  // Header
  const oHeader = {
    alg: 'RS256',
    typ: 'JWT'
  }

  // Payload
  let oPayload = {
    sub: userId
  }

  if (userId === "admin") {
    // admin token expires in one day from now
    oPayload = Object.assign(oPayload, { exp: KJUR.jws.IntDate.get('now + 1day') })
  }

  // Sign JWT
  const sJWT = KJUR.jws.JWS.sign("RS256", oHeader, oPayload, privateKey);

  return sJWT
}

export function generateAccessJWT(userId: string): string {
  return generateJWT(userId)
}

export function generateAdminJWT(): string {
  return generateJWT("admin")
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
