const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
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

// Upload new image to gallery (staff/admin only)
router.post('/upload', requireStaffOrAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const db = req.db;
        const {description } = req.body;
        const imagePath = `/uploads/${req.file.filename}`;

        const [result] = await db.execute(`
            INSERT INTO gallery (\`photo-url\`, description, file_type, publish_date, user_id)
            VALUES (?, ?, ?, CURRENT_DATE, ?)
        `, [imagePath, description || '', req.file.mimetype, req.session.userId || null]);

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                post_id: result.insertId,
                'photo-url': imagePath,
                description: description || '',
                file_type: req.file.mimetype,
                publish_date: new Date().toISOString().split('T')[0],
                user_id: req.session.userId || null
            }
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading image'
        });
    }
});

// Delete image from gallery (staff/admin only)
router.delete('/:id', requireStaffOrAdmin, async (req, res) => {
    try {
        const db = req.db;
        const imageId = req.params.id;

        // Get image info before deleting
        const [imageRows] = await db.execute(`
            SELECT \`photo-url\` FROM gallery WHERE post_id = ?
        `, [imageId]);

        if (imageRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }

        // Delete from database
        await db.execute(`
            DELETE FROM gallery WHERE post_id = ?
        `, [imageId]);

        // Delete file from filesystem
        const photoUrl = imageRows[0]['photo-url'];
        const filename = photoUrl.split('/').pop();
        const filePath = path.join(uploadsDir, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting image'
        });
    }
});

// Update image details (staff/admin only)
router.put('/:id', requireStaffOrAdmin, async (req, res) => {
    try {
        const db = req.db;
        const imageId = req.params.id;
        const { title, description } = req.body;

        const [result] = await db.execute(`
            UPDATE gallery 
            SET description = ?
            WHERE post_id = ?
        `, [description, imageId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }

        res.json({
            success: true,
            message: 'Image updated successfully'
        });
    } catch (error) {
        console.error('Error updating image:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating image'
        });
    }
});

// Serve uploaded files
router.use('/uploads', express.static(uploadsDir));

module.exports = router; 