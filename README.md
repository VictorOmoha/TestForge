# TestForge - AI-Powered Testing Platform

TestForge is a comprehensive AI-driven platform that allows users to create profiles, configure customized tests, generate AI-curated questions, take unlimited tests, and receive automated scoring with detailed analytics.

## 🚀 Features

### Core Functionality
- **User Management**: Secure registration, authentication, and profile management
- **AI-Powered Test Generation**: Dynamic question generation using OpenAI GPT-4
- **Test Configuration**: Customizable test types, difficulty levels, and question counts
- **Unlimited Testing**: Take tests with identical or new configurations
- **Automated Scoring**: Instant evaluation with AI-powered answer analysis
- **Progress Analytics**: Comprehensive performance tracking and insights
- **Save & Resume**: Continue tests from where you left off
- **Mobile Responsive**: Optimized for all device sizes

### Test Types Supported
- **Mathematics**: Algebra, Calculus, Statistics, Geometry
- **Science**: Physics, Chemistry, Biology, General Science
- **Programming**: JavaScript, Python, Java, Data Structures
- **History**: World History, American History, Ancient Civilizations
- **English**: Grammar, Literature, Vocabulary, Writing
- **Geography**: World Geography, Physical Geography, Human Geography

### Question Types
- **Multiple Choice Questions (MCQ)**: 4 options with single correct answer
- **True/False Questions**: Binary choice questions
- **Short Answer Questions**: Open-ended responses with AI evaluation

### Analytics & Insights
- **Performance Dashboard**: Overall statistics and trends
- **Progress Tracking**: Visual charts showing improvement over time
- **Weak Area Analysis**: AI-identified topics needing improvement
- **Comparative Analysis**: Performance across different test types and difficulties
- **Time Analytics**: Detailed time spent per question and test

## 🏗️ Architecture

### Backend (Node.js/Express)
- **Framework**: Express.js with TypeScript support
- **Database**: PostgreSQL (structured data) + MongoDB (unstructured data)
- **Authentication**: JWT-based with bcrypt password hashing
- **AI Integration**: OpenAI GPT-4 API for question generation and scoring
- **Caching**: Redis for prompt caching and performance optimization
- **Security**: Helmet, CORS, rate limiting, input validation

### Frontend (React)
- **Framework**: React 18 with modern hooks
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Context + React Query
- **Routing**: React Router v6 with protected routes
- **UI Components**: Custom component library with accessibility features
- **Charts**: Recharts for data visualization

### Infrastructure
- **Containerization**: Docker for consistent deployment
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Monitoring**: Winston logging with structured error tracking
- **Performance**: Compression, caching, and optimization strategies

## 📋 Prerequisites

Before running TestForge, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **PostgreSQL** (v13 or higher)
- **MongoDB** (v5.0 or higher)
- **Redis** (v6.0 or higher) - Optional for caching
- **OpenAI API Key** - Required for AI features

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/testforge.git
cd testforge
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration
```bash
# Copy environment template
cp env.example .env

# Edit .env file with your configuration
nano .env
```

Required environment variables:
```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Database Configuration
POSTGRES_USER=postgres
POSTGRES_HOST=localhost
POSTGRES_DB=testforge
POSTGRES_PASSWORD=your-password
POSTGRES_PORT=5432

MONGODB_URI=mongodb://localhost:27017/testforge

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379
```

### 4. Database Setup
```bash
# Start PostgreSQL and MongoDB services
# Then run the database schema
psql -U postgres -d testforge -f server/database/schema.sql
```

### 5. Start Development Servers
```bash
# Start both backend and frontend (from root directory)
npm run dev

# Or start them separately:
npm run server    # Backend only
npm run client    # Frontend only
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 🧪 Testing

### Backend Tests
```bash
npm test
npm run test:watch
```

### Frontend Tests
```bash
cd client
npm test
npm run test:watch
```

### E2E Tests
```bash
# Run end-to-end tests (requires both servers running)
npm run test:e2e
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/me` - Get current user

### Test Endpoints
- `POST /api/tests/configure` - Create test configuration
- `POST /api/tests/generate` - Generate AI questions
- `GET /api/tests/:attemptId/questions` - Get test questions
- `POST /api/tests/:attemptId/submit` - Submit test answers
- `POST /api/tests/:attemptId/save-progress` - Save test progress

### Analytics Endpoints
- `GET /api/analytics/dashboard` - Get dashboard analytics
- `GET /api/analytics/progress` - Get progress tracking data
- `GET /api/analytics/performance-comparison` - Get performance comparison

### Results Endpoints
- `GET /api/results/history` - Get test history
- `GET /api/results/:attemptId` - Get detailed test results
- `GET /api/results/analytics/summary` - Get performance summary

## 🎯 Usage Guide

### For Students/Learners
1. **Register/Login**: Create an account or sign in
2. **Configure Test**: Choose subject, difficulty, and question count
3. **Take Test**: Answer questions with timer and navigation
4. **Review Results**: See detailed feedback and explanations
5. **Track Progress**: Monitor improvement over time

### For Educators
1. **Create Tests**: Generate custom tests for specific topics
2. **Monitor Performance**: Track student progress and weak areas
3. **Analyze Results**: Get insights into learning patterns
4. **Adapt Content**: Use analytics to improve teaching strategies

## 🔧 Configuration

### Test Configuration Options
- **Test Types**: Math, Science, Programming, History, English, Geography
- **Difficulty Levels**: Easy, Medium, Hard
- **Question Count**: 10-50 questions per test
- **Time Limits**: 5-180 minutes (optional)
- **Question Types**: MCQ, True/False, Short Answer

### AI Configuration
- **Model**: GPT-4 (configurable)
- **Temperature**: 0.7 (adjustable for creativity vs accuracy)
- **Max Tokens**: 2000 (configurable)
- **Caching**: Enabled for cost optimization

## 🚀 Deployment

### Production Deployment
```bash
# Build frontend
cd client
npm run build
cd ..

# Set production environment
export NODE_ENV=production

# Start production server
npm start
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Cloud Deployment
- **AWS**: Use ECS with RDS and ElastiCache
- **Azure**: Use App Service with Azure Database
- **Google Cloud**: Use Cloud Run with Cloud SQL

## 📊 Performance Metrics

### Target Performance
- **Test Generation**: < 5 seconds
- **Answer Scoring**: < 2 seconds
- **Concurrent Users**: 1,000+
- **AI Accuracy**: 95%+
- **Uptime**: 99.9%

### Monitoring
- **Application Metrics**: Response times, error rates
- **AI Performance**: Generation time, accuracy rates
- **User Analytics**: Engagement, completion rates
- **Cost Monitoring**: API usage, optimization opportunities

## 🔒 Security Features

### Data Protection
- **Encryption**: AES-256 for sensitive data
- **HTTPS**: TLS 1.3 encryption in transit
- **Password Security**: bcrypt with 12 salt rounds
- **Session Management**: JWT with configurable expiration

### Compliance
- **GDPR**: Data privacy and user rights
- **CCPA**: California privacy compliance
- **Accessibility**: WCAG 2.1 AA compliance
- **Security Headers**: Helmet.js protection

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **TypeScript**: Type safety (optional)
- **Testing**: Unit and integration tests required

### Commit Convention
```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](./docs/api.md)
- [Component Library](./docs/components.md)
- [Deployment Guide](./docs/deployment.md)

### Community
- **Issues**: [GitHub Issues](https://github.com/your-username/testforge/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/testforge/discussions)
- **Email**: support@testforge.com

### Roadmap
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Collaborative testing features
- [ ] Mobile app development
- [ ] Integration with LMS platforms

## 🙏 Acknowledgments

- **OpenAI**: For providing the GPT-4 API
- **React Team**: For the amazing frontend framework
- **Express.js**: For the robust backend framework
- **Tailwind CSS**: For the utility-first CSS framework
- **Community Contributors**: For feedback and improvements

---

**TestForge** - Empowering learning through AI-driven assessment technology.