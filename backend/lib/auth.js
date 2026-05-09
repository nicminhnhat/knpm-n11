const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const DEV_JWT_SECRET = "knpm-n11-dev-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET is required in production.");
  return DEV_JWT_SECRET;
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function getBearerToken(header = "") {
  return header.startsWith("Bearer ") ? header.slice(7).trim() : null;
}

function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    lockReason: user.lockReason,
    avatarUrl: user.avatarUrl,
    verificationStatus: user.verificationStatus,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

module.exports = { comparePassword, getBearerToken, hashPassword, signToken, toPublicUser, verifyToken };
