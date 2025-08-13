const express = require('express');
const { body, validationResult } = require('express-validator');
const { pgPool } = require('../config/database');
const { protect } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pgPool.query(
      'SELECT id, email, name, age, education_level, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: result.rows[0]
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('age').optional().isInt({ min: 13, max: 120 }).withMessage('Age must be between 13 and 120'),
  body('education_level').optional().isIn(['High School', 'Bachelor', 'Master', 'PhD', 'Other']).withMessage('Invalid education level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { name, age, education_level } = req.body;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (age !== undefined) {
      updates.push(`age = $${paramCount++}`);
      values.push(age);
    }

    if (education_level !== undefined) {
      updates.push(`education_level = $${paramCount++}`);
      values.push(education_level);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    values.push(userId);

    const result = await pgPool.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount}
       RETURNING id, email, name, age, education_level, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    logger.info(`Profile updated for user: ${userId}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: result.rows[0]
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating profile'
    });
  }
});

// @route   DELETE /api/users/profile
// @desc    Delete user account
// @access  Private
router.delete('/profile', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete user (cascade will handle related data)
    const result = await pgPool.query(
      'DELETE FROM users WHERE id = $1 RETURNING email',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    logger.info(`User account deleted: ${result.rows[0].email}`);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    logger.error('Delete profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting account'
    });
  }
});

module.exports = router;








