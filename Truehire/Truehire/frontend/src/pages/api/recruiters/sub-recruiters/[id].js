import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER || 'truehire-api';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'truehire-web';

if (!JWT_SECRET) {
  throw new Error('Missing required environment variable: JWT_SECRET');
}

// Function to verify JWT token
const verifyToken = (token) => {
  try {
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Invalid token');
  }
};

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    // Remove sub-recruiter
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      // Verify token and get recruiter info
      const decoded = verifyToken(token);
      if (!decoded || String(decoded.role || '').toUpperCase() !== 'RECRUITER') {
        return res.status(401).json({ message: 'Invalid token' });
      }

      // Remove sub-recruiter via backend
      const backendResponse = await fetch(`${process.env.BACKEND_URL}/api/recruiters/${decoded.id}/sub-recruiters/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await backendResponse.json();

      if (!backendResponse.ok) {
        return res.status(backendResponse.status).json(data);
      }

      res.status(200).json(data);
    } catch (error) {
      console.error('Error removing sub-recruiter:', error);
      res.status(500).json({ message: 'Server error' });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).json({ message: 'Method not allowed' });
  }
}
