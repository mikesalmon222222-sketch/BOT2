# React Bid Scraper Application

A complete full-stack application for scraping and managing bid data from various portals with automated scheduling and real-time updates.

## Features

- **Automated Bid Scraping**: Scrapes bid data from Metro business portal and other configured portals
- **Real-time Updates**: Auto-refresh every 15 minutes with manual refresh capability
- **Today's Count Dashboard**: Shows total bids scraped today with live counter
- **Comprehensive Bid Management**: View, search, and sort all scraped bid data
- **Portal Credentials Management**: Secure storage and management of portal credentials
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technology Stack

### Backend
- **Node.js** with Express framework
- **MongoDB** with Mongoose ODM
- **Puppeteer** for web scraping
- **node-cron** for scheduled tasks
- **RESTful APIs** following MVC architecture

### Frontend
- **React** (latest version)
- **Context API** for global state management
- **Axios** for API communication
- **Responsive CSS** with modern design

## Project Structure

```
BOT2/
├── backend/
│   ├── controllers/         # API controllers
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── services/           # Business logic services
│   ├── middleware/         # Express middleware
│   ├── config/             # Database configuration
│   ├── utils/              # Utility functions
│   ├── app.js              # Express app setup
│   ├── server.js           # Server entry point
│   └── package.json        # Backend dependencies
└── frontend/
    ├── src/
    │   ├── components/     # React components
    │   ├── context/        # Context API
    │   ├── services/       # API services
    │   ├── App.js          # Main App component
    │   └── index.js        # React entry point
    ├── public/             # Static files
    └── package.json        # Frontend dependencies
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Git

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`:
   ```
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/bid_scraper
   FRONTEND_URL=http://localhost:3000
   ```

5. Start the backend server:
   ```bash
   # Development mode with nodemon
   npm run dev
   
   # Production mode
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

4. Open your browser and visit: `http://localhost:3000`

## API Endpoints

### Bids
- `GET /api/bids` - Get all bids
- `GET /api/bids/today` - Get today's bid count
- `POST /api/bids/refresh` - Manual refresh bids
- `GET /api/bids/:id` - Get specific bid

### Credentials
- `GET /api/credentials` - Get all credentials
- `POST /api/credentials` - Add new credential
- `PUT /api/credentials/:id` - Update credential
- `DELETE /api/credentials/:id` - Delete credential

### Scraper
- `POST /api/scraper/run` - Run scraper manually
- `GET /api/scraper/status` - Get scraper status
- `POST /api/scraper/scheduler/start` - Start scheduler
- `POST /api/scraper/scheduler/stop` - Stop scheduler

## Usage

### Navigation
The application has three main sections accessible via the left sidebar:

1. **Today's Count**: Shows the total number of bids scraped today
2. **Hunting Data**: Displays all scraped bids in a searchable table
3. **Credentials**: Manage portal credentials for scraping

### Adding Portal Credentials
1. Go to the Credentials section
2. Click "Add Credential"
3. Fill in the portal details:
   - Portal Name
   - Portal URL
   - Username/Password (if not public)
   - Mark as Public if no authentication needed
   - Set as Active to enable scraping

### Viewing Bid Data
- All scraped bids appear automatically in the Hunting Data section
- Use the search box to filter bids by title, description, or portal
- Click column headers to sort data
- Manual refresh available via the refresh button

### Auto-Refresh
- Scraper runs automatically every 15 minutes
- Today's count updates every minute
- Manual refresh available in Hunting Data section

## Target Portal

Currently configured to scrape from:
- **Metro Business Portal**: https://business.metro.net/webcenter/portal/VendorPortal/pages_home/solicitations/openSolicitations

Additional portals can be added through the credentials management interface.

## Data Format

Scraped bid data includes:
- **ID**: Unique identifier
- **Timestamp**: When the bid was scraped
- **Expiration Date**: Bid submission deadline
- **Title**: Bid title/name
- **Quantity**: Required quantity
- **Description**: Detailed description
- **Documents**: Associated documents/links
- **Portal**: Source portal name

## Database Models

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

## Development

### Running in Development Mode
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### Environment Variables
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Backend server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: Frontend URL for CORS

## Production Deployment

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Set production environment variables
3. Start the backend in production mode:
   ```bash
   cd backend
   NODE_ENV=production npm start
   ```

## Features

✅ **Automated Scraping**: Runs every 15 minutes automatically  
✅ **Real-time Dashboard**: Live bid count and status updates  
✅ **Comprehensive Search**: Filter and sort bid data  
✅ **Credential Management**: Secure portal authentication  
✅ **Responsive Design**: Works on all devices  
✅ **Error Handling**: Robust error handling and logging  
✅ **RESTful API**: Clean and documented API endpoints  

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details