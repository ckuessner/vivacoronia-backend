import { promises as fs } from 'fs';
import { KJUR, b64toutf8 } from 'jsrsasign';
import path from 'path';
import { JsonObject } from 'swagger-ui-express';

const publicPrivateKeyBuffer = new Map<string, string>()

async function loadKeyFromFile(filename: string): Promise<string> {
  const filePath = path.join(__dirname, '..', '..', 'res', 'jwtKeys', filename);

  const data = await fs.readFile(filePath, 'utf8');

  return data
}

async function getKeyFromBuffer(filename: string): Promise<string> {
  let buffer = publicPrivateKeyBuffer.get(filename)

  if (buffer == undefined || buffer.length === 0) {
    buffer = await loadKeyFromFile(filename)
    publicPrivateKeyBuffer.set(filename, buffer)
  }

  return String(buffer)
}

async function generateJWT(userId: string): Promise<string> {
  // generates an access token for a user with userId or admin
  // we can use this function with userId = "admin" as admin jwt generation

  const privateKey = await getKeyFromBuffer('private_key');

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

export async function getUserIdFromToken(jwt: string): Promise<string> {

  const payloadObj = KJUR.jws.JWS.readSafeJSONString(b64toutf8(jwt.split(".")[1]))

  if (payloadObj == null) {
    return Promise.reject("Unable to decode payload of jwt")
  }

  return (payloadObj as JsonObject).sub as string
}

export async function generateAccessJWT(userId: string): Promise<string> {
  return await generateJWT(userId)
}

export async function generateAdminJWT(): Promise<string> {
  return await generateJWT("admin")
}

export async function validateJWT(token: string, userId: string): Promise<boolean> {
  // we can use this function with userId = "admin" as admin jwt validation
  // https://kjur.github.io/jsrsasign/api/symbols/KJUR.jws.JWS.html#.verifyJWT
  // https://kjur.github.io/jsrsasign/api/symbols/KJUR.jws.IntDate.html
  const pubkey = await getKeyFromBuffer("public_key")

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
    return false
  }
}
