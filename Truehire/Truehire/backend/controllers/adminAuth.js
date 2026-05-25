async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findByEmail(email);
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ id: admin.id, role: 'admin' });

    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        email: admin.email,
        role: 'admin',
        name: admin.name
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  adminLogin
};