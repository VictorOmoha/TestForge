const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { pgPool } = require('../config/database');
const { protect } = require('../middleware/auth');
const aiService = require('../services/aiService');
const Question = require('../models/Question');
const { logger } = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validateTestConfig = [
  body('test_type').isIn(['Math', 'Science', 'Programming', 'History', 'English', 'Geography']).withMessage('Invalid test type'),
  body('difficulty').isIn(['Easy', 'Medium', 'Hard']).withMessage('Invalid difficulty level'),
  body('num_questions').isInt({ min: 10, max: 50 }).withMessage('Number of questions must be between 10 and 50'),
  body('duration_minutes').optional().isInt({ min: 5, max: 180 }).withMessage('Duration must be between 5 and 180 minutes'),
  body('question_types').optional().isArray().withMessage('Question types must be an array')
];

// @route   POST /api/tests/configure
// @desc    Create a new test configuration
// @access  Private
router.post('/configure', protect, validateTestConfig, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      test_type,
      difficulty,
      num_questions,
      duration_minutes = 30,
      question_types = ['MCQ']
    } = req.body;

    const userId = req.user.id;

    // Create test configuration
    const result = await pgPool.query(
      `INSERT INTO test_configurations 
       (user_id, test_type, difficulty, num_questions, duration_minutes, question_types)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, test_type, difficulty, num_questions, duration_minutes, question_types]
    );

    const config = result.rows[0];

    logger.info(`Test configuration created: ${config.id} for user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Test configuration created successfully',
      data: {
        config: {
          id: config.id,
          test_type: config.test_type,
          difficulty: config.difficulty,
          num_questions: config.num_questions,
          duration_minutes: config.duration_minutes,
          question_types: config.question_types,
          created_at: config.created_at
        }
      }
    });
  } catch (error) {
    logger.error('Test configuration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during test configuration'
    });
  }
});

// @route   POST /api/tests/generate
// @desc    Generate questions for a test
// @access  Private
router.post('/generate', protect, [
  body('config_id').isUUID().withMessage('Valid configuration ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { config_id } = req.body;
    const userId = req.user.id;

    // Get test configuration
    const configResult = await pgPool.query(
      'SELECT * FROM test_configurations WHERE id = $1 AND user_id = $2',
      [config_id, userId]
    );

    if (configResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Test configuration not found'
      });
    }

    const config = configResult.rows[0];

    // Generate questions using AI
    const aiResult = await aiService.generateQuestions(
      config.test_type,
      config.difficulty,
      config.num_questions,
      config.question_types
    );

    // Create test attempt
    const attemptResult = await pgPool.query(
      `INSERT INTO test_attempts 
       (user_id, config_id, status)
       VALUES ($1, $2, 'InProgress')
       RETURNING *`,
      [userId, config_id]
    );

    const attempt = attemptResult.rows[0];

    // Store questions in MongoDB
    const questions = aiResult.questions.map((q, index) => ({
      attemptId: attempt.id,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options,
      correctAnswer: q.correctAnswer,
      aiExplanation: q.aiExplanation,
      questionOrder: index + 1,
      metadata: {
        testType: config.test_type,
        difficulty: config.difficulty,
        userId: userId,
        aiModel: aiService.model,
        generationTime: aiResult.generationTime
      }
    }));

    await Question.insertMany(questions);

    logger.info(`Test generated: ${attempt.id} with ${questions.length} questions`);

    res.json({
      success: true,
      message: 'Test generated successfully',
      data: {
        attempt: {
          id: attempt.id,
          config_id: attempt.config_id,
          status: attempt.status,
          start_time: attempt.start_time
        },
        questions: questions.map(q => ({
          id: q._id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          questionOrder: q.questionOrder
        })),
        generation_time: aiResult.generationTime,
        cached: aiResult.cached
      }
    });
  } catch (error) {
    logger.error('Test generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during test generation'
    });
  }
});

// @route   GET /api/tests/:attemptId/questions
// @desc    Get questions for a test attempt
// @access  Private
router.get('/:attemptId/questions', protect, async (req, res) => {
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
          questionOrder: q.questionOrder
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

// @route   POST /api/tests/:attemptId/submit
// @desc    Submit test answers and get results
// @access  Private
router.post('/:attemptId/submit', protect, [
  body('answers').isArray().withMessage('Answers must be an array'),
  body('time_spent_seconds').isInt({ min: 0 }).withMessage('Time spent must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { attemptId } = req.params;
    const { answers, time_spent_seconds } = req.body;
    const userId = req.user.id;

    // Verify attempt belongs to user and is in progress
    const attemptResult = await pgPool.query(
      'SELECT * FROM test_attempts WHERE id = $1 AND user_id = $2 AND status = $3',
      [attemptId, userId, 'InProgress']
    );

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Test attempt not found or already completed'
      });
    }

    const attempt = attemptResult.rows[0];

    // Get questions
    const questions = await Question.getByAttempt(attemptId);

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No questions found for this attempt'
      });
    }

    // Update questions with user answers
    const updatedQuestions = questions.map((question, index) => {
      const userAnswer = answers[index] || '';
      return question.markAsAnswered(userAnswer, time_spent_seconds / questions.length);
    });

    // Evaluate answers
    const scoredQuestions = updatedQuestions.map(q => {
      q.evaluateAnswer();
      return q;
    });

    // Save updated questions
    await Promise.all(scoredQuestions.map(q => q.save()));

    // Calculate final score
    const correctAnswers = scoredQuestions.filter(q => q.isCorrect).length;
    const totalQuestions = scoredQuestions.length;
    const score = (correctAnswers / totalQuestions) * 100;

    // Update attempt
    await pgPool.query(
      `UPDATE test_attempts 
       SET score = $1, end_time = CURRENT_TIMESTAMP, status = 'Completed', time_spent_seconds = $2
       WHERE id = $3`,
      [score, time_spent_seconds, attemptId]
    );

    // Update analytics
    await updateUserAnalytics(userId, attempt.config_id, score, time_spent_seconds);

    // Generate explanations for incorrect answers
    const questionsWithExplanations = await aiService.generateExplanations(scoredQuestions);

    logger.info(`Test submitted: ${attemptId}, Score: ${score}%`);

    res.json({
      success: true,
      message: 'Test submitted successfully',
      data: {
        attempt: {
          id: attemptId,
          score: score,
          correct_answers: correctAnswers,
          total_questions: totalQuestions,
          time_spent_seconds: time_spent_seconds
        },
        questions: questionsWithExplanations.map(q => ({
          id: q._id,
          questionText: q.questionText,
          questionType: q.questionType,
          userAnswer: q.userAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect: q.isCorrect,
          explanation: q.explanation || q.aiExplanation
        }))
      }
    });
  } catch (error) {
    logger.error('Test submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during test submission'
    });
  }
});

// @route   POST /api/tests/:attemptId/save-progress
// @desc    Save test progress (for save-and-resume functionality)
// @access  Private
router.post('/:attemptId/save-progress', protect, [
  body('answers').isArray().withMessage('Answers must be an array'),
  body('current_question').isInt({ min: 1 }).withMessage('Current question must be a positive integer'),
  body('time_spent_seconds').isInt({ min: 0 }).withMessage('Time spent must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { attemptId } = req.params;
    const { answers, current_question, time_spent_seconds } = req.body;
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

    // Update questions with partial answers
    const questions = await Question.getByAttempt(attemptId);
    
    for (let i = 0; i < answers.length; i++) {
      if (answers[i] !== undefined && answers[i] !== null) {
        const question = questions[i];
        question.markAsAnswered(answers[i]);
        await question.save();
      }
    }

    // Update attempt with progress
    await pgPool.query(
      `UPDATE test_attempts 
       SET time_spent_seconds = $1, status = 'Paused'
       WHERE id = $2`,
      [time_spent_seconds, attemptId]
    );

    logger.info(`Progress saved for attempt: ${attemptId}`);

    res.json({
      success: true,
      message: 'Progress saved successfully',
      data: {
        current_question,
        time_spent_seconds,
        answers_saved: answers.filter(a => a !== undefined && a !== null).length
      }
    });
  } catch (error) {
    logger.error('Save progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while saving progress'
    });
  }
});

// @route   GET /api/tests/configurations
// @desc    Get user's test configurations
// @access  Private
router.get('/configurations', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pgPool.query(
      'SELECT * FROM test_configurations WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      data: {
        configurations: result.rows
      }
    });
  } catch (error) {
    logger.error('Get configurations error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching configurations'
    });
  }
});

// Helper function to update user analytics
async function updateUserAnalytics(userId, configId, score, timeSpent) {
  try {
    // Get config details
    const configResult = await pgPool.query(
      'SELECT test_type, difficulty FROM test_configurations WHERE id = $1',
      [configId]
    );

    if (configResult.rows.length === 0) return;

    const config = configResult.rows[0];

    // Update or insert analytics
    await pgPool.query(
      `INSERT INTO user_analytics 
       (user_id, test_type, difficulty, total_attempts, average_score, best_score, total_time_spent, last_attempt_date)
       VALUES ($1, $2, $3, 1, $4, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, test_type, difficulty)
       DO UPDATE SET
         total_attempts = user_analytics.total_attempts + 1,
         average_score = (user_analytics.average_score * user_analytics.total_attempts + $4) / (user_analytics.total_attempts + 1),
         best_score = GREATEST(user_analytics.best_score, $4),
         total_time_spent = user_analytics.total_time_spent + $5,
         last_attempt_date = CURRENT_TIMESTAMP`,
      [userId, config.test_type, config.difficulty, score, timeSpent]
    );
  } catch (error) {
    logger.error('Analytics update error:', error);
  }
}

module.exports = router;








