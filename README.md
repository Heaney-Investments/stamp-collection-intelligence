# 📮 Stamp Collection Intelligence Platform

An AI-powered stamp collection management application with automated catalog matching, market research, and multi-platform publishing capabilities.

## 🚀 Features

### Core Features
- **AI-Powered Analysis**: Automatic stamp identification and catalog matching
- **Scott Catalog Integration**: Complete Scott catalog database with pricing
- **Image Processing**: Upload multiple stamp images with AI visual analysis
- **Market Research**: Real-time market value analysis and trends
- **Multi-Platform Publishing**: Automated listing to eBay and Wix

### Technical Features
- **Modern React Frontend**: Responsive UI with drag-and-drop upload
- **Express.js Backend**: RESTful API with file upload handling
- **MongoDB Database**: Robust data storage with schema validation
- **Real-time Updates**: Live processing status and notifications
- **Secure File Handling**: Image validation and processing

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Multer** for file uploads
- **Sharp** for image processing
- **UUID** for unique identifiers

### Frontend
- **React** with functional components and hooks
- **React Router** for navigation
- **Context API** for state management
- **React Toastify** for notifications
- **CSS3** with modern features

### Database
- **MongoDB** with collections for:
  - User stamps and metadata
  - Scott catalog data
  - Market research cache
  - User settings and preferences

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm 8+
- MongoDB 6+ (local or cloud)
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/stamp-collection-app.git
   cd stamp-collection-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Local MongoDB
   mongod --dbpath ./data/db
   
   # Or use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   - Backend API: http://localhost:3000
   - Frontend UI: http://localhost:3001 (if running separately)

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
MONGODB_URL=mongodb://localhost:27017
MONGODB_DATABASE=stamp_collection

# API Keys (optional for full functionality)
EBAY_APP_ID=your-ebay-app-id
WIX_API_KEY=your-wix-api-key
OPENAI_API_KEY=your-openai-key
```

### MongoDB Setup

The application automatically creates collections and indexes on first run:

- `users` - User accounts and API credentials
- `user_stamps` - Uploaded stamps with analysis data
- `countries` - Scott catalog countries
- `sets` - Scott catalog stamp sets
- `scott_stamps` - Individual Scott catalog entries
- `market_research` - Cached market data
- `sessions` - User sessions
- `settings` - Application settings

## 📋 API Reference

### Stamps API

```bash
# Get all stamps
GET /api/stamps?user_uuid=xxx&status=pending&limit=20

# Get single stamp
GET /api/stamps/:stampUuid

# Create new stamp
POST /api/stamps
Content-Type: application/json
{
  "name": "1963 Kennedy Memorial",
  "price": 25.50,
  "auction_enabled": true,
  "photos": [...]
}

# Update stamp
PUT /api/stamps/:stampUuid

# Delete stamp
DELETE /api/stamps/:stampUuid
```

### Upload API

```bash
# Upload images
POST /api/upload/images
Content-Type: multipart/form-data
- images: File[]
- user_uuid: string
```

### Settings API

```bash
# Get settings
GET /api/settings

# Save settings
POST /api/settings
Content-Type: application/json
{
  "ebay": { "enabled": true, "apiKey": "..." },
  "wix": { "enabled": true, "apiKey": "..." }
}
```

## 🗂️ Project Structure

```
src/
├── server.js              # Express.js server entry point
├── database/
│   └── mongodb.js         # MongoDB connection and models
├── utils/
│   └── logger.js          # Logging utility
└── frontend/
    ├── App.js             # Main React application
    ├── context/
    │   └── AppContext.js  # Global state management
    ├── services/
    │   └── apiService.js  # API communication
    ├── components/
    │   ├── layout/        # Navigation and layout
    │   ├── pages/         # Page components
    │   └── common/        # Reusable components
    └── App.css           # Global styles

uploads/                   # Uploaded stamp images
logs/                     # Application logs
data/                     # MongoDB data (if local)
```

## 🔄 Development Workflow

### Running in Development

```bash
# Start backend with auto-reload
npm run dev

# Start frontend separately (if needed)
npm run frontend:start

# Run tests
npm test

# Lint code
npm run lint
```

### Database Operations

```bash
# Connect to MongoDB
mongo stamp_collection

# View collections
show collections

# Query stamps
db.user_stamps.find().pretty()

# Check indexes
db.user_stamps.getIndexes()
```

## 📊 Data Flow

1. **Upload Process**:
   - User uploads stamp images via drag-and-drop interface
   - Files are validated and stored in uploads directory
   - Stamp record created in database with "pending" status

2. **AI Analysis** (Future Implementation):
   - Images processed through computer vision AI
   - Scott catalog matching performed
   - Condition and features extracted
   - Status updated to "completed"

3. **Market Research** (Future Implementation):
   - eBay API queried for similar items
   - Price trends analyzed
   - Market data cached for performance

4. **Publishing** (Future Implementation):
   - Automated listing creation for eBay
   - Product publishing to Wix store
   - Integration status tracking

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- stampService.test.js
```

## 🚀 Deployment

### Production Build

```bash
# Build for production
npm run build

# Start production server
NODE_ENV=production npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Setup

- Set `NODE_ENV=production`
- Configure MongoDB connection string
- Set up proper logging
- Configure reverse proxy (nginx/Apache)
- Set up SSL certificates

## 🛡️ Security Considerations

- File upload validation and size limits
- Image type restrictions (JPEG, PNG, GIF, WebP)
- MongoDB connection security
- API rate limiting
- Input validation and sanitization
- Environment variable protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@stampapp.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/stamp-collection-app/issues)
- 📚 Documentation: [Wiki](https://github.com/your-org/stamp-collection-app/wiki)

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Basic upload and storage
- ✅ MongoDB integration
- ✅ React frontend
- ✅ File management

### Phase 2 (Next)
- 🔲 AI image analysis integration
- 🔲 Scott catalog matching
- 🔲 Market research automation
- 🔲 User authentication

### Phase 3 (Future)
- 🔲 eBay integration
- 🔲 Wix store integration
- 🔲 Mobile app
- 🔲 Advanced analytics

---

**Built with ❤️ for stamp collectors worldwide**
