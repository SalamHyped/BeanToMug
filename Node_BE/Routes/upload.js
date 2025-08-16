const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');

// Configure multer for unified photo uploads using memoryStorage
// This stores files in memory temporarily until we can process the contentType
const photoStorage = multer.memoryStorage();

// File filter for photos
const photoFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const extname = path.extname(file.originalname).toLowerCase();
  const isImage = allowedImageTypes.test(extname) && allowedImageTypes.test(file.mimetype);

  if (isImage) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const uploadPhoto = multer({
  storage: photoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for photos
  },
  fileFilter: photoFilter
});

/**
 * POST /upload-photo
 * Unified photo upload endpoint for all content types (Admin only)
 */
router.post('/photo', authenticateToken, requireRole(['admin']), uploadPhoto.single('photo'), async (req, res) => {
  try {
    console.log('Upload request received:');
    console.log('- req.body:', req.body);
    console.log('- req.file buffer size:', req.file ? req.file.buffer.length : 'no file');
    
    if (!req.file || !req.file.buffer) {
      console.log('❌ No file received');
      return res.status(400).json({
        success: false,
        error: 'No photo file provided'
      });
    }

    const contentType = req.body.contentType || 'dish';
    console.log('📁 Content type:', contentType);

    // Determine target directory and prefix based on content type
    let targetDir;
    let prefix;
    
    switch (contentType) {
      case 'category':
        targetDir = path.join(uploadsDir, 'category-photos');
        prefix = 'category';
        break;
      case 'gallery':
        targetDir = path.join(uploadsDir, 'gallery', 'photos');
        prefix = 'gallery';
        break;
      case 'dish':
      default:
        targetDir = path.join(uploadsDir, 'dish-photos');
        prefix = 'dish';
        break;
    }

    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      console.log('📁 Creating target directory:', targetDir);
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Generate final filename with correct prefix
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const finalFilename = `${prefix}-${uniqueSuffix}${path.extname(req.file.originalname)}`;
    const finalPath = path.join(targetDir, finalFilename);

    // Write file buffer directly to final location
    fs.writeFileSync(finalPath, req.file.buffer);
    console.log('✅ File saved to:', finalPath);

    const photoUrl = `/uploads/${contentType === 'gallery' ? 'gallery/photos' : contentType + '-photos'}/${finalFilename}`;

    res.json({
      success: true,
      message: `${contentType} photo uploaded successfully`,
      photo: {
        filename: finalFilename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: photoUrl,
        contentType: contentType
      }
    });

  } catch (error) {
    console.error('Error uploading photo:', error);

    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 5MB.'
      });
    }

    if (error.message && error.message.includes('Only image files are allowed')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload photo'
    });
  }
});

module.exports = router;
