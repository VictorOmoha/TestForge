const express = require('express');
const { pgPool } = require('../config/database');
const { protect } = require('../middleware/auth');
const Question = require('../models/Question');
const { logger } = require('../utils/logger');

const router = express.Router();

// @route   GET /api/results/history
// @desc    Get user's test history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, test_type, difficulty } = req.query;

    const offset = (page - 1) * limit;
    const whereConditions = ['ta.user_id = $1'];
    const queryParams = [userId];
    let paramCount = 1;

    if (test_type) {
      whereConditions.push(`tc.test_type = $${++paramCount}`);
      queryParams.push(test_type);
    }

    if (difficulty) {
      whereConditions.push(`tc.difficulty = $${++paramCount}`);
      queryParams.push(difficulty);
    }

    // Get test attempts with configuration details
    const result = await pgPool.query(
      `SELECT 
        ta.id,
        ta.score,
        ta.start_time,
        ta.end_time,
        ta.status,
        ta.time_spent_seconds,
        tc.test_type,
        tc.difficulty,
        tc.num_questions
       FROM test_attempts ta
       JOIN test_configurations tc ON ta.config_id = tc.id
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY ta.start_time DESC
       LIMIT $${++paramCount} OFFSET $${++paramCount}`,
      [...queryParams, limit, offset]
    );

    // Get total count for pagination
    const countResult = await pgPool.query(
      `SELECT COUNT(*) as total
       FROM test_attempts ta
       JOIN test_configurations tc ON ta.config_id = tc.id
       WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        attempts: result.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: total,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching test history'
    });
  }
});

// @route   GET /api/results/:attemptId
// @desc    Get detailed results for a specific test attempt
// @access  Private
router.get('/:attemptId', protect, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;

    // Get attempt details
    const attemptResult = await pgPool.query(
      `SELECT 
        ta.*,
        tc.test_type,
        tc.difficulty,
        tc.num_questions,
        tc.question_types
       FROM test_attempts ta
       JOIN test_configurations tc ON ta.config_id = tc.id
       WHERE ta.id = $1 AND ta.user_id = $2`,
      [attemptId, userId]
    );

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Test attempt not found'
      });
    }

    const attempt = attemptResult.rows[0];

    // Get questions with answers
    const questions = await Question.getByAttempt(attemptId);

    // Calculate additional statistics
    const questionStats = questions.reduce((stats, q) => {
      if (q.isCorrect) {
        stats.correct++;
      } else {
        stats.incorrect++;
      }
      stats.totalTime += q.timeSpentSeconds || 0;
      return stats;
    }, { correct: 0, incorrect: 0, totalTime: 0 });

    const averageTimePerQuestion = questions.length > 0 ? questionStats.totalTime / questions.length : 0;

    res.json({
      success: true,
      data: {
        attempt: {
          id: attempt.id,
          score: attempt.score,
          start_time: attempt.start_time,
          end_time: attempt.end_time,
          status: attempt.status,
          time_spent_seconds: attempt.time_spent_seconds,
          test_type: attempt.test_type,
          difficulty: attempt.difficulty,
          num_questions: attempt.num_questions,
          question_types: attempt.question_types
        },
        questions: questions.map(q => ({
          id: q._id,
          questionText: q.questionText,
          questionType: q.questionType,
          userAnswer: q.userAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect: q.isCorrect,
          explanation: q.aiExplanation,
          timeSpentSeconds: q.timeSpentSeconds,
          questionOrder: q.questionOrder
        })),
        statistics: {
          total_questions: questions.length,
          correct_answers: questionStats.correct,
          incorrect_answers: questionStats.incorrect,
          accuracy_percentage: questions.length > 0 ? (questionStats.correct / questions.length) * 100 : 0,
          average_time_per_question: averageTimePerQuestion
        }
      }
    });
  } catch (error) {
    logger.error('Get result error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching test result'
    });
  }
});

// @route   GET /api/results/analytics/summary
// @desc    Get user's performance summary
// @access  Private
router.get('/analytics/summary', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get overall statistics
    const overallStats = await pgPool.query(
      `SELECT 
        COUNT(*) as total_attempts,
        AVG(score) as average_score,
        MAX(score) as best_score,
        SUM(time_spent_seconds) as total_time_spent
       FROM test_attempts 
       WHERE user_id = $1 AND status = 'Completed'`,
      [userId]
    );

    // Get performance by test type
    const testTypeStats = await pgPool.query(
      `SELECT 
        tc.test_type,
        COUNT(*) as attempts,
        AVG(ta.score) as average_score,
        MAX(ta.score) as best_score
       FROM test_attempts ta
       JOIN test_configurations tc ON ta.config_id = tc.id
       WHERE ta.user_id = $1 AND ta.status = 'Completed'
       GROUP BY tc.test_type
       ORDER BY attempts DESC`,
      [userId]
    );

    // Get performance by difficulty
    const difficultyStats = await pgPool.query(
      `SELECT 
        tc.difficulty,
        COUNT(*) as attempts,
        AVG(ta.score) as average_score,
        MAX(ta.score) as best_score
       FROM test_attempts ta
       JOIN test_configurations tc ON ta.config_id = tc.id
       WHERE ta.user_id = $1 AND ta.status = 'Completed'
       GROUP BY tc.difficulty
       ORDER BY tc.difficulty`,
      [userId]
    );

    // Get recent performance trend (last 10 attempts)
    const recentTrend = await pgPool.query(
      `SELECT 
        ta.score,
        ta.start_time,
        tc.test_type,
        tc.difficulty
       FROM test_attempts ta
       JOIN test_configurations tc ON ta.config_id = tc.id
       WHERE ta.user_id = $1 AND ta.status = 'Completed'
       ORDER BY ta.start_time DESC
       LIMIT 10`,
      [userId]
    );

    const overall = overallStats.rows[0];
    const totalHours = Math.floor(overall.total_time_spent / 3600);
    const totalMinutes = Math.floor((overall.total_time_spent % 3600) / 60);

    res.json({
      success: true,
      data: {
        overall: {
          total_attempts: parseInt(overall.total_attempts),
          average_score: parseFloat(overall.average_score || 0).toFixed(2),
          best_score: parseFloat(overall.best_score || 0).toFixed(2),
          total_time_spent: {
            seconds: parseInt(overall.total_time_spent || 0),
            formatted: `${totalHours}h ${totalMinutes}m`
          }
        },
        by_test_type: testTypeStats.rows.map(row => ({
          test_type: row.test_type,
          attempts: parseInt(row.attempts),
          average_score: parseFloat(row.average_score || 0).toFixed(2),
          best_score: parseFloat(row.best_score || 0).toFixed(2)
        })),
        by_difficulty: difficultyStats.rows.map(row => ({
          difficulty: row.difficulty,
          attempts: parseInt(row.attempts),
          average_score: parseFloat(row.average_score || 0).toFixed(2),
          best_score: parseFloat(row.best_score || 0).toFixed(2)
        })),
        recent_trend: recentTrend.rows.map(row => ({
          score: parseFloat(row.score).toFixed(2),
          date: row.start_time,
          test_type: row.test_type,
          difficulty: row.difficulty
        }))
      }
    });
  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching analytics'
    });
  }
});

module.exports = router;


