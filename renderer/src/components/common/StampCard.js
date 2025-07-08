import React from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import './StampCard.css';

const StampCard = ({ stamp, compact = false, onUpdate }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: '#fbbf24',
      processing: '#3b82f6',
      completed: '#10b981',
      failed: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      processing: '⚙️',
      completed: '✅',
      failed: '❌'
    };
    return icons[status] || '❓';
  };

  const getPrimaryImage = () => {
    const photos = stamp.user_input?.photos || [];
    const primaryPhoto = photos.find(photo => photo.is_primary) || photos[0];
    
    if (primaryPhoto) {
      return apiService.getImageUrl(primaryPhoto.file_path);
    }
    
    return '/placeholder-stamp.png'; // Fallback image
  };

  const formatPrice = (price) => {
    const numPrice = parseFloat(price || 0);
    return apiService.formatCurrency(numPrice);
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return apiService.formatDate(date);
  };

  const getScottNumber = () => {
    return stamp.scott_catalog_match?.scott_number || 'Unknown';
  };

  const getCondition = () => {
    return stamp.ai_analysis?.visual_features?.condition?.overall || 'Unknown';
  };

  const getCountry = () => {
    return stamp.ai_analysis?.visual_features?.country || 'Unknown';
  };

  const getYear = () => {
    return stamp.ai_analysis?.visual_features?.year_issued || 'Unknown';
  };

  const getConfidenceScore = () => {
    const score = stamp.scott_catalog_match?.confidence_score;
    if (!score) return null;
    return Math.round(score * 100);
  };

  const cardClassName = `stamp-card ${compact ? 'compact' : ''} ${stamp.processing_status}`;

  return (
    <div className={cardClassName}>
      <Link to={`/stamp/${stamp.stamp_uuid}`} className="stamp-card-link">
        {/* Image Section */}
        <div className="stamp-image-container">
          <img 
            src={getPrimaryImage()} 
            alt={stamp.user_input?.name || 'Stamp'}
            className="stamp-image"
            onError={(e) => {
              e.target.src = '/placeholder-stamp.png';
            }}
          />
          
          {/* Status Badge */}
          <div 
            className="status-badge"
            style={{ backgroundColor: getStatusColor(stamp.processing_status) }}
          >
            <span className="status-icon">{getStatusIcon(stamp.processing_status)}</span>
            <span className="status-text">{stamp.processing_status}</span>
          </div>

          {/* AI Confidence Score */}
          {getConfidenceScore() && (
            <div className="confidence-badge">
              <span className="confidence-text">{getConfidenceScore()}% match</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="stamp-content">
          <div className="stamp-header">
            <h3 className="stamp-name" title={stamp.user_input?.name}>
              {stamp.user_input?.name || 'Unnamed Stamp'}
            </h3>
            <div className="stamp-price">
              {formatPrice(stamp.user_input?.price)}
            </div>
          </div>

          {!compact && (
            <div className="stamp-details">
              <div className="detail-row">
                <span className="detail-label">Scott #:</span>
                <span className="detail-value">{getScottNumber()}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Country:</span>
                <span className="detail-value">{getCountry()}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Year:</span>
                <span className="detail-value">{getYear()}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Condition:</span>
                <span className="detail-value">{getCondition()}</span>
              </div>
            </div>
          )}

          <div className="stamp-footer">
            <div className="stamp-meta">
              <span className="created-date">
                Added {formatDate(stamp.created_at)}
              </span>
            </div>

            {/* Integration Status */}
            <div className="integration-status">
              {stamp.ebay_integration?.listed && (
                <div className="integration-badge ebay" title="Listed on eBay">
                  🛒
                </div>
              )}
              
              {stamp.wix_integration?.published && (
                <div className="integration-badge wix" title="Published on Wix">
                  🌐
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Action Buttons (only in full view) */}
      {!compact && (
        <div className="stamp-actions">
          <button 
            className="action-button edit"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Handle edit action
            }}
            title="Edit Stamp"
          >
            ✏️
          </button>
          
          <button 
            className="action-button delete"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Handle delete action
            }}
            title="Delete Stamp"
          >
            🗑️
          </button>
          
          <button 
            className="action-button market"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Handle market research action
            }}
            title="Market Research"
          >
            📈
          </button>
        </div>
      )}
    </div>
  );
};

export default StampCard;
