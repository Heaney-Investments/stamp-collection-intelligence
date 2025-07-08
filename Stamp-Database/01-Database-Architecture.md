# Database Architecture - Stamp Collection System

## 🏗️ Architecture Overview

### Modern NoSQL Database Approach
- **Primary Database**: MongoDB (Document storage for flexible stamp data)
- **Cache Layer**: Redis (Session data, frequently accessed data, real-time analytics)
- **Search Engine**: MongoDB Text Search (Full-text search with indexes)
- **File Storage**: Local file system with MongoDB GridFS for large files
- **Desktop Integration**: Embedded MongoDB for offline capability

## 📊 Database Schema Design

### MongoDB Collections

#### Users Collection

```javascript
// users collection
{
  _id: ObjectId,
  user_uuid: "uuid-string",
  username: "string",
  email: "string",
  password_hash: "string",
  first_name: "string",
  last_name: "string",
  subscription_tier: "basic",
  preferences: {
    theme: "light",
    default_currency: "USD",
    auto_publish: false,
    notification_settings: {
      email_alerts: true,
      desktop_notifications: true,
      market_updates: true
    }
  },
  api_credentials: {
    ebay: {
      app_id: "encrypted_string",
      dev_id: "encrypted_string", 
      cert_id: "encrypted_string",
      user_token: "encrypted_string",
      refresh_token: "encrypted_string",
      token_expires: "ISODate"
    },
    wix: {
      api_key: "encrypted_string",
      site_id: "string",
      refresh_token: "encrypted_string",
      access_token: "encrypted_string",
      token_expires: "ISODate"
    }
  },
  created_at: "ISODate",
  updated_at: "ISODate",
  last_login: "ISODate",
  is_active: true,
  account_status: "active"
}

#### Stamps Collection

```javascript
// stamps collection
{
  _id: ObjectId,
  stamp_uuid: "uuid-string",
  user_uuid: "uuid-string",
  
  // User Input (4 core fields)
  user_input: {
    name: "string",
    price: 123.45,
    auction_enabled: false,
    photos: [
      {
        file_name: "stamp_front.jpg",
        file_path: "/images/stamp_uuid/stamp_front.jpg",
        file_size: 2048576,
        resolution: "1920x1080",
        format: "JPEG",
        is_primary: true,
        upload_timestamp: "ISODate"
      }
    ]
  },
  
  // AI-Generated Content
  ai_analysis: {
    description: "Professional AI-generated description",
    category: "US Commemorative",
    subcategory: "National Parks",
    tags: ["vintage", "rare", "collectible", "mint condition"],
    
    // Computer Vision Results
    visual_features: {
      country: "United States",
      year_issued: 1962,
      denomination: "4 cents",
      colors: {
        primary: "red",
        secondary: "blue",
        dominant_colors: ["#FF0000", "#0000FF", "#FFFFFF"]
      },
      condition: {
        overall: "mint",
        score: 9.5,
        details: {
          centering: "perfect",
          perforations: "intact",
          gum: "original",
          cancellation: "none"
        }
      },
      physical_features: {
        perforations: {
          type: "line",
          gauge: "11",
          quality: "excellent"
        },
        watermarks: {
          present: false,
          type: null
        },
        printing_method: "photogravure",
        paper_type: "white wove"
      }
    },
    
    // Market Intelligence
    market_data: {
      estimated_value: 45.00,
      price_range: {
        low: 35.00,
        high: 65.00
      },
      market_demand: 0.85,
      rarity_score: 7,
      trend: "stable",
      comparable_sales: [
        {
          platform: "ebay",
          price: 42.50,
          condition: "mint",
          sale_date: "ISODate",
          listing_id: "ebay_item_123"
        }
      ]
    },
    
    confidence_scores: {
      overall: 0.92,
      visual_analysis: 0.95,
      content_generation: 0.89,
      market_analysis: 0.88
    },
    
    processing_metadata: {
      ai_version: "2.1.0",
      models_used: ["vision_v3", "nlp_v2", "market_v1"],
      processing_time: 4.2,
      last_updated: "ISODate"
    }
  },
  
  // Platform Publishing Status
  publishing_status: {
    ebay: {
      listed: true,
      item_id: "ebay_123456789",
      listing_url: "https://www.ebay.com/itm/123456789",
      status: "active",
      views: 45,
      watchers: 3,
      last_sync: "ISODate"
    },
    wix: {
      published: true,
      site_id: "wix_site_123",
      collection_id: "stamps_collection",
      product_url: "https://mysite.wixsite.com/stamps/product/123",
      status: "published",
      last_sync: "ISODate"
    }
  },
  
  // Processing Status
  processing_status: "completed", // pending, processing, completed, failed
  workflow_stage: "published", // input, analysis, content_generation, market_research, ready, published
  
  // Timestamps
  created_at: "ISODate",
  updated_at: "ISODate",
  ai_processed_at: "ISODate",
  published_at: "ISODate"
}

#### Market Research Collection

```javascript
// market_research collection
{
  _id: ObjectId,
  research_uuid: "uuid-string",
  stamp_uuid: "uuid-string",
  
  research_data: {
    ebay_analysis: {
      similar_items: [
        {
          item_id: "ebay_123456",
          title: "Similar stamp title",
          price: 45.00,
          condition: "mint",
          seller: "stamp_dealer_pro",
          watchers: 5,
          bids: 3,
          time_left: "2d 5h",
          shipping: 3.95,
          image_url: "https://...",
          listing_url: "https://..."
        }
      ],
      price_analysis: {
        average_price: 42.50,
        median_price: 40.00,
        price_range: {
          min: 25.00,
          max: 75.00
        },
        recent_sales: [
          {
            price: 45.00,
            sale_date: "ISODate",
            condition: "mint"
          }
        ]
      },
      market_metrics: {
        total_listings: 45,
        active_auctions: 12,
        buy_it_now: 33,
        avg_watchers: 2.3,
        completion_rate: 0.78
      }
    },
    
    wix_analysis: {
      similar_collections: [
        {
          site_id: "wix_site_456",
          collection_name: "Vintage Stamps",
          item_count: 150,
          avg_price: 38.50,
          site_url: "https://..."
        }
      ],
      design_insights: {
        popular_layouts: ["grid", "masonry"],
        color_schemes: ["vintage", "classic"],
        seo_keywords: ["vintage stamps", "collectible"]
      }
    },
    
    market_trends: {
      category_demand: 0.85,
      seasonal_factor: 1.2,
      trend_direction: "stable",
      confidence_score: 0.92
    }
  },
  
  data_sources: [
    "ebay_finding_api",
    "ebay_trading_api", 
    "wix_studio_api",
    "web_scraping"
  ],
  
  created_at: "ISODate",
  expires_at: "ISODate"
}

#### Session Management Collection

```javascript
// sessions collection (for desktop app authentication)
{
  _id: ObjectId,
  session_uuid: "uuid-string",
  user_uuid: "uuid-string",
  
  session_data: {
    device_id: "desktop_123",
    app_version: "1.0.0",
    login_time: "ISODate",
    last_activity: "ISODate",
    ip_address: "192.168.1.100",
    user_agent: "Electron/22.0.0"
  },
  
  api_tokens: {
    ebay_session: "encrypted_token",
    wix_session: "encrypted_token",
    refresh_tokens: {
      ebay: "encrypted_refresh",
      wix: "encrypted_refresh"
    }
  },
  
  expires_at: "ISODate",
  is_active: true
}

### Redis Cache Patterns

#### User Session Cache
```redis
# User session data (TTL: 24 hours)
user:session:{user_uuid} {
  "session_uuid": "string",
  "login_time": "timestamp",
  "last_activity": "timestamp",
  "api_tokens": {
    "ebay": "encrypted_token",
    "wix": "encrypted_token"
  },
  "preferences": {...}
}
EXPIRE user:session:{user_uuid} 86400

# API rate limiting
api:rate_limit:ebay:{user_uuid} {
  "requests_made": 450,
  "requests_limit": 500,
  "reset_time": "timestamp"
}
EXPIRE api:rate_limit:ebay:{user_uuid} 3600
```

#### Market Data Cache
```redis
# Market research cache (TTL: 1 hour)
market:research:{stamp_uuid} {
  "ebay_similar_items": [...],
  "price_analysis": {...},
  "market_trends": {...},
  "last_updated": "timestamp"
}
EXPIRE market:research:{stamp_uuid} 3600

# eBay category cache (TTL: 24 hours)
ebay:categories {
  "260324": "Stamps > United States > 1941-Now: Unused",
  "260322": "Stamps > United States > 1901-40: Unused"
}
EXPIRE ebay:categories 86400
```

#### Processing Queue Cache
```redis
# AI processing queue
LPUSH ai:processing:queue "{\"stamp_uuid\": \"123\", \"priority\": \"high\", \"timestamp\": \"...\"}"

# Processing status
processing:status:{stamp_uuid} "in_progress"
EXPIRE processing:status:{stamp_uuid} 3600
```

## 🔧 Database Optimization

### MongoDB Indexing Strategy

```javascript
// Users collection indexes
db.users.createIndex({ "user_uuid": 1 }, { unique: true })
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "created_at": -1 })

// Stamps collection indexes
db.stamps.createIndex({ "stamp_uuid": 1 }, { unique: true })
db.stamps.createIndex({ "user_uuid": 1 })
db.stamps.createIndex({ "ai_analysis.visual_features.country": 1 })
db.stamps.createIndex({ "ai_analysis.visual_features.year_issued": 1 })
db.stamps.createIndex({ "ai_analysis.category": 1 })
db.stamps.createIndex({ "processing_status": 1 })
db.stamps.createIndex({ "workflow_stage": 1 })
db.stamps.createIndex({ "created_at": -1 })
db.stamps.createIndex({ "ai_analysis.market_data.estimated_value": 1 })

// Text search index for stamps
db.stamps.createIndex({
  "user_input.name": "text",
  "ai_analysis.description": "text",
  "ai_analysis.tags": "text",
  "ai_analysis.visual_features.country": "text"
}, {
  weights: {
    "user_input.name": 10,
    "ai_analysis.description": 5,
    "ai_analysis.tags": 8,
    "ai_analysis.visual_features.country": 3
  }
})

// Compound indexes for complex queries
db.stamps.createIndex({ 
  "user_uuid": 1, 
  "ai_analysis.visual_features.country": 1, 
  "ai_analysis.visual_features.year_issued": 1 
})
db.stamps.createIndex({ 
  "processing_status": 1, 
  "created_at": -1 
})
db.stamps.createIndex({ 
  "publishing_status.ebay.status": 1,
  "publishing_status.wix.status": 1
})

// Market research collection indexes
db.market_research.createIndex({ "stamp_uuid": 1 })
db.market_research.createIndex({ "created_at": -1 })
db.market_research.createIndex({ "expires_at": 1 }, { expireAfterSeconds: 0 })

// Sessions collection indexes
db.sessions.createIndex({ "session_uuid": 1 }, { unique: true })
db.sessions.createIndex({ "user_uuid": 1 })
db.sessions.createIndex({ "expires_at": 1 }, { expireAfterSeconds: 0 })
```

### Electron Desktop Integration

#### Local Storage Strategy
```javascript
// MongoDB connection for Electron
const { MongoClient } = require('mongodb');
const path = require('path');
const { app } = require('electron');

// Local MongoDB instance for offline capability
const LOCAL_DB_PATH = path.join(app.getPath('userData'), 'stamp_db');
const MONGO_URL = process.env.NODE_ENV === 'production' 
  ? 'mongodb://localhost:27017/stamp_collection'
  : 'mongodb://localhost:27017/stamp_collection_dev';

// Redis connection for caching
const redis = require('redis');
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
```

#### File Storage Structure
```
Electron App Data/
├── stamp_collection/
│   ├── database/           # MongoDB data files
│   ├── images/            # Stamp images organized by UUID
│   │   ├── {stamp_uuid}/
│   │   │   ├── original/
│   │   │   ├── thumbnails/
│   │   │   └── processed/
│   ├── exports/           # Generated export files
│   ├── backups/           # Database backups
│   ├── logs/              # Application logs
│   └── temp/              # Temporary processing files
```

## 📡 Scalability Considerations

### MongoDB Scaling Strategy
- **Sharding**: Shard stamps collection by user_uuid for horizontal scaling
- **Replica Sets**: Primary-secondary-arbiter setup for high availability
- **Connection Pooling**: Efficient connection management for Electron app
- **GridFS**: For large image file storage and retrieval

### Redis Performance Optimization
```redis
# Redis configuration for Electron desktop app
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000

# Persistence for desktop app
aof-use-rdb-preamble yes
appendonly yes
appendfsync everysec
```

### Desktop App Data Synchronization
```javascript
// Sync strategy for online/offline capability
class DataSyncManager {
  async syncToCloud() {
    // Sync local MongoDB to cloud when online
    const localChanges = await this.getLocalChanges();
    const cloudUpdates = await this.uploadToCloud(localChanges);
    await this.updateLocalSyncStatus(cloudUpdates);
  }
  
  async syncFromCloud() {
    // Pull latest data from cloud APIs
    const ebayUpdates = await this.getEbayUpdates();
    const wixUpdates = await this.getWixUpdates();
    await this.mergeCloudData([...ebayUpdates, ...wixUpdates]);
  }
}
```


## 🔗 API Integration Data Formats

### eBay API Data Structures
```javascript
// eBay Trading API listing data
{
  ebay_listing: {
    item_id: "123456789",
    title: "AI-Generated Stamp Title",
    description: "<html>...</html>",
    category_id: "260324",
    listing_type: "FixedPriceItem", // or "Chinese" for auction
    start_price: 25.00,
    buy_it_now_price: 45.00,
    quantity: 1,
    duration: "Days_7",
    condition_id: 1000, // New
    pictures: [
      "https://i.ebayimg.com/images/..."
    ],
    item_specifics: {
      "Country": "United States",
      "Year of Issue": "1962",
      "Denomination": "4 Cents",
      "Condition": "Mint Never Hinged"
    },
    shipping_details: {
      shipping_type: "Calculated",
      shipping_service: "USPSMedia"
    }
  }
}
```

### Wix Studio API Data Structures
```javascript
// Wix Studio collection/product data
{
  wix_collection: {
    collection_id: "wix_collection_123",
    site_id: "wix_site_456",
    collection_name: "Vintage Stamp Collection",
    description: "Curated collection of vintage stamps",
    display_settings: {
      layout: "grid",
      items_per_page: 12,
      enable_sorting: true,
      enable_filtering: true
    },
    seo_settings: {
      meta_title: "Vintage Stamps - Rare Collectibles",
      meta_description: "Discover rare vintage stamps...",
      slug: "vintage-stamps"
    },
    items: [
      {
        item_id: "stamp_item_789",
        name: "1962 National Parks 4c Stamp",
        description: "Mint condition commemorative stamp",
        price: 45.00,
        images: [
          {
            url: "https://static.wixstatic.com/media/...",
            alt_text: "1962 National Parks stamp front view"
          }
        ],
        custom_fields: {
          year: "1962",
          country: "United States",
          condition: "Mint",
          denomination: "4 cents"
        },
        inventory: {
          quantity: 1,
          track_inventory: true
        },
        seo: {
          slug: "1962-national-parks-4c-mint",
          meta_title: "1962 National Parks 4c Stamp - Mint Condition"
        }
      }
    ]
  }
}
```

## 📊 Performance Monitoring

### Database Performance Metrics
```javascript
// MongoDB performance monitoring
class DatabaseMonitor {
  async getPerformanceMetrics() {
    return {
      connection_stats: await db.runCommand({ connectionStatus: 1 }),
      server_status: await db.runCommand({ serverStatus: 1 }),
      collection_stats: {
        stamps: await db.stamps.stats(),
        users: await db.users.stats(),
        market_research: await db.market_research.stats()
      },
      index_usage: await db.stamps.aggregate([
        { $indexStats: {} }
      ]).toArray()
    };
  }
}

// Redis performance monitoring
class RedisMonitor {
  async getRedisStats() {
    const info = await redis.info();
    return {
      memory_usage: info.used_memory_human,
      keyspace_hits: info.keyspace_hits,
      keyspace_misses: info.keyspace_misses,
      hit_rate: info.keyspace_hits / (info.keyspace_hits + info.keyspace_misses),
      connected_clients: info.connected_clients
    };
  }
}
```

### Backup and Recovery Strategy
```javascript
// Automated backup for Electron app
class BackupManager {
  async createBackup() {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const backupPath = path.join(app.getPath('userData'), 'backups', `backup_${timestamp}`);
    
    // MongoDB dump
    await this.createMongoBackup(backupPath);
    
    // Redis snapshot
    await this.createRedisBackup(backupPath);
    
    // File system backup (images, etc.)
    await this.createFileBackup(backupPath);
    
    return backupPath;
  }
  
  async restoreFromBackup(backupPath) {
    await this.restoreMongoFromBackup(backupPath);
    await this.restoreRedisFromBackup(backupPath);
    await this.restoreFilesFromBackup(backupPath);
  }
}
```

## 🔒 Data Security

### Encryption Strategy
- **At Rest**: MongoDB encryption for sensitive user data
- **In Transit**: TLS/SSL for all API communications
- **API Keys**: Encrypted storage of eBay and Wix credentials
- **Local Storage**: Electron secure storage for sensitive data

---

**Related Documents:**
- [[02-AI-ML-Integration]]
- [[03-Core-Engine-Architecture]]
- [[04-Simplified-Input-Processing]]

**Last Updated**: 2025-07-08  
**Version**: 2.0 (MongoDB + Redis + Electron)
**Database Type**: MongoDB Primary, Redis Cache
