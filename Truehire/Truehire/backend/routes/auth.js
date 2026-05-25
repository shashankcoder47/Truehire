import { Router } from 'express';
import { prisma } from '../src/config/database.js';
import { hashPassword } from '../src/utils/password.js';
import { signAccessToken } from '../src/utils/jwt.js';

const router = Router();

router.post('/register/user', async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};

    const normalizedName = String(name ?? '').trim();
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    const normalizedPassword = String(password ?? '');

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      return res.status(400).json({
        success: false,
        error: 'name, email, and password are required',
      });
    }

    const existingUser = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists with this email',
      });
    }

    const hashedPassword = await hashPassword(normalizedPassword);

    const user = await prisma.users.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const token = signAccessToken({
      sub: String(user.id),
      email: user.email,
      role: 'user',
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: 'user',
      },
    });
  } catch (error) {
    console.error('POST /api/auth/register/user failed:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to register user',
      details: error.message,
    });
  }
});

export default router;
