# Simplified Input Processing System

## 🎯 Objective

Transform minimal user input (Photos, Name, Auction Yes/No, Price) into a comprehensive stamp database entry through intelligent processing, validation, and AI-driven enrichment.

This document outlines the handling of inputs for an Electron desktop application using MongoDB and Redis, supporting offline and online functionalities.

## 📝 Input Schema Design

### Core Input Fields
```typescript
interface StampInput {
  photos: File[] | string[];     // Image files or URLs
  name: string;                  // Free-text stamp identifier
  auction: boolean;              // Auction vs fixed-price sale
  price: number;                 // Starting bid or fixed price
  offlineMode: boolean;          // Whether app is operating offline
}

interface ProcessedInput {
  stamp_uuid: string;
  user_id: string;
  input_data: StampInput;
  validation_status: 'valid' | 'invalid' | 'warning';
  processing_queue: string[];
  estimated_completion: Date;
}
}
```

### Input Validation Rules

```python
class InputValidator:
    """
    Comprehensive input validation for stamp data
    """
    def __init__(self):
        self.validation_rules = {
            'photos': {
                'min_count': 1,
                'max_count': 10,
                'max_file_size': 50 * 1024 * 1024,  # 50MB
                'allowed_formats': ['jpg', 'jpeg', 'png', 'webp'],
                'min_resolution': (400, 400),
                'max_resolution': (8000, 8000)
            },
            'name': {
                'min_length': 3,
                'max_length': 255,
                'forbidden_chars': ['<', '>', '&', '"', "'"],
                'required_pattern': r'^[a-zA-Z0-9\s\-\.\(\)]+$'
            },
            'price': {
                'min_value': 0.01,
                'max_value': 1000000.00,
                'decimal_places': 2,
                'currency_support': ['USD', 'EUR', 'GBP']
            }
        }
    
    def validate_input(self, input_data: dict) -> ValidationResult:
        """
        Comprehensive input validation with detailed feedback
        """
        result = ValidationResult()
        
        # Photo validation
        photo_validation = self.validate_photos(input_data.get('photos', []))
        result.add_validation('photos', photo_validation)
        
        # Name validation
        name_validation = self.validate_name(input_data.get('name', ''))
        result.add_validation('name', name_validation)
        
        # Price validation
        price_validation = self.validate_price(input_data.get('price'))
        result.add_validation('price', price_validation)
        
        # Auction validation
        auction_validation = self.validate_auction(input_data.get('auction'))
        result.add_validation('auction', auction_validation)
        
        return result
    
    def validate_photos(self, photos: list) -> FieldValidation:
        """
        Validate photo uploads with detailed analysis
        """
        validation = FieldValidation('photos')
        
        if not photos or len(photos) == 0:
            validation.add_error('At least one photo is required')
            return validation
        
        if len(photos) > self.validation_rules['photos']['max_count']:
            validation.add_error(f'Maximum {self.validation_rules["photos"]["max_count"]} photos allowed')
        
        for i, photo in enumerate(photos):
            photo_validation = self.validate_single_photo(photo, i)
            validation.merge(photo_validation)
        
        return validation
    
    def validate_single_photo(self, photo, index: int) -> FieldValidation:
        """
        Validate individual photo file
        """
        validation = FieldValidation(f'photo_{index}')
        
        try:
            # File size validation
            if hasattr(photo, 'size') and photo.size > self.validation_rules['photos']['max_file_size']:
                validation.add_error(f'Photo {index + 1} exceeds maximum file size')
            
            # Format validation
            file_extension = self.get_file_extension(photo).lower()
            if file_extension not in self.validation_rules['photos']['allowed_formats']:
                validation.add_error(f'Photo {index + 1} format not supported')
            
            # Image analysis
            image_analysis = self.analyze_image_content(photo)
            if image_analysis['is_stamp_like'] < 0.5:
                validation.add_warning(f'Photo {index + 1} may not contain a stamp')
            
            # Resolution validation
            if image_analysis['resolution']:
                width, height = image_analysis['resolution']
                min_w, min_h = self.validation_rules['photos']['min_resolution']
                
                if width < min_w or height < min_h:
                    validation.add_warning(f'Photo {index + 1} resolution is low')
            
        except Exception as e:
            validation.add_error(f'Photo {index + 1} validation failed: {str(e)}')
        
        return validation
    
    def analyze_image_content(self, photo) -> dict:
        """
        Quick image content analysis for validation
        """
        try:
            # Load image for analysis
            image = self.load_image(photo)
            
            # Basic stamp detection
            stamp_features = self.detect_stamp_features_basic(image)
            
            return {
                'is_stamp_like': stamp_features['confidence'],
                'resolution': (image.width, image.height),
                'has_multiple_objects': stamp_features['object_count'] > 1,
                'background_complexity': stamp_features['background_score']
            }
        except Exception:
            return {
                'is_stamp_like': 0.0,
                'resolution': None,
                'has_multiple_objects': False,
                'background_complexity': 0.0
            }
```

## 🔧 Input Processing Pipeline

### Stage 1: Input Sanitization

```python
class InputSanitizer:
    """
    Sanitize and normalize user input for processing
    """
    def __init__(self):
        self.text_cleaner = TextCleaner()
        self.image_processor = ImageProcessor()
        
    def sanitize_input(self, raw_input: dict) -> dict:
        """
        Sanitize all input fields
        """
        sanitized = {}
        
        # Sanitize name field
        sanitized['name'] = self.sanitize_name(raw_input.get('name', ''))
        
        # Process photos
        sanitized['photos'] = self.sanitize_photos(raw_input.get('photos', []))
        
        # Normalize price
        sanitized['price'] = self.sanitize_price(raw_input.get('price'))
        
        # Validate auction boolean
        sanitized['auction'] = bool(raw_input.get('auction', False))
        
        return sanitized
    
    def sanitize_name(self, name: str) -> str:
        """
        Clean and normalize stamp name
        """
        # Remove dangerous characters
        cleaned = self.text_cleaner.remove_dangerous_chars(name)
        
        # Normalize whitespace
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        # Apply text normalization
        cleaned = self.text_cleaner.normalize_text(cleaned)
        
        # Extract potential metadata from name
        metadata = self.extract_name_metadata(cleaned)
        
        return {
            'cleaned_name': cleaned,
            'extracted_metadata': metadata
        }
    
    def extract_name_metadata(self, name: str) -> dict:
        """
        Extract metadata from stamp name using regex patterns
        """
        metadata = {
            'year': None,
            'country': None,
            'denomination': None,
            'series': None,
            'catalog_number': None
        }
        
        # Year extraction
        year_match = re.search(r'\b(19|20)\d{2}\b', name)
        if year_match:
            metadata['year'] = int(year_match.group())
        
        # Country extraction (common patterns)
        country_patterns = {
            r'\b(USA?|United States)\b': 'United States',
            r'\b(UK|Britain|British)\b': 'United Kingdom',
            r'\bCanada\b': 'Canada',
            r'\bAustralia\b': 'Australia',
            r'\bGermany\b': 'Germany',
            r'\bFrance\b': 'France'
        }
        
        for pattern, country in country_patterns.items():
            if re.search(pattern, name, re.IGNORECASE):
                metadata['country'] = country
                break
        
        # Denomination extraction
        denom_match = re.search(r'\b(\d+)c\b|\b(\d+)\s*cent', name, re.IGNORECASE)
        if denom_match:
            metadata['denomination'] = denom_match.group(1) or denom_match.group(2)
        
        return metadata
    
    def sanitize_photos(self, photos: list) -> list:
        """
        Process and sanitize photo uploads
        """
        processed_photos = []
        
        for i, photo in enumerate(photos):
            try:
                processed_photo = self.process_single_photo(photo, i)
                processed_photos.append(processed_photo)
            except Exception as e:
                logger.warning(f"Failed to process photo {i}: {e}")
        
        return processed_photos
    
    def process_single_photo(self, photo, index: int) -> dict:
        """
        Process individual photo with optimization and metadata
        """
        # Generate unique identifier
        photo_uuid = uuid.uuid4()
        
        # Extract original metadata
        original_metadata = self.extract_photo_metadata(photo)
        
        # Create multiple resolutions
        resolutions = self.create_image_resolutions(photo)
        
        # Upload to cloud storage
        storage_urls = self.upload_to_storage(photo_uuid, resolutions)
        
        # Generate thumbnail
        thumbnail_url = self.generate_thumbnail(photo, photo_uuid)
        
        return {
            'photo_uuid': str(photo_uuid),
            'original_filename': getattr(photo, 'filename', f'photo_{index}'),
            'storage_urls': storage_urls,
            'thumbnail_url': thumbnail_url,
            'metadata': original_metadata,
            'processing_timestamp': datetime.utcnow(),
            'status': 'processed'
        }
```

### Stage 2: Intelligent Data Enrichment

```python
class InputEnricher:
    """
    Enrich minimal input with AI-generated data
    """
    def __init__(self):
        self.ai_services = {
            'image_analysis': ImageAnalysisService(),
            'text_analysis': TextAnalysisService(),
            'market_research': MarketResearchService()
        }
        
    async def enrich_input(self, sanitized_input: dict) -> dict:
        """
        Enrich sanitized input with AI-generated data
        """
        enrichment_tasks = [
            self.enrich_from_images(sanitized_input['photos']),
            self.enrich_from_name(sanitized_input['name']),
            self.enrich_pricing_context(sanitized_input['price'], sanitized_input['auction'])
        ]
        
        # Execute enrichment tasks concurrently
        image_enrichment, name_enrichment, price_enrichment = await asyncio.gather(*enrichment_tasks)
        
        # Combine enrichments
        enriched_data = {
            'original_input': sanitized_input,
            'ai_enrichment': {
                'image_analysis': image_enrichment,
                'name_analysis': name_enrichment,
                'price_analysis': price_enrichment,
                'confidence_score': self.calculate_enrichment_confidence([
                    image_enrichment, name_enrichment, price_enrichment
                ])
            },
            'enrichment_timestamp': datetime.utcnow()
        }
        
        return enriched_data
    
    async def enrich_from_images(self, photos: list) -> dict:
        """
        Extract rich data from stamp images
        """
        if not photos:
            return {'error': 'No photos provided'}
        
        # Analyze primary photo (first one)
        primary_photo = photos[0]
        
        # Computer vision analysis
        cv_analysis = await self.ai_services['image_analysis'].analyze_stamp_image(
            primary_photo['storage_urls']['high_res']
        )
        
        # Extract features
        features = {
            'physical_features': cv_analysis.get('physical_features', {}),
            'visual_elements': cv_analysis.get('visual_elements', {}),
            'condition_assessment': cv_analysis.get('condition', {}),
            'text_extraction': cv_analysis.get('extracted_text', {}),
            'color_analysis': cv_analysis.get('colors', {})
        }
        
        # Generate automatic tags
        auto_tags = await self.generate_tags_from_features(features)
        
        # Estimate condition and rarity
        condition_score = self.calculate_condition_score(features['condition_assessment'])
        rarity_estimate = await self.estimate_rarity(features)
        
        return {
            'features': features,
            'auto_tags': auto_tags,
            'condition_score': condition_score,
            'rarity_estimate': rarity_estimate,
            'confidence': cv_analysis.get('confidence', 0.0)
        }
    
    async def enrich_from_name(self, name_data: dict) -> dict:
        """
        Enrich data from stamp name using NLP
        """
        name = name_data['cleaned_name']
        extracted_metadata = name_data['extracted_metadata']
        
        # NLP analysis for additional context
        nlp_analysis = await self.ai_services['text_analysis'].analyze_stamp_name(name)
        
        # Research historical context
        historical_context = await self.research_historical_context(name, extracted_metadata)
        
        # Generate enhanced description
        enhanced_description = await self.generate_description(name, extracted_metadata, historical_context)
        
        # Suggest additional metadata
        suggested_metadata = await self.suggest_metadata(name, nlp_analysis)
        
        return {
            'nlp_analysis': nlp_analysis,
            'historical_context': historical_context,
            'enhanced_description': enhanced_description,
            'suggested_metadata': suggested_metadata,
            'confidence': nlp_analysis.get('confidence', 0.0)
        }
    
    async def enrich_pricing_context(self, price: float, is_auction: bool) -> dict:
        """
        Provide pricing context and recommendations
        """
        # Market analysis for pricing context
        market_context = await self.ai_services['market_research'].analyze_price_context(
            price, is_auction
        )
        
        # Pricing recommendations
        recommendations = await self.generate_pricing_recommendations(
            price, is_auction, market_context
        )
        
        # Competition analysis
        competition = await self.analyze_price_competition(price, is_auction)
        
        return {
            'market_context': market_context,
            'recommendations': recommendations,
            'competition_analysis': competition,
            'pricing_strategy': self.suggest_pricing_strategy(price, is_auction, market_context)
        }
```

### Stage 3: Database Record Creation

```python
class RecordCreator:
    """
    Create comprehensive database records from enriched input
    """
    def __init__(self):
        self.uuid_manager = UUIDManager()
        self.database = DatabaseManager()
        
    async def create_stamp_record(self, enriched_data: dict, user_id: str) -> str:
        """
        Create complete stamp record in database
        """
        # Generate primary stamp UUID
        stamp_uuid = self.uuid_manager.generate_uuid('stamp')
        
        # Create main stamp record
        stamp_record = await self.build_stamp_record(stamp_uuid, enriched_data, user_id)
        
        # Create related records
        await self.create_related_records(stamp_uuid, enriched_data)
        
        # Set up processing queues
        await self.setup_processing_queues(stamp_uuid, enriched_data)
        
        return stamp_uuid
    
    async def build_stamp_record(self, stamp_uuid: str, enriched_data: dict, user_id: str) -> dict:
        """
        Build comprehensive stamp record
        """
        original_input = enriched_data['original_input']
        ai_enrichment = enriched_data['ai_enrichment']
        
        # Extract key data points
        name_data = original_input['name']
        image_features = ai_enrichment['image_analysis']['features']
        suggested_metadata = ai_enrichment['name_analysis']['suggested_metadata']
        
        stamp_record = {
            # Core identifiers
            'stamp_uuid': stamp_uuid,
            'user_id': user_id,
            
            # User input
            'name': name_data['cleaned_name'],
            'user_price': original_input['price'],
            'auction_enabled': original_input['auction'],
            
            # AI-extracted metadata
            'country': suggested_metadata.get('country') or name_data['extracted_metadata'].get('country'),
            'year_issued': suggested_metadata.get('year') or name_data['extracted_metadata'].get('year'),
            'denomination': suggested_metadata.get('denomination') or name_data['extracted_metadata'].get('denomination'),
            'color_primary': image_features['color_analysis'].get('dominant_color'),
            'condition': image_features['condition_assessment'].get('overall_condition'),
            'condition_score': ai_enrichment['image_analysis']['condition_score'],
            
            # AI-generated content
            'ai_description': ai_enrichment['name_analysis']['enhanced_description'],
            'ai_tags': ai_enrichment['image_analysis']['auto_tags'],
            'rarity_estimate': ai_enrichment['image_analysis']['rarity_estimate'],
            
            # Processing status
            'processing_status': 'enriched',
            'ai_confidence': ai_enrichment['confidence_score'],
            'enrichment_version': self.get_current_enrichment_version(),
            
            # Timestamps
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'input_processed_at': enriched_data['enrichment_timestamp']
        }
        
        # Store main record
        await self.database.create_stamp(stamp_record)
        
        return stamp_record
    
    async def create_related_records(self, stamp_uuid: str, enriched_data: dict):
        """
        Create all related database records
        """
        # Create image records
        await self.create_image_records(stamp_uuid, enriched_data['original_input']['photos'])
        
        # Create pricing records
        await self.create_pricing_records(stamp_uuid, enriched_data)
        
        # Create AI analysis records
        await self.create_ai_analysis_records(stamp_uuid, enriched_data['ai_enrichment'])
        
        # Create tag relationships
        await self.create_tag_relationships(stamp_uuid, enriched_data['ai_enrichment']['image_analysis']['auto_tags'])
    
    async def create_image_records(self, stamp_uuid: str, photos: list):
        """
        Create image records for all uploaded photos
        """
        for i, photo in enumerate(photos):
            image_record = {
                'image_uuid': photo['photo_uuid'],
                'stamp_uuid': stamp_uuid,
                'file_name': photo['original_filename'],
                'storage_urls': photo['storage_urls'],
                'thumbnail_url': photo['thumbnail_url'],
                'metadata': photo['metadata'],
                'is_primary': i == 0,  # First photo is primary
                'upload_order': i + 1,
                'created_at': datetime.utcnow()
            }
            
            await self.database.create_image(image_record)
    
    async def create_pricing_records(self, stamp_uuid: str, enriched_data: dict):
        """
        Create pricing records with AI recommendations
        """
        original_price = enriched_data['original_input']['price']
        is_auction = enriched_data['original_input']['auction']
        price_analysis = enriched_data['ai_enrichment']['price_analysis']
        
        # User's original price
        user_pricing = {
            'pricing_uuid': self.uuid_manager.generate_uuid('pricing'),
            'stamp_uuid': stamp_uuid,
            'price_type': 'auction_start' if is_auction else 'fixed',
            'amount': original_price,
            'currency': 'USD',  # Default, could be detected
            'source': 'user_input',
            'is_active': True,
            'created_at': datetime.utcnow()
        }
        
        await self.database.create_pricing(user_pricing)
        
        # AI-recommended prices
        recommendations = price_analysis['recommendations']
        for rec_type, rec_price in recommendations.items():
            ai_pricing = {
                'pricing_uuid': self.uuid_manager.generate_uuid('pricing'),
                'stamp_uuid': stamp_uuid,
                'price_type': f'ai_{rec_type}',
                'amount': rec_price['amount'],
                'currency': 'USD',
                'source': 'ai_recommendation',
                'confidence': rec_price['confidence'],
                'is_active': False,  # Recommendations are not active by default
                'created_at': datetime.utcnow()
            }
            
            await self.database.create_pricing(ai_pricing)
```

## 📊 Input Processing Metrics

### Processing Performance Tracking

```python
class InputProcessingMetrics:
    """
    Track and analyze input processing performance
    """
    def __init__(self):
        self.metrics_collector = MetricsCollector()
        
    async def track_processing_performance(self, processing_session: dict):
        """
        Track performance metrics for input processing
        """
        metrics = {
            'session_id': processing_session['session_id'],
            'user_id': processing_session['user_id'],
            'processing_stages': {
                'validation_time': processing_session['validation_duration'],
                'sanitization_time': processing_session['sanitization_duration'],
                'enrichment_time': processing_session['enrichment_duration'],
                'record_creation_time': processing_session['record_creation_duration'],
                'total_processing_time': processing_session['total_duration']
            },
            'input_complexity': {
                'photo_count': len(processing_session['input']['photos']),
                'name_complexity': self.calculate_name_complexity(processing_session['input']['name']),
                'ai_confidence': processing_session['ai_confidence']
            },
            'success_metrics': {
                'validation_passed': processing_session['validation_success'],
                'enrichment_success': processing_session['enrichment_success'],
                'record_created': processing_session['record_success']
            },
            'timestamp': datetime.utcnow()
        }
        
        await self.metrics_collector.record_processing_metrics(metrics)
        
        # Check for performance issues
        await self.check_performance_thresholds(metrics)
    
    def calculate_name_complexity(self, name: str) -> float:
        """
        Calculate complexity score for stamp name
        """
        factors = {
            'length': len(name) / 100.0,  # Normalize to 0-1 scale
            'word_count': len(name.split()) / 20.0,
            'special_chars': len(re.findall(r'[^a-zA-Z0-9\s]', name)) / 10.0,
            'numeric_content': len(re.findall(r'\d', name)) / len(name) if name else 0
        }
        
        # Weighted complexity score
        complexity = (
            factors['length'] * 0.2 +
            factors['word_count'] * 0.3 +
            factors['special_chars'] * 0.3 +
            factors['numeric_content'] * 0.2
        )
        
        return min(complexity, 1.0)  # Cap at 1.0
    
    async def check_performance_thresholds(self, metrics: dict):
        """
        Check if processing performance meets thresholds
        """
        thresholds = {
            'total_processing_time': 30.0,  # seconds
            'validation_time': 1.0,
            'enrichment_time': 20.0,
            'record_creation_time': 5.0
        }
        
        violations = []
        for stage, threshold in thresholds.items():
            if stage in metrics['processing_stages']:
                if metrics['processing_stages'][stage] > threshold:
                    violations.append({
                        'stage': stage,
                        'actual': metrics['processing_stages'][stage],
                        'threshold': threshold
                    })
        
        if violations:
            await self.alert_performance_violations(metrics['session_id'], violations)
```

## 🔄 Error Handling and Recovery

### Robust Error Processing

```python
class InputErrorHandler:
    """
    Handle errors and provide recovery mechanisms
    """
    def __init__(self):
        self.retry_manager = RetryManager()
        self.fallback_processor = FallbackProcessor()
        
    async def handle_processing_error(self, error: Exception, context: dict) -> dict:
        """
        Handle processing errors with appropriate recovery
        """
        error_type = type(error).__name__
        error_severity = self.classify_error_severity(error, context)
        
        recovery_strategy = {
            'error_type': error_type,
            'severity': error_severity,
            'recovery_action': None,
            'fallback_available': False,
            'user_notification': None
        }
        
        # Determine recovery strategy based on error type
        if error_severity == 'low':
            recovery_strategy = await self.handle_low_severity_error(error, context)
        elif error_severity == 'medium':
            recovery_strategy = await self.handle_medium_severity_error(error, context)
        else:
            recovery_strategy = await self.handle_high_severity_error(error, context)
        
        # Log error for analysis
        await self.log_processing_error(error, context, recovery_strategy)
        
        return recovery_strategy
    
    async def handle_low_severity_error(self, error: Exception, context: dict) -> dict:
        """
        Handle low severity errors (warnings, non-critical issues)
        """
        # Low severity errors allow processing to continue with degraded functionality
        return {
            'recovery_action': 'continue_with_warning',
            'fallback_available': True,
            'user_notification': 'Some features may be limited due to processing issues',
            'degraded_mode': True
        }
    
    async def handle_medium_severity_error(self, error: Exception, context: dict) -> dict:
        """
        Handle medium severity errors (retryable failures)
        """
        # Try to recover through retry or fallback processing
        if await self.retry_manager.should_retry(error, context):
            return {
                'recovery_action': 'retry',
                'fallback_available': True,
                'user_notification': 'Processing is being retried',
                'retry_count': context.get('retry_count', 0) + 1
            }
        else:
            # Use fallback processing
            fallback_result = await self.fallback_processor.process_with_fallback(context)
            return {
                'recovery_action': 'fallback_processing',
                'fallback_available': True,
                'fallback_result': fallback_result,
                'user_notification': 'Using alternative processing method'
            }
    
    async def handle_high_severity_error(self, error: Exception, context: dict) -> dict:
        """
        Handle high severity errors (complete failures)
        """
        # High severity errors require user intervention
        return {
            'recovery_action': 'fail',
            'fallback_available': False,
            'user_notification': f'Processing failed: {str(error)}',
            'requires_user_action': True,
            'suggested_actions': self.suggest_user_actions(error, context)
        }
```

---

**Related Documents:**
- [[03-Core-Engine-Architecture]]
- [[05-AI-Pipeline-Architecture]]
- [[08-Error-Handling-Recovery]]

**Last Updated**: 2025-07-01
**Version**: 1.0
