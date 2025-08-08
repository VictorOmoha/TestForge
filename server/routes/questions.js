const express = require('express');
const { pgPool } = require('../config/database');
const { protect } = require('../middleware/auth');
const Question = require('../models/Question');
const { logger } = require('../utils/logger');

const router = express.Router();

// @route   GET /api/questions/:attemptId
// @desc    Get questions for a test attempt
// @access  Private
router.get('/:attemptId', protect, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;

    // Verify attempt belongs to user
    const attemptResult = await pgPool.query(
      'SELECT * FROM test_attempts WHERE id = $1 AND user_id = $2',
      [attemptId, userId]
    );

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Test attempt not found'
      });
    }

    const attempt = attemptResult.rows[0];

    // Get questions from MongoDB
    const questions = await Question.getByAttempt(attemptId);

    res.json({
      success: true,
      data: {
        attempt: {
          id: attempt.id,
          status: attempt.status,
          start_time: attempt.start_time,
          time_spent_seconds: attempt.time_spent_seconds
        },
        questions: questions.map(q => ({
          id: q._id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          questionOrder: q.questionOrder,
          userAnswer: q.userAnswer || null
        }))
      }
    });
  } catch (error) {
    logger.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching questions'
    });
  }
});

// @route   PUT /api/questions/:questionId/answer
// @desc    Update answer for a specific question
// @access  Private
router.put('/:questionId/answer', protect, async (req, res) => {
  try {
    const { questionId } = req.params;
    const { answer, timeSpent } = req.body;
    const userId = req.user.id;

    // Get question and verify ownership
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    // Verify attempt belongs to user
    const attemptResult = await pgPool.query(
      'SELECT * FROM test_attempts WHERE id = $1 AND user_id = $2',
      [question.attemptId, userId]
    );

    if (attemptResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Update question with answer
    question.markAsAnswered(answer, timeSpent);
    await question.save();

    res.json({
      success: true,
      message: 'Answer saved successfully',
      data: {
        question: {
          id: question._id,
          userAnswer: question.userAnswer,
          timeSpentSeconds: question.timeSpentSeconds
        }
      }
    });
  } catch (error) {
    logger.error('Update answer error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating answer'
    });
  }
});

// @route   GET /api/questions/weak-areas
// @desc    Get user's weak areas based on incorrect answers
// @access  Private
router.get('/weak-areas', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 5 } = req.query;

    // Get weak areas from MongoDB
    const weakAreas = await Question.getWeakAreas(userId, parseInt(limit));

    res.json({
      success: true,
      data: {
        weak_areas: weakAreas.map(area => ({
          topic: area._id,
          incorrect_count: area.count,
          total_questions: area.totalQuestions,
          accuracy_percentage: ((area.totalQuestions - area.count) / area.totalQuestions * 100).toFixed(2)
        }))
      }
    });
  } catch (error) {
    logger.error('Get weak areas error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching weak areas'
    });
  }
});

module.exports = router;


