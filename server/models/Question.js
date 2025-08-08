const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  attemptId: {
    type: String,
    required: true,
    index: true
  },
  questionText: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    enum: ['MCQ', 'TrueFalse', 'ShortAnswer'],
    required: true
  },
  options: [{
    type: String
  }],
  correctAnswer: {
    type: String,
    required: true
  },
  userAnswer: {
    type: String
  },
  aiExplanation: {
    type: String
  },
  isCorrect: {
    type: Boolean
  },
  timeSpentSeconds: {
    type: Number,
    default: 0
  },
  questionOrder: {
    type: Number,
    required: true
  },
  metadata: {
    testType: String,
    difficulty: String,
    topic: String,
    subtopic: String,
    aiModel: String,
    promptUsed: String,
    generationTime: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
questionSchema.index({ attemptId: 1, questionOrder: 1 });
questionSchema.index({ 'metadata.testType': 1, 'metadata.difficulty': 1 });
questionSchema.index({ createdAt: -1 });

// Virtual for calculating score percentage
questionSchema.virtual('scorePercentage').get(function() {
  if (this.isCorrect === null || this.isCorrect === undefined) {
    return null;
  }
  return this.isCorrect ? 100 : 0;
});

// Method to mark as answered
questionSchema.methods.markAsAnswered = function(userAnswer, timeSpent) {
  this.userAnswer = userAnswer;
  this.timeSpentSeconds = timeSpent || this.timeSpentSeconds;
  return this;
};

// Method to evaluate answer
questionSchema.methods.evaluateAnswer = function() {
  if (!this.userAnswer) {
    this.isCorrect = false;
    return false;
  }

  // For MCQ and TrueFalse, exact match
  if (this.questionType === 'MCQ' || this.questionType === 'TrueFalse') {
    this.isCorrect = this.userAnswer.trim().toLowerCase() === this.correctAnswer.trim().toLowerCase();
  } else if (this.questionType === 'ShortAnswer') {
    // For short answer, use similarity matching (basic implementation)
    const similarity = this.calculateSimilarity(this.userAnswer, this.correctAnswer);
    this.isCorrect = similarity > 0.7; // 70% similarity threshold
  }

  return this.isCorrect;
};

// Basic similarity calculation (can be enhanced with NLP libraries)
questionSchema.methods.calculateSimilarity = function(str1, str2) {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return intersection.length / union.length;
};

// Static method to get questions by attempt
questionSchema.statics.getByAttempt = function(attemptId) {
  return this.find({ attemptId }).sort({ questionOrder: 1 });
};

// Static method to get questions by test type and difficulty
questionSchema.statics.getByTypeAndDifficulty = function(testType, difficulty) {
  return this.find({
    'metadata.testType': testType,
    'metadata.difficulty': difficulty
  });
};

// Static method to get user's weak areas
questionSchema.statics.getWeakAreas = function(userId, limit = 5) {
  return this.aggregate([
    {
      $match: {
        'metadata.userId': userId,
        isCorrect: false
      }
    },
    {
      $group: {
        _id: '$metadata.topic',
        count: { $sum: 1 },
        totalQuestions: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

module.exports = mongoose.model('Question', questionSchema);

