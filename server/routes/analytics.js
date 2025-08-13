const express = require('express');
const { pgPool } = require('../config/database');
const { protect } = require('../middleware/auth');
const Question = require('../models/Question');
const { logger } = require('../utils/logger');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get comprehensive analytics dashboard data
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get overall statistics
    const overallStats = await pgPool.query(
      `SELECT 
        COUNT(*) as total_attempts,
        AVG(score) as average_score,
        MAX(score) as best_score,
        MIN(score) as worst_score,
        SUM(time_spent_seconds) as total_time_spent,
        COUNT(CASE WHEN score >= 80 THEN 1 END) as high_performance_count,
        COUNT(CASE WHEN score < 60 THEN 1 END) as low_performance_count
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
        MAX(ta.score) as best_score,
        MIN(ta.score) as worst_score,
        AVG(ta.time_spent_seconds) as avg_time_spent
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
        MAX(ta.score) as best_score,
        MIN(ta.score) as worst_score,
        AVG(ta.time_spent_seconds) as avg_time_spent
       FROM test_attempts ta
       JOIN test_configurations tc ON ta.config_id = tc.id
       WHERE ta.user_id = $1 AND ta.status = 'Completed'
       GROUP BY tc.difficulty
       ORDER BY tc.difficulty`,
      [userId]
    );

    // Get monthly performance trend
    const monthlyTrend = await pgPool.query(
      `SELECT 
        DATE_TRUNC('month', ta.start_time) as month,
        COUNT(*) as attempts,
        AVG(ta.score) as average_score,
        MAX(ta.score) as best_score
       FROM test_attempts ta
       WHERE ta.user_id = $1 AND ta.status = 'Completed'
       GROUP BY DATE_TRUNC('month', ta.start_time)
       ORDER BY month DESC
       LIMIT 12`,
      [userId]
    );

    // Get recent activity (last 7 days)
    const recentActivity = await pgPool.query(
      `SELECT 
        ta.id,
        ta.score,
        ta.start_time,
        ta.time_spent_seconds,
        tc.test_type,
        tc.difficulty
       FROM test_attempts ta
       JOIN test_configurations tc ON ta.config_id = tc.id
       WHERE ta.user_id = $1 
       AND ta.start_time >= CURRENT_DATE - INTERVAL '7 days'
       ORDER BY ta.start_time DESC`,
      [userId]
    );

    // Get weak areas
    const weakAreas = await Question.getWeakAreas(userId, 10);

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
          worst_score: parseFloat(overall.worst_score || 0).toFixed(2),
          total_time_spent: {
            seconds: parseInt(overall.total_time_spent || 0),
            formatted: `${totalHours}h ${totalMinutes}m`
          },
          high_performance_rate: overall.total_attempts > 0 ? 
            ((overall.high_performance_count / overall.total_attempts) * 100).toFixed(2) : 0,
          low_performance_rate: overall.total_attempts > 0 ? 
            ((overall.low_performance_count / overall.total_attempts) * 100).toFixed(2) : 0
        },
        by_test_type: testTypeStats.rows.map(row => ({
          test_type: row.test_type,
          attempts: parseInt(row.attempts),
          average_score: parseFloat(row.average_score || 0).toFixed(2),
          best_score: parseFloat(row.best_score || 0).toFixed(2),
          worst_score: parseFloat(row.worst_score || 0).toFixed(2),
          avg_time_spent: parseFloat(row.avg_time_spent || 0).toFixed(2)
        })),
        by_difficulty: difficultyStats.rows.map(row => ({
          difficulty: row.difficulty,
          attempts: parseInt(row.attempts),
          average_score: parseFloat(row.average_score || 0).toFixed(2),
          best_score: parseFloat(row.best_score || 0).toFixed(2),
          worst_score: parseFloat(row.worst_score || 0).toFixed(2),
          avg_time_spent: parseFloat(row.avg_time_spent || 0).toFixed(2)
        })),
        monthly_trend: monthlyTrend.rows.map(row => ({
          month: row.month,
          attempts: parseInt(row.attempts),
          average_score: parseFloat(row.average_score || 0).toFixed(2),
          best_score: parseFloat(row.best_score || 0).toFixed(2)
        })),
        recent_activity: recentActivity.rows.map(row => ({
          id: row.id,
          score: parseFloat(row.score).toFixed(2),
          start_time: row.start_time,
          time_spent_seconds: parseInt(row.time_spent_seconds),
          test_type: row.test_type,
          difficulty: row.difficulty
        })),
        weak_areas: weakAreas.map(area => ({
          topic: area._id,
          incorrect_count: area.count,
          total_questions: area.totalQuestions,
          accuracy_percentage: ((area.totalQuestions - area.count) / area.totalQuestions * 100).toFixed(2)
        }))
      }
    });
  } catch (error) {
    logger.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching dashboard analytics'
    });
  }
});

// @route   GET /api/analytics/progress
// @desc    Get detailed progress tracking data
// @access  Private
router.get('/progress', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { test_type, difficulty, period = '30' } = req.query;

    let whereConditions = ['ta.user_id = $1', "ta.status = 'Completed'"];
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

    // Get progress over time
    const progressData = await pgPool.query(
      `SELECT 
        ta.id,
        ta.score,
        ta.start_time,
        ta.time_spent_seconds,
        tc.test_type,
        tc.difficulty,
        tc.num_questions
       FROM test_attempts ta
       JOIN test_configurations tc ON ta.config_id = tc.id
       WHERE ${whereConditions.join(' AND ')}
       AND ta.start_time >= CURRENT_DATE - INTERVAL '${period} days'
       ORDER BY ta.start_time ASC`,
      queryParams
    );

    // Calculate improvement metrics
    const scores = progressData.rows.map(row => parseFloat(row.score));
    const improvement = scores.length > 1 ? 
      ((scores[scores.length - 1] - scores[0]) / scores[0] * 100).toFixed(2) : 0;

    // Get consistency metrics
    const averageScore = scores.length > 0 ? 
      (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2) : 0;
    
    const scoreVariance = scores.length > 1 ? 
      Math.sqrt(scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scores.length).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        progress_data: progressData.rows.map(row => ({
          id: row.id,
          score: parseFloat(row.score).toFixed(2),
          date: row.start_time,
          time_spent_seconds: parseInt(row.time_spent_seconds),
          test_type: row.test_type,
          difficulty: row.difficulty,
          num_questions: parseInt(row.num_questions)
        })),
        metrics: {
          total_attempts: scores.length,
          average_score: averageScore,
          improvement_percentage: improvement,
          score_variance: scoreVariance,
          consistency_rating: scoreVariance < 10 ? 'High' : scoreVariance < 20 ? 'Medium' : 'Low'
        }
      }
    });
  } catch (error) {
    logger.error('Get progress analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching progress analytics'
    });
  }
});

// @route   GET /api/analytics/performance-comparison
// @desc    Compare performance across different test types and difficulties
// @access  Private
router.get('/performance-comparison', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get performance comparison by test type and difficulty
    const comparisonData = await pgPool.query(
      `SELECT 
        tc.test_type,
        tc.difficulty,
        COUNT(*) as attempts,
        AVG(ta.score) as average_score,
        MAX(ta.score) as best_score,
        MIN(ta.score) as worst_score,
        AVG(ta.time_spent_seconds) as avg_time_spent,
        STDDEV(ta.score) as score_stddev
       FROM test_attempts ta
       JOIN test_configurations tc ON ta.config_id = tc.id
       WHERE ta.user_id = $1 AND ta.status = 'Completed'
       GROUP BY tc.test_type, tc.difficulty
       ORDER BY tc.test_type, tc.difficulty`,
      [userId]
    );

    // Calculate relative performance
    const overallAvg = await pgPool.query(
      `SELECT AVG(score) as overall_average
       FROM test_attempts 
       WHERE user_id = $1 AND status = 'Completed'`,
      [userId]
    );

    const overallAverage = parseFloat(overallAvg.rows[0]?.overall_average || 0);

    res.json({
      success: true,
      data: {
        comparison: comparisonData.rows.map(row => ({
          test_type: row.test_type,
          difficulty: row.difficulty,
          attempts: parseInt(row.attempts),
          average_score: parseFloat(row.average_score || 0).toFixed(2),
          best_score: parseFloat(row.best_score || 0).toFixed(2),
          worst_score: parseFloat(row.worst_score || 0).toFixed(2),
          avg_time_spent: parseFloat(row.avg_time_spent || 0).toFixed(2),
          score_stddev: parseFloat(row.score_stddev || 0).toFixed(2),
          relative_performance: overallAverage > 0 ? 
            ((parseFloat(row.average_score || 0) - overallAverage) / overallAverage * 100).toFixed(2) : 0
        })),
        overall_average: overallAverage.toFixed(2)
      }
    });
  } catch (error) {
    logger.error('Get performance comparison error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching performance comparison'
    });
  }
});

module.exports = router;








