import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('Missing required environment variable: JWT_SECRET');
}

// Function to verify JWT token
const verifyToken = (token) => {
  try {
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Invalid token');
  }
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Get sub-recruiters for the current recruiter
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      // Verify token and get recruiter info
      const decoded = verifyToken(token);
      if (!decoded || decoded.role !== 'recruiter') {
        return res.status(401).json({ message: 'Invalid token' });
      }

      // Fetch sub-recruiters from backend
      const backendResponse = await fetch(`${process.env.BACKEND_URL}/api/recruiters/${decoded.id}/sub-recruiters`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!backendResponse.ok) {
        throw new Error('Failed to fetch sub-recruiters');
      }

      const data = await backendResponse.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching sub-recruiters:', error);
      res.status(500).json({ message: 'Server error' });
    }
  } else if (req.method === 'POST') {
    // Add new sub-recruiter
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      // Verify token and get recruiter info
      const decoded = verifyToken(token);
      if (!decoded || decoded.role !== 'recruiter') {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const { name, email, password } = req.body;

      // Add sub-recruiter via backend
      const backendResponse = await fetch(`${process.env.BACKEND_URL}/api/recruiters/${decoded.id}/sub-recruiters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await backendResponse.json();

      if (!backendResponse.ok) {
        return res.status(backendResponse.status).json(data);
      }

      res.status(201).json(data);
    } catch (error) {
      console.error('Error adding sub-recruiter:', error);
      res.status(500).json({ message: 'Server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ message: 'Method not allowed' });
  }
}
