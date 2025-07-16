const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Ensure uploads directory and subdirectories exist
const uploadsDir = path.join(__dirname, '../uploads');
const galleryDir = path.join(uploadsDir, 'gallery');
const photosDir = path.join(galleryDir, 'photos');
const videosDir = path.join(galleryDir, 'videos');

// Create directories if they don't exist
[uploadsDir, galleryDir, photosDir, videosDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure multer for image and video uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Determine if file is image or video and set appropriate directory
        const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
        const extname = path.extname(file.originalname).toLowerCase();
        const isImage = allowedImageTypes.test(extname) && allowedImageTypes.test(file.mimetype);
        
        if (isImage) {
            cb(null, photosDir);
        } else {
            cb(null, videosDir);
        }
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to allow images and videos
const fileFilter = (req, file, cb) => {
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const allowedVideoTypes = /mp4|webm|mov/;
    const extname = path.extname(file.originalname).toLowerCase();
    const isImage = allowedImageTypes.test(extname) && allowedImageTypes.test(file.mimetype);
    const isVideo = allowedVideoTypes.test(extname) && file.mimetype.startsWith('video/');

    if (isImage || isVideo) {
        return cb(null, true);
    } else {
        cb(new Error('Only image and video files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit for videos
    },
    fileFilter: fileFilter
});

// Get all gallery images
router.get('/', async (req, res) => {
    try {
        const db = req.db;
        const [rows] = await db.execute(`
            SELECT * FROM gallery 
            ORDER BY publish_date DESC
        `);
        
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching gallery images:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching gallery images'
        });
    }
});

// Middleware to check if user is staff or admin
const requireStaffOrAdmin = (req, res, next) => {

    
    // Check if user is authenticated
    if (!req.session || !req.session.userId) {
        console.log('Gallery middleware - Authentication failed: No session or userId');
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    
    // Check if user is staff or admin
    if (req.session.role !== 'staff' && req.session.role !== 'admin') {
        console.log('Gallery middleware - Authorization failed: Role is', req.session.role);
        return res.status(403).json({
            success: false,
            message: 'Access denied. Staff or admin privileges required.'
        });
    }
    
    next();
};

// Upload new image or video to gallery (staff/admin only)
router.post('/upload', requireStaffOrAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file provided'
            });
        }

        const db = req.db;
        const {description } = req.body;
        
        // Determine the correct path based on file type
        const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
        const extname = path.extname(req.file.originalname).toLowerCase();
        const isImage = allowedImageTypes.test(extname) && allowedImageTypes.test(req.file.mimetype);
        
        const filePath = isImage 
            ? `/uploads/gallery/photos/${req.file.filename}`
            : `/uploads/gallery/videos/${req.file.filename}`;

        const [result] = await db.execute(`
            INSERT INTO gallery (\`photo-url\`, description, file_type, publish_date, user_id)
            VALUES (?, ?, ?, CURRENT_DATE, ?)
        `, [filePath, description || '', req.file.mimetype, req.session.userId || null]);

        // Emit real-time notification for gallery update
        req.socketService.emitGalleryUpdate({
            postId: result.insertId,
            photoUrl: filePath,
            description: description || '',
            fileType: req.file.mimetype,
            uploadedBy: req.session.userId,
            publishDate: new Date().toISOString().split('T')[0]
        });

        // Emit notification to admin and staff
        req.socketService.emitNotification({
            targetRole: 'admin',
            message: `New ${isImage ? 'image' : 'video'} uploaded to gallery`,
            type: 'gallery_update'
        });

        res.json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                post_id: result.insertId,
                'photo-url': filePath,
                description: description || '',
                file_type: req.file.mimetype,
                publish_date: new Date().toISOString().split('T')[0],
                user_id: req.session.userId || null
            }
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading file'
        });
    }
});

// Delete file from gallery (staff/admin only)
router.delete('/:id', requireStaffOrAdmin, async (req, res) => {
    try {
        const db = req.db;
        const fileId = req.params.id;

        // Get file info before deleting
        const [fileRows] = await db.execute(`
            SELECT \`photo-url\` FROM gallery WHERE post_id = ?
        `, [fileId]);

        if (fileRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Delete from database
        await db.execute(`
            DELETE FROM gallery WHERE post_id = ?
        `, [fileId]);

        // Delete file from filesystem
        const fileUrl = fileRows[0]['photo-url'];
        const filename = fileUrl.split('/').pop();
        
        // Determine the correct directory based on the file path
        let filePath;
        if (fileUrl.includes('/photos/')) {
            filePath = path.join(photosDir, filename);
        } else if (fileUrl.includes('/videos/')) {
            filePath = path.join(videosDir, filename);
        } else {
            // Fallback to old structure
            filePath = path.join(uploadsDir, filename);
        }
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting file'
        });
    }
});

// Update file details (staff/admin only)
router.put('/:id', requireStaffOrAdmin, async (req, res) => {
    try {
        const db = req.db;
        const fileId = req.params.id;
        const { title, description } = req.body;

        const [result] = await db.execute(`
            UPDATE gallery 
            SET description = ?
            WHERE post_id = ?
        `, [description, fileId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        res.json({
            success: true,
            message: 'File updated successfully'
        });
    } catch (error) {
        console.error('Error updating file:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating file'
        });
    }
});

// Serve uploaded files
router.use('/uploads', express.static(uploadsDir));

module.exports = router; 