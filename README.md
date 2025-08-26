# React Bid Scraper Application

A complete full-stack application for scraping and managing bid data from various portals, specifically targeting the Metro Los Angeles vendor portal.

## 🚀 Features

- **Automated Bid Scraping**: Scrapes bid data from Metro vendor portal every 15 minutes
- **Real-time Data Management**: Stores and manages bid data with MongoDB
- **Responsive React UI**: Clean, professional interface with three main sections
- **Credential Management**: Secure storage of portal credentials
- **Manual & Auto Refresh**: Both scheduled and on-demand data updates
- **RESTful API**: Complete backend API for data management

## 🏗️ Architecture

### Backend (Node.js + Express + MongoDB)
- **MVC Architecture** with clear separation of concerns
- **Puppeteer Integration** for robust web scraping
- **Scheduled Tasks** using node-cron
- **Error Handling** and logging with Winston
- **Database Models** for Bids and Credentials

### Frontend (React)
- **Context API** for global state management
- **Component-based Architecture** for maintainability
- **Auto-refresh Functionality** every 15 minutes
- **Responsive Design** for all screen sizes

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or remote connection)
- npm or yarn package manager

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd BOT2
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env file with your MongoDB connection string
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 4. MongoDB Setup
Ensure MongoDB is running and accessible. The default connection string is:
```
mongodb://localhost:27017/bid-scraper
```

## 🌐 API Endpoints

### Bids
- `GET /api/bids` - Get all bids
- `GET /api/bids/today` - Get today's bid count
- `POST /api/bids/refresh` - Manual refresh bids

### Credentials
- `GET /api/credentials` - Get all credentials
- `POST /api/credentials` - Add new credential
- `PUT /api/credentials/:id` - Update credential
- `DELETE /api/credentials/:id` - Delete credential

### Scraper
- `POST /api/scraper/run` - Run scraper manually
- `GET /api/scraper/status` - Get scraper status

### Health Check
- `GET /api/health` - API health check

## 📱 Frontend Sections

### 1. Today's Count
- Displays total number of bids scraped today
- Real-time counter with auto-updates
- Shows last refresh timestamp

### 2. Hunting Data
- Complete table view of all scraped bids
- Displays: timestamp, title, expiration, quantity, description, documents, portal
- Manual refresh button
- Auto-refresh every 15 minutes

### 3. Credentials
- Add/edit/remove portal credentials
- Support for public and authenticated portals
- Secure password storage
- Active/inactive status management

## 🔄 Data Flow

1. **Scheduler Service** runs scraper every 15 minutes
2. **Scraper Service** uses Puppeteer to extract data from Metro portal
3. **Bid data** is saved to MongoDB via Mongoose
4. **Frontend** fetches data via REST API calls
5. **Context API** manages global state and auto-updates
6. **Components** render real-time data to users

## 🎯 Target Portal

Currently configured to scrape:
```
https://business.metro.net/webcenter/portal/VendorPortal/pages_home/solicitations/openSolicitations
```

## 📊 Data Structure

### Bid Model
```javascript
{
  id: String,
  timestamp: Date,
  expirationDate: Date,
  title: String,
  quantity: String,
  description: String,
  documents: [String],
  portal: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Credential Model
```javascript
{
  portalName: String,
  url: String,
  username: String,
  password: String,
  isPublic: Boolean,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Security Features

- Password fields are excluded from API responses
- Input validation and sanitization
- CORS configuration for frontend-backend communication
- Error handling with detailed logging

## 🚦 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bid-scraper
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

### Frontend
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm start  # Starts development server
```

## 🧪 Testing

The application includes error handling and logging for debugging. Check the `logs/` directory in the backend for detailed logs.

## 🔮 Future Enhancements

- Multi-portal support
- Advanced filtering and search
- Export functionality (CSV, Excel)
- Email notifications for new bids
- User authentication and roles
- Dashboard analytics and charts

## 📝 Implementation Notes

- Uses current date/time: 2025-08-26 20:24:05 UTC
- Scraper handles dynamic content loading
- Responsive design for mobile devices
- Professional UI with clean aesthetics
- Comprehensive error handling throughout

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.