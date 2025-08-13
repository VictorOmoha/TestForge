const OpenAI = require('openai');
const crypto = require('crypto');
const { pgPool } = require('../config/database');
const { logger } = require('../utils/logger');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIService {
  constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
    this.maxTokens = 2000;
    this.temperature = 0.7;
  }

  // Generate hash for prompt caching
  generatePromptHash(prompt) {
    return crypto.createHash('sha256').update(prompt).digest('hex');
  }

  // Check cache for existing prompt
  async checkCache(promptHash) {
    try {
      const result = await pgPool.query(
        'SELECT response_text, usage_count FROM ai_prompt_cache WHERE prompt_hash = $1',
        [promptHash]
      );
      
      if (result.rows.length > 0) {
        // Update usage count
        await pgPool.query(
          'UPDATE ai_prompt_cache SET usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP WHERE prompt_hash = $1',
          [promptHash]
        );
        
        return result.rows[0];
      }
      return null;
    } catch (error) {
      logger.error('Cache check error:', error);
      return null;
    }
  }

  // Cache prompt and response
  async cachePrompt(promptHash, promptText, responseText, metadata) {
    try {
      await pgPool.query(
        `INSERT INTO ai_prompt_cache 
         (prompt_hash, prompt_text, response_text, test_type, difficulty, num_questions)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [promptHash, promptText, responseText, metadata.testType, metadata.difficulty, metadata.numQuestions]
      );
    } catch (error) {
      logger.error('Cache storage error:', error);
    }
  }

  // Generate questions using AI
  async generateQuestions(testType, difficulty, numQuestions, questionTypes = ['MCQ']) {
    const startTime = Date.now();
    
    try {
      // Create prompt based on test configuration
      const prompt = this.createQuestionPrompt(testType, difficulty, numQuestions, questionTypes);
      const promptHash = this.generatePromptHash(prompt);

      // Check cache first
      const cached = await this.checkCache(promptHash);
      if (cached) {
        logger.info(`Using cached questions for ${testType} ${difficulty}`);
        return {
          questions: JSON.parse(cached.response_text),
          cached: true,
          generationTime: Date.now() - startTime
        };
      }

      // Generate questions using OpenAI
      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content creator. Generate high-quality, accurate questions that test understanding and knowledge.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      const response = completion.choices[0].message.content;
      
      // Parse and validate response
      const questions = this.parseQuestions(response, questionTypes);
      
      // Cache the result
      await this.cachePrompt(promptHash, prompt, response, {
        testType,
        difficulty,
        numQuestions
      });

      logger.info(`Generated ${questions.length} questions for ${testType} ${difficulty} in ${Date.now() - startTime}ms`);

      return {
        questions,
        cached: false,
        generationTime: Date.now() - startTime
      };
    } catch (error) {
      logger.error('Question generation error:', error);
      throw new Error(`Failed to generate questions: ${error.message}`);
    }
  }

  // Create prompt for question generation
  createQuestionPrompt(testType, difficulty, numQuestions, questionTypes) {
    const difficultyMap = {
      'Easy': 'basic concepts suitable for beginners',
      'Medium': 'intermediate concepts requiring some analysis',
      'Hard': 'advanced concepts requiring deep understanding and critical thinking'
    };

    const typeInstructions = questionTypes.map(type => {
      switch (type) {
        case 'MCQ':
          return 'multiple choice questions with 4 options (A, B, C, D)';
        case 'TrueFalse':
          return 'true/false questions';
        case 'ShortAnswer':
          return 'short answer questions requiring brief explanations';
        default:
          return type;
      }
    }).join(', ');

    return `Generate ${numQuestions} ${difficulty.toLowerCase()} ${testType} questions. 
    
Requirements:
- Difficulty: ${difficultyMap[difficulty]}
- Question types: ${typeInstructions}
- Ensure questions are accurate and educational
- Include a mix of topics within ${testType}
- For MCQ questions, provide exactly 4 options labeled A, B, C, D
- For True/False questions, provide clear statements
- For Short Answer questions, provide concise answers

Format the response as a JSON array:
[
  {
    "question": "Question text here",
    "type": "MCQ|TrueFalse|ShortAnswer",
    "options": ["A", "B", "C", "D"] (only for MCQ),
    "correctAnswer": "Correct answer here",
    "explanation": "Brief explanation of why this is correct"
  }
]

Focus on ${testType} topics and ensure ${difficulty} level complexity.`;
  }

  // Parse and validate AI response
  parseQuestions(response, expectedTypes) {
    try {
      // Extract JSON from response (handle markdown formatting)
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in response');
      }

      const questions = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }

      // Validate each question
      const validatedQuestions = questions.map((q, index) => {
        if (!q.question || !q.correctAnswer) {
          throw new Error(`Question ${index + 1} missing required fields`);
        }

        if (!expectedTypes.includes(q.type)) {
          throw new Error(`Question ${index + 1} has invalid type: ${q.type}`);
        }

        // Validate MCQ questions have options
        if (q.type === 'MCQ' && (!q.options || !Array.isArray(q.options) || q.options.length !== 4)) {
          throw new Error(`Question ${index + 1} (MCQ) must have exactly 4 options`);
        }

        return {
          questionText: q.question,
          questionType: q.type,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          aiExplanation: q.explanation || ''
        };
      });

      return validatedQuestions;
    } catch (error) {
      logger.error('Question parsing error:', error);
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  // Score user answers
  async scoreAnswers(questions, userAnswers) {
    try {
      const scoredQuestions = questions.map((question, index) => {
        const userAnswer = userAnswers[index] || '';
        let isCorrect = false;
        let score = 0;

        switch (question.questionType) {
          case 'MCQ':
          case 'TrueFalse':
            isCorrect = userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
            score = isCorrect ? 100 : 0;
            break;
          
          case 'ShortAnswer':
            // Use AI to evaluate short answers
            isCorrect = this.evaluateShortAnswer(userAnswer, question.correctAnswer);
            score = isCorrect ? 100 : 0;
            break;
        }

        return {
          ...question,
          userAnswer,
          isCorrect,
          score
        };
      });

      const totalScore = scoredQuestions.reduce((sum, q) => sum + q.score, 0);
      const averageScore = totalScore / scoredQuestions.length;

      return {
        questions: scoredQuestions,
        totalScore,
        averageScore,
        correctAnswers: scoredQuestions.filter(q => q.isCorrect).length,
        totalQuestions: scoredQuestions.length
      };
    } catch (error) {
      logger.error('Answer scoring error:', error);
      throw new Error(`Failed to score answers: ${error.message}`);
    }
  }

  // Evaluate short answer using AI
  async evaluateShortAnswer(userAnswer, correctAnswer) {
    try {
      const prompt = `Evaluate if the user's answer is correct compared to the expected answer.

User Answer: "${userAnswer}"
Expected Answer: "${correctAnswer}"

Consider:
- Key concepts and facts
- Acceptable variations in wording
- Partial credit for partially correct answers

Respond with only "CORRECT" or "INCORRECT".`;

      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert evaluator. Be fair but strict in your assessment.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 10,
        temperature: 0.1,
      });

      const response = completion.choices[0].message.content.trim().toUpperCase();
      return response === 'CORRECT';
    } catch (error) {
      logger.error('Short answer evaluation error:', error);
      // Fallback to basic similarity check
      return this.calculateSimilarity(userAnswer, correctAnswer) > 0.7;
    }
  }

  // Basic similarity calculation (fallback)
  calculateSimilarity(str1, str2) {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  // Generate explanations for incorrect answers
  async generateExplanations(questions) {
    try {
      const explanations = await Promise.all(
        questions.map(async (question) => {
          if (question.isCorrect) {
            return question.aiExplanation || 'Correct answer!';
          }

          const prompt = `The user answered "${question.userAnswer}" but the correct answer is "${question.correctAnswer}".

Question: ${question.questionText}

Please provide a brief, helpful explanation of why the correct answer is right and what the user might have misunderstood.`;

          try {
            const completion = await openai.chat.completions.create({
              model: this.model,
              messages: [
                {
                  role: 'system',
                  content: 'You are a helpful tutor explaining concepts clearly and encouragingly.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              max_tokens: 150,
              temperature: 0.7,
            });

            return completion.choices[0].message.content;
          } catch (error) {
            logger.error('Explanation generation error:', error);
            return 'Explanation not available at this time.';
          }
        })
      );

      return questions.map((question, index) => ({
        ...question,
        explanation: explanations[index]
      }));
    } catch (error) {
      logger.error('Explanation generation error:', error);
      return questions;
    }
  }
}

module.exports = new AIService();








