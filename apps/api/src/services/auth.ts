import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from '@fastify/jwt';
import { config } from '../config.js';
import { query } from '../db/index.js';
import { generateId, UnauthorizedError, ValidationError } from '@healthos/shared';
import type { User, AuthSession } from '@healthos/types';

export async function generateTokens(userId: string) {
  const token = jwt.sign({ sub: userId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ sub: userId, type: 'refresh' }, config.JWT_SECRET, {
    expiresIn: '30d',
  });

  return { token, refreshToken };
}

export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<User> {
  // Validation
  if (!email || !password || !firstName || !lastName) {
    throw new ValidationError('Missing required fields');
  }

  if (password.length < 12) {
    throw new ValidationError('Password must be at least 12 characters');
  }

  // Check if user exists
  const existing = await query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existing.rows.length > 0) {
    throw new ValidationError('Email already registered');
  }

  // Hash password (in production, use bcrypt)
  const hashedPassword = Buffer.from(password).toString('base64');

  const userId = generateId();
  await query(
    `INSERT INTO users (id, email, password_hash, first_name, last_name, status)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, email.toLowerCase(), hashedPassword, firstName, lastName, 'active']
  );

  return {
    id: userId,
    email,
    firstName,
    lastName,
    role: 'patient',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: User; token: string; refreshToken: string }> {
  const result = await query(
    `SELECT id, email, first_name, last_name, role, status, password_hash
     FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const user = result.rows[0];
  const hashedPassword = Buffer.from(password).toString('base64');

  // In production, use bcrypt compare
  if (user.password_hash !== hashedPassword) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const { token, refreshToken } = await generateTokens(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      status: user.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    token,
    refreshToken,
  };
}

export async function verifyToken(token: string): Promise<{ sub: string }> {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { sub: string };
    return decoded;
  } catch (error) {
    throw new UnauthorizedError('Invalid token');
  }
}

export async function getCurrentUser(request: FastifyRequest): Promise<User | null> {
  try {
    const decoded = await request.jwtVerify();
    const userId = (decoded as { sub: string }).sub;

    const result = await query(
      `SELECT id, email, first_name, last_name, avatar_url, role, status, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      avatar: user.avatar_url,
      role: user.role,
      status: user.status,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  } catch (error) {
    return null;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (error) {
    throw new UnauthorizedError('Missing or invalid authentication');
  }
}
