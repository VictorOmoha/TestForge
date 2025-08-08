-- Create database if not exists
-- CREATE DATABASE testforge;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    education_level VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Test configurations table
CREATE TABLE test_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_type VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    num_questions INTEGER NOT NULL CHECK (num_questions BETWEEN 10 AND 50),
    duration_minutes INTEGER,
    question_types TEXT[], -- Array of question types: MCQ, TrueFalse, ShortAnswer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Test attempts table
CREATE TABLE test_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES test_configurations(id) ON DELETE CASCADE,
    score DECIMAL(5,2),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'InProgress' CHECK (status IN ('InProgress', 'Completed', 'Paused')),
    time_spent_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Questions table (for structured question data)
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('MCQ', 'TrueFalse', 'ShortAnswer')),
    options TEXT[], -- For MCQ questions
    correct_answer TEXT NOT NULL,
    user_answer TEXT,
    ai_explanation TEXT,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER DEFAULT 0,
    question_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User progress analytics table
CREATE TABLE user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_type VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    total_attempts INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0,
    best_score DECIMAL(5,2) DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0, -- in seconds
    weak_areas TEXT[], -- Array of topics where user struggles
    last_attempt_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, test_type, difficulty)
);

-- AI prompt cache table for cost optimization
CREATE TABLE ai_prompt_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_hash VARCHAR(64) UNIQUE NOT NULL,
    prompt_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    test_type VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    num_questions INTEGER NOT NULL,
    usage_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_test_configurations_user_id ON test_configurations(user_id);
CREATE INDEX idx_test_attempts_user_id ON test_attempts(user_id);
CREATE INDEX idx_test_attempts_config_id ON test_attempts(config_id);
CREATE INDEX idx_questions_attempt_id ON questions(attempt_id);
CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX idx_ai_prompt_cache_prompt_hash ON ai_prompt_cache(prompt_hash);
CREATE INDEX idx_ai_prompt_cache_test_type_difficulty ON ai_prompt_cache(test_type, difficulty);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_configurations_updated_at BEFORE UPDATE ON test_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_analytics_updated_at BEFORE UPDATE ON user_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default test types
INSERT INTO test_configurations (user_id, test_type, difficulty, num_questions, duration_minutes, question_types)
VALUES 
    (uuid_generate_v4(), 'Math', 'Medium', 20, 30, ARRAY['MCQ', 'TrueFalse']),
    (uuid_generate_v4(), 'Science', 'Medium', 20, 30, ARRAY['MCQ', 'TrueFalse']),
    (uuid_generate_v4(), 'Programming', 'Medium', 20, 30, ARRAY['MCQ', 'ShortAnswer']),
    (uuid_generate_v4(), 'History', 'Medium', 20, 30, ARRAY['MCQ', 'TrueFalse'])
ON CONFLICT DO NOTHING;

