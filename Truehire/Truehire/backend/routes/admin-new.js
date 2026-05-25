const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const SupportTicket = require('../models/SupportTicket');
const Category = require('../models/Category');
const Location = require('../models/Location');
const EmailTemplate = require('../models/EmailTemplate');
const SMSSettings = require('../models/SMSSettings');
const APIKey = require('../models/APIKey');

const router = express.Router();

// All admin routes require token verification and admin authentication
router.use(verifyToken);
router.use(requireAdmin);

// Support Tickets Management
// Get all support tickets (admin only)
router.get('/support-tickets', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, priority, assigned_to } = req.query;
    const offset = (page - 1) * limit;

    const filters = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (priority) filters.priority = priority;
    if (assigned_to !== undefined) filters.assigned_to = assigned_to === 'null' ? null : assigned_to;

    const tickets = await SupportTicket.findAll(parseInt(limit), offset, filters);
    const stats = await SupportTicket.getStats();

    res.json({
      tickets,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: stats.total_tickets,
        pages: Math.ceil(stats.total_tickets / limit)
      }
    });
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create support ticket (admin only)
router.post('/support-tickets', async (req, res) => {
  try {
    const { user_id, recruiter_id, type, subject, description, priority } = req.body;

    const ticketId = await SupportTicket.create({
      user_id,
      recruiter_id,
      type,
      subject,
      description,
      priority
    });

    res.status(201).json({
      message: 'Support ticket created successfully',
      ticketId
    });
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update support ticket (admin only)
router.put('/support-tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assigned_to } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;

    const updated = await SupportTicket.update(id, updateData);

    if (!updated) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    res.json({ message: 'Support ticket updated successfully' });
  } catch (error) {
    console.error('Update support ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign ticket to admin (admin only)
router.put('/support-tickets/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_id } = req.body;

    const assigned = await SupportTicket.assign(id, admin_id);

    if (!assigned) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    res.json({ message: 'Support ticket assigned successfully' });
  } catch (error) {
    console.error('Assign support ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Close support ticket (admin only)
router.put('/support-tickets/:id/close', async (req, res) => {
  try {
    const { id } = req.params;

    const closed = await SupportTicket.close(id);

    if (!closed) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    res.json({ message: 'Support ticket closed successfully' });
  } catch (error) {
    console.error('Close support ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete support ticket (admin only)
router.delete('/support-tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // For now, just update status to closed (soft delete)
    const closed = await SupportTicket.close(id);

    if (!closed) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    res.json({ message: 'Support ticket deleted successfully' });
  } catch (error) {
    console.error('Delete support ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Categories Management
// Get all categories (admin only)
router.get('/categories', async (req, res) => {
  try {
    const { type, active_only = 'true' } = req.query;

    const categories = await Category.findAll(type, active_only === 'true');
    const stats = await Category.getStats();

    res.json({
      categories,
      stats
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create category (admin only)
router.post('/categories', async (req, res) => {
  try {
    const { type, name, description, is_active } = req.body;

    const categoryId = await Category.create({
      type,
      name,
      description,
      is_active
    });

    res.status(201).json({
      message: 'Category created successfully',
      categoryId
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update category (admin only)
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updated = await Category.update(id, updateData);

    if (!updated) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle category active status (admin only)
router.put('/categories/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const toggled = await Category.toggleActive(id);

    if (!toggled) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category status toggled successfully' });
  } catch (error) {
    console.error('Toggle category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete category (admin only)
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Category.delete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Locations Management
// Get all locations (admin only)
router.get('/locations', async (req, res) => {
  try {
    const { country, active_only = 'true' } = req.query;

    const locations = await Location.findAll(active_only === 'true', country);
    const stats = await Location.getStats();
    const countries = await Location.getCountries();

    res.json({
      locations,
      stats,
      countries
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create location (admin only)
router.post('/locations', async (req, res) => {
  try {
    const { country, state, city, is_active } = req.body;

    const locationId = await Location.create({
      country,
      state,
      city,
      is_active
    });

    res.status(201).json({
      message: 'Location created successfully',
      locationId
    });
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update location (admin only)
router.put('/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { country, state, city, is_active } = req.body;

    const updateData = {};
    if (country) updateData.country = country;
    if (state !== undefined) updateData.state = state;
    if (city) updateData.city = city;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updated = await Location.update(id, updateData);

    if (!updated) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle location active status (admin only)
router.put('/locations/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const toggled = await Location.toggleActive(id);

    if (!toggled) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json({ message: 'Location status toggled successfully' });
  } catch (error) {
    console.error('Toggle location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete location (admin only)
router.delete('/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Location.delete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Email Templates Management
// Get all email templates (admin only)
router.get('/email-templates', async (req, res) => {
  try {
    const { active_only = 'true' } = req.query;

    const templates = await EmailTemplate.findAll(active_only === 'true');

    res.json({ templates });
  } catch (error) {
    console.error('Get email templates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create email template (admin only)
router.post('/email-templates', async (req, res) => {
  try {
    const { name, subject, body, variables, is_active } = req.body;

    const templateId = await EmailTemplate.create({
      name,
      subject,
      body,
      variables,
      is_active
    });

    res.status(201).json({
      message: 'Email template created successfully',
      templateId
    });
  } catch (error) {
    console.error('Create email template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update email template (admin only)
router.put('/email-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, body, variables, is_active } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (subject) updateData.subject = subject;
    if (body) updateData.body = body;
    if (variables !== undefined) updateData.variables = variables;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updated = await EmailTemplate.update(id, updateData);

    if (!updated) {
      return res.status(404).json({ message: 'Email template not found' });
    }

    res.json({ message: 'Email template updated successfully' });
  } catch (error) {
    console.error('Update email template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle email template active status (admin only)
router.put('/email-templates/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const toggled = await EmailTemplate.toggleActive(id);

    if (!toggled) {
      return res.status(404).json({ message: 'Email template not found' });
    }

    res.json({ message: 'Email template status toggled successfully' });
  } catch (error) {
    console.error('Toggle email template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete email template (admin only)
router.delete('/email-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await EmailTemplate.delete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Email template not found' });
    }

    res.json({ message: 'Email template deleted successfully' });
  } catch (error) {
    console.error('Delete email template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// SMS Settings Management
// Get all SMS settings (admin only)
router.get('/sms-settings', async (req, res) => {
  try {
    const settings = await SMSSettings.findAll();

    res.json({ settings });
  } catch (error) {
    console.error('Get SMS settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create SMS settings (admin only)
router.post('/sms-settings', async (req, res) => {
  try {
    const { provider, api_key, api_secret, sender_id, is_active } = req.body;

    const settingsId = await SMSSettings.create({
      provider,
      api_key,
      api_secret,
      sender_id,
      is_active
    });

    res.status(201).json({
      message: 'SMS settings created successfully',
      settingsId
    });
  } catch (error) {
    console.error('Create SMS settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update SMS settings (admin only)
router.put('/sms-settings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { provider, api_key, api_secret, sender_id, is_active } = req.body;

    const updateData = {};
    if (provider) updateData.provider = provider;
    if (api_key) updateData.api_key = api_key;
    if (api_secret !== undefined) updateData.api_secret = api_secret;
    if (sender_id !== undefined) updateData.sender_id = sender_id;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updated = await SMSSettings.update(id, updateData);

    if (!updated) {
      return res.status(404).json({ message: 'SMS settings not found' });
    }

    res.json({ message: 'SMS settings updated successfully' });
  } catch (error) {
    console.error('Update SMS settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Set SMS settings as active (admin only)
router.put('/sms-settings/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;

    const activated = await SMSSettings.setActive(id);

    if (!activated) {
      return res.status(404).json({ message: 'SMS settings not found' });
    }

    res.json({ message: 'SMS settings activated successfully' });
  } catch (error) {
    console.error('Activate SMS settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test SMS settings (admin only)
router.post('/sms-settings/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const { phone_number, message } = req.body;

    const settings = await SMSSettings.findById(id);

    if (!settings) {
      return res.status(404).json({ message: 'SMS settings not found' });
    }

    const result = await settings.testSMS(phone_number, message);

    res.json({
      message: 'SMS test completed',
      result
    });
  } catch (error) {
    console.error('Test SMS settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete SMS settings (admin only)
router.delete('/sms-settings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await SMSSettings.delete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'SMS settings not found' });
    }

    res.json({ message: 'SMS settings deleted successfully' });
  } catch (error) {
    console.error('Delete SMS settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// API Keys Management
// Get all API keys (admin only)
router.get('/api-keys', async (req, res) => {
  try {
    const keys = await APIKey.findAll();

    res.json({ keys });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create API key (admin only)
router.post('/api-keys', async (req, res) => {
  try {
    const { name, permissions, is_active } = req.body;

    const result = await APIKey.create({
      name,
      permissions,
      is_active
    });

    res.status(201).json({
      message: 'API key created successfully',
      api_key: result.api_key,
      api_secret: result.api_secret,
      keyId: result.id
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update API key (admin only)
router.put('/api-keys/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions, is_active } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (permissions) updateData.permissions = permissions;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updated = await APIKey.update(id, updateData);

    if (!updated) {
      return res.status(404).json({ message: 'API key not found' });
    }

    res.json({ message: 'API key updated successfully' });
  } catch (error) {
    console.error('Update API key error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Regenerate API key secret (admin only)
router.post('/api-keys/:id/regenerate', async (req, res) => {
  try {
    const { id } = req.params;

    const newSecret = await APIKey.regenerateSecret(id);

    if (!newSecret) {
      return res.status(404).json({ message: 'API key not found' });
    }

    res.json({
      message: 'API key secret regenerated successfully',
      new_secret: newSecret
    });
  } catch (error) {
    console.error('Regenerate API key secret error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle API key active status (admin only)
router.put('/api-keys/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const toggled = await APIKey.toggleActive(id);

    if (!toggled) {
      return res.status(404).json({ message: 'API key not found' });
    }

    res.json({ message: 'API key status toggled successfully' });
  } catch (error) {
    console.error('Toggle API key error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete API key (admin only)
router.delete('/api-keys/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await APIKey.delete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'API key not found' });
    }

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
