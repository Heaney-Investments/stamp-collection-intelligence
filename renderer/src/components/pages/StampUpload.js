import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { apiService } from '../../services/apiService';
import LoadingSpinner from '../common/LoadingSpinner';
import './StampUpload.css';

const StampUpload = () => {
  const navigate = useNavigate();
  const { state, actions } = useAppContext();
  const { user } = state;
  
  const [uploadState, setUploadState] = useState({
    files: [],
    dragActive: false,
    uploading: false,
    uploadProgress: 0
  });
  
  const [stampData, setStampData] = useState({
    name: '',
    price: '',
    auction_enabled: false,
    description: ''
  });

  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFiles = async (files) => {
    const fileArray = Array.from(files);
    const validFiles = [];

    for (const file of fileArray) {
      try {
        await apiService.validateImageFile(file);
        validFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
          preview: URL.createObjectURL(file),
          name: file.name,
          size: file.size
        });
      } catch (error) {
        console.error(`${file.name}: ${error.message}`);
      }
    }

    setUploadState(prev => ({
      ...prev,
      files: [...prev.files, ...validFiles]
    }));
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadState(prev => ({ ...prev, dragActive: true }));
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadState(prev => ({ ...prev, dragActive: false }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadState(prev => ({ ...prev, dragActive: false }));
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  // File input change handler
  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  // Remove file
  const removeFile = (fileId) => {
    setUploadState(prev => ({
      ...prev,
      files: prev.files.filter(f => f.id !== fileId)
    }));
  };

  // Set primary image
  const setPrimaryImage = (fileId) => {
    setUploadState(prev => ({
      ...prev,
      files: prev.files.map(f => ({
        ...f,
        isPrimary: f.id === fileId
      }))
    }));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setStampData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Upload files and create stamp
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (uploadState.files.length === 0) {
      console.error('Please select at least one image');
      return;
    }

    if (!stampData.name.trim()) {
      console.error('Please enter a stamp name');
      return;
    }

    try {
      setUploadState(prev => ({ ...prev, uploading: true, uploadProgress: 0 }));

      // Step 1: Upload files
      const filesToUpload = uploadState.files.map(f => f.file);
      setUploadState(prev => ({ ...prev, uploadProgress: 25 }));
      
      const uploadResponse = await apiService.uploadImages(filesToUpload, user.uuid);
      setUploadState(prev => ({ ...prev, uploadProgress: 50 }));

      // Step 2: Create stamp record
      const primaryFileIndex = uploadState.files.findIndex(f => f.isPrimary);
      const photos = uploadResponse.files.map((file, index) => ({
        ...file,
        is_primary: index === (primaryFileIndex >= 0 ? primaryFileIndex : 0)
      }));

      const newStampData = {
        user_uuid: user.uuid,
        name: stampData.name.trim(),
        price: parseFloat(stampData.price) || 0,
        auction_enabled: stampData.auction_enabled,
        photos: photos
      };

      setUploadState(prev => ({ ...prev, uploadProgress: 75 }));
      const createResponse = await apiService.createStamp(newStampData);
      setUploadState(prev => ({ ...prev, uploadProgress: 100 }));

      // Update global state
      actions.addStamp(createResponse.stamp);

      console.log('Stamp uploaded successfully!');
      
      // Reset form
      setUploadState({
        files: [],
        dragActive: false,
        uploading: false,
        uploadProgress: 0
      });
      
      setStampData({
        name: '',
        price: '',
        auction_enabled: false,
        description: ''
      });

      // Navigate to the new stamp
      setTimeout(() => {
        navigate(`/stamp/${createResponse.stamp.stamp_uuid}`);
      }, 1000);

    } catch (error) {
      console.error('Upload failed:', error);
      console.error(`Upload failed: ${error.message}`);
      setUploadState(prev => ({ ...prev, uploading: false, uploadProgress: 0 }));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="stamp-upload">
      <div className="upload-header">
        <h1 className="upload-title">Upload New Stamps</h1>
        <p className="upload-subtitle">
          Add stamps to your collection for AI analysis and catalog matching
        </p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        {/* File Upload Area */}
        <div 
          className={`upload-dropzone ${uploadState.dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInputChange}
            className="file-input"
            disabled={uploadState.uploading}
          />
          
          <div className="dropzone-content">
            <div className="dropzone-icon">📤</div>
            <h3 className="dropzone-title">
              Drop images here or click to browse
            </h3>
            <p className="dropzone-subtitle">
              Supports JPEG, PNG, GIF, WebP up to 10MB each
            </p>
          </div>
        </div>

        {/* File Preview */}
        {uploadState.files.length > 0 && (
          <div className="file-preview-section">
            <h3 className="section-title">Selected Images ({uploadState.files.length})</h3>
            <div className="file-preview-grid">
              {uploadState.files.map((file) => (
                <div key={file.id} className="file-preview-item">
                  <div className="preview-image-container">
                    <img 
                      src={file.preview} 
                      alt={file.name}
                      className="preview-image"
                    />
                    
                    {file.isPrimary && (
                      <div className="primary-badge">Primary</div>
                    )}
                    
                    <div className="preview-actions">
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(file.id)}
                        className="action-btn primary"
                        title="Set as primary image"
                        disabled={uploadState.uploading}
                      >
                        ⭐
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="action-btn remove"
                        title="Remove image"
                        disabled={uploadState.uploading}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  <div className="file-info">
                    <span className="file-name" title={file.name}>
                      {file.name}
                    </span>
                    <span className="file-size">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stamp Information */}
        <div className="stamp-info-section">
          <h3 className="section-title">Stamp Information</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Stamp Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={stampData.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., 1963 Kennedy Memorial"
                required
                disabled={uploadState.uploading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="price" className="form-label">
                Price (USD)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={stampData.price}
                onChange={handleInputChange}
                className="form-input"
                placeholder="0.00"
                min="0"
                step="0.01"
                disabled={uploadState.uploading}
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="auction_enabled"
                  checked={stampData.auction_enabled}
                  onChange={handleInputChange}
                  className="checkbox-input"
                  disabled={uploadState.uploading}
                />
                <span className="checkbox-text">
                  Enable auction listing
                </span>
              </label>
            </div>

            <div className="form-group full-width">
              <label htmlFor="description" className="form-label">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={stampData.description}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Additional notes about this stamp..."
                rows="3"
                disabled={uploadState.uploading}
              />
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {uploadState.uploading && (
          <div className="upload-progress-section">
            <div className="progress-header">
              <LoadingSpinner size="small" />
              <span className="progress-text">
                Uploading and processing... {uploadState.uploadProgress}%
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${uploadState.uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            disabled={uploadState.uploading}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={uploadState.uploading || uploadState.files.length === 0}
          >
            {uploadState.uploading ? 'Uploading...' : 'Upload Stamps'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StampUpload;
