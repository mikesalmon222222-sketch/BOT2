# Bid Scraper Application Setup Guide

## Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB (local or remote)
- npm or yarn

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Environment Setup

Create `.env` file in backend directory:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bid-scraper
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

### 3. Start MongoDB

Ensure MongoDB is running on your system:
```bash
# If using local MongoDB
mongod

# Or use Docker
docker run -d -p 27017:27017 mongo:latest
```

### 4. Start Applications

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### 5. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## API Testing

Test backend endpoints:
```bash
# Health check
curl http://localhost:5000/api/health

# Get bids
curl http://localhost:5000/api/bids

# Get today's count
curl http://localhost:5000/api/bids/today

# Manual scraper run
curl -X POST http://localhost:5000/api/scraper/run
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in .env file

2. **Puppeteer Installation Issues**
   - Run: `PUPPETEER_SKIP_DOWNLOAD=true npm install`
   - Then: `npm install puppeteer` separately

3. **CORS Errors**
   - Ensure frontend URL is set correctly in backend .env
   - Check CORS configuration in app.js

4. **Port Conflicts**
   - Change PORT in backend .env
   - Update proxy in frontend package.json if needed

## Features

✅ **Auto-scraping** every 15 minutes
✅ **Real-time bid counts** and updates
✅ **Credential management** for portal access
✅ **Responsive design** for all devices
✅ **Professional UI** with sidebar navigation
✅ **Error handling** and loading states

## Development Notes

- Backend uses MVC architecture
- Frontend uses Context API for state management
- Auto-refresh functionality built-in
- Comprehensive error handling throughout
- MongoDB for persistent data storage