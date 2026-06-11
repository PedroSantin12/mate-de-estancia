const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);

function getSecret() {
  return process.env.JWT_SECRET || "mate-de-estancia-dev-secret-change-me";
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await scrypt(String(password), salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash).split(":");
  if (!salt || !hash) return false;
  const calculated = await scrypt(String(password), salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), calculated);
}

function signToken(user) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    sub: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  }));
  const signature = crypto.createHmac("sha256", getSecret()).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  const [header, payload, signature] = String(token).split(".");
  if (!header || !payload || !signature) return null;
  const expected = crypto.createHmac("sha256", getSecret()).update(`${header}.${payload}`).digest("base64url");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  return data.exp > Math.floor(Date.now() / 1000) ? data : null;
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken };
