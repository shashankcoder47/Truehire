export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { companyEmail, subRecruiterEmail, password } = req.body;

      if (!companyEmail || !subRecruiterEmail || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Forward to backend sub-recruiter login
      const backendResponse = await fetch(`${process.env.BACKEND_URL}/api/recruiters/sub-recruiter/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ companyEmail, subRecruiterEmail, password })
      });

      const data = await backendResponse.json();

      if (!backendResponse.ok) {
        return res.status(backendResponse.status).json(data);
      }

      res.status(200).json(data);
    } catch (error) {
      console.error('Sub-recruiter login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: 'Method not allowed' });
  }
}
