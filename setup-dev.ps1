# TestForge Development Setup Script
Write-Host "🚀 Setting up TestForge Development Environment..." -ForegroundColor Green

# Check if Docker is running
Write-Host "📋 Checking Docker status..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Start databases with Docker Compose
Write-Host "🗄️ Starting databases (PostgreSQL, MongoDB, Redis)..." -ForegroundColor Yellow
docker-compose up -d

# Wait for databases to be ready
Write-Host "⏳ Waiting for databases to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if databases are running
Write-Host "🔍 Checking database connections..." -ForegroundColor Yellow
try {
    docker exec testforge-postgres pg_isready -U postgres | Out-Null
    Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL is not ready yet" -ForegroundColor Red
}

try {
    docker exec testforge-mongodb mongosh --eval "db.runCommand('ping')" | Out-Null
    Write-Host "✅ MongoDB is ready" -ForegroundColor Green
} catch {
    Write-Host "❌ MongoDB is not ready yet" -ForegroundColor Red
}

# Install dependencies if not already installed
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps
cd client
npm install --legacy-peer-deps
cd ..

Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update your .env file with your OpenAI API key" -ForegroundColor White
Write-Host "2. Run 'npm run dev' to start the development server" -ForegroundColor White
Write-Host "3. Access the application at http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop databases: docker-compose down" -ForegroundColor Yellow







