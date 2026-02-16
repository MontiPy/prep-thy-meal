import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  CloudUpload,
  CameraAlt,
  Close,
  Crop,
  Check
} from '@mui/icons-material';

/**
 * ImageUploader Component
 * Provides drag-and-drop, file upload, and camera capture for images
 * Includes built-in cropping functionality and preview
 */
export default function ImageUploader({
  onImageSelected,
  onError,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/heic'],
  maxSizeMB = 10,
  enableCrop = true,
  buttonText = 'Upload Nutrition Label',
  dropzoneText = 'Drag & drop an image, or click to browse'
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [cropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const fileReaderRef = useRef(null);
  const imageLoadRef = useRef(null);

  /**
   * Cleanup FileReader and Image on unmount to prevent memory leaks
   */
  useEffect(() => {
    return () => {
      // Abort any ongoing FileReader operations
      if (fileReaderRef.current) {
        fileReaderRef.current.abort();
        fileReaderRef.current = null;
      }
      // Clear any pending Image loads
      if (imageLoadRef.current) {
        imageLoadRef.current.onload = null;
        imageLoadRef.current.onerror = null;
        imageLoadRef.current.src = '';
        imageLoadRef.current = null;
      }
    };
  }, []);

  /**
   * Cleanup on dialog close to prevent callbacks on unmounted components
   */
  useEffect(() => {
    if (!showCropDialog) {
      // Clear pending image loads when dialog closes
      if (imageLoadRef.current) {
        imageLoadRef.current.onload = null;
        imageLoadRef.current.onerror = null;
        imageLoadRef.current.src = '';
        imageLoadRef.current = null;
      }
    }
  }, [showCropDialog]);

  /**
   * Validate file type and size
   */
  const validateFile = useCallback((file) => {
    if (!acceptedFormats.includes(file.type)) {
      onError?.(`File type not supported. Please use: ${acceptedFormats.join(', ')}`);
      return false;
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      onError?.(`File too large. Maximum size: ${maxSizeMB}MB`);
      return false;
    }

    return true;
  }, [acceptedFormats, maxSizeMB, onError]);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((file) => {
    if (!validateFile(file)) return;

    setOriginalFile(file);

    // Create preview
    const reader = new FileReader();
    fileReaderRef.current = reader;

    reader.onload = (e) => {
      fileReaderRef.current = null; // Clear ref after successful load
      setPreviewImage(e.target.result);
      if (enableCrop) {
        setShowCropDialog(true);
      } else {
        onImageSelected?.(file);
      }
    };
    reader.onerror = () => {
      fileReaderRef.current = null; // Clear ref on error
      onError?.('Failed to read image file');
    };
    reader.readAsDataURL(file);
  }, [enableCrop, onImageSelected, onError, validateFile]);

  /**
   * Drag and drop handlers
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  /**
   * File input change handler
   */
  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  /**
   * Crop image to selected area
   */
  const handleCropConfirm = async () => {
    if (!previewImage) return;

    setIsProcessing(true);

    try {
      // Create canvas and draw cropped image
      const img = new Image();
      imageLoadRef.current = img;

      img.onload = () => {
        // Check if image is still tracked (not cleaned up)
        if (!imageLoadRef.current) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate crop dimensions
        const scaleX = img.naturalWidth / 100;
        const scaleY = img.naturalHeight / 100;

        const cropX = cropArea.x * scaleX;
        const cropY = cropArea.y * scaleY;
        const cropWidth = cropArea.width * scaleX;
        const cropHeight = cropArea.height * scaleY;

        canvas.width = cropWidth;
        canvas.height = cropHeight;

        // Draw cropped portion
        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );

        // Convert to blob
        canvas.toBlob((blob) => {
          // Check again before setState to prevent updates on unmounted component
          if (!imageLoadRef.current) return;

          const croppedFile = new File([blob], originalFile.name, {
            type: originalFile.type,
            lastModified: Date.now()
          });

          imageLoadRef.current = null; // Clear ref after successful processing
          setShowCropDialog(false);
          setIsProcessing(false);
          onImageSelected?.(croppedFile);
        }, originalFile.type, 0.95);
      };

      img.onerror = () => {
        // Check if still mounted before setState
        if (!imageLoadRef.current) return;

        imageLoadRef.current = null; // Clear ref on error
        setIsProcessing(false);
        onError?.('Failed to process image');
      };

      img.src = previewImage;
    } catch (error) {
      console.error('Failed to crop image:', error);
      imageLoadRef.current = null; // Clear ref on exception
      setIsProcessing(false);
      onError?.('Failed to crop image');
    }
  };

  /**
   * Skip cropping and use original image
   */
  const handleSkipCrop = () => {
    setShowCropDialog(false);
    onImageSelected?.(originalFile);
  };

  /**
   * Reset state
   */
  return (
    <Box>
      {/* Drag and Drop Zone */}
      <Paper
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          p: 3,
          mb: 2,
          textAlign: 'center',
          cursor: 'pointer',
          border: '2px dashed',
          borderColor: isDragging ? 'secondary.main' : 'divider',
          bgcolor: isDragging ? 'action.hover' : 'background.paper',
          transition: 'all 250ms ease-out',
          '&:hover': {
            borderColor: 'secondary.main',
            bgcolor: 'action.hover',
          }
        }}
      >
        <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="body1" color="text.primary" gutterBottom>
          {dropzoneText}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supported: JPG, PNG, HEIC, WebP (max {maxSizeMB}MB)
        </Typography>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<CloudUpload />}
          onClick={() => fileInputRef.current?.click()}
        >
          {buttonText}
        </Button>

        <Button
          variant="outlined"
          startIcon={<CameraAlt />}
          onClick={() => cameraInputRef.current?.click()}
          sx={{ display: { xs: 'flex', md: 'none' } }} // Only show on mobile
        >
          Take Photo
        </Button>
      </Box>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Crop Dialog */}
      <Dialog
        open={showCropDialog}
        onClose={() => !isProcessing && setShowCropDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Crop Image
          <IconButton
            onClick={() => !isProcessing && setShowCropDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
            disabled={isProcessing}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {previewImage && (
            <Box sx={{ position: 'relative', width: '100%', minHeight: 300 }}>
              <img
                src={previewImage}
                alt="Preview"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block'
                }}
              />
              <Alert severity="info" sx={{ mt: 2 }}>
                Tip: For best results, crop to include only the nutrition label area.
              </Alert>
            </Box>
          )}

          {isProcessing && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Processing image...
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleSkipCrop}
            disabled={isProcessing}
          >
            Skip Crop
          </Button>
          <Button
            onClick={handleCropConfirm}
            variant="contained"
            startIcon={isProcessing ? <CircularProgress size={20} /> : <Check />}
            disabled={isProcessing}
          >
            Use Full Image
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
