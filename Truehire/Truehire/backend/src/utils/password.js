import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = async (value) => bcrypt.hash(value, SALT_ROUNDS);

export const comparePassword = async (value, hash) => bcrypt.compare(value, hash);
