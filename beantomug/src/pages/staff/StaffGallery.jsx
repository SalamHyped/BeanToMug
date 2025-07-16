import React, { useState, useEffect } from 'react';
import styles from './staffGallery.module.css';
import GalleryGrid from '../../components/gallery/GalleryGrid';
import UploadForm from '../../components/gallery/UploadForm';
import { useUser } from '../../context/UserContext/UserContext';

const StaffGallery = () => {
    const { user } = useUser();
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalImages: 0,
        recentUploads: 0,
        totalSize: 0
    });

    const fetchImages = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8801/gallery', {
                credentials: 'include', // Include cookies/session
            });
            const data = await response.json();
            
            if (data.success) {
                setImages(data.data);
                // Calculate stats
                setStats({
                    totalImages: data.data.length,
                    recentUploads: data.data.filter(img => {
                        const uploadDate = new Date(img.publish_date);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return uploadDate > weekAgo;
                    }).length,
                    totalSize: 0 // Could be calculated if file size is stored
                });
            } else {
                setError('Failed to fetch images');
            }
        } catch (err) {
            setError('Error loading gallery images');
            console.error('Error fetching images:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const handleImageUploaded = () => {
        fetchImages(); // Refresh the gallery after upload
    };

    const handleImageDeleted = (deletedId) => {
        setImages(images.filter(img => img.post_id !== deletedId));
        // Update stats
        setStats(prev => ({
            ...prev,
            totalImages: prev.totalImages - 1
        }));
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading gallery...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>{error}</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>Gallery Management</h1>
                    <p className={styles.subtitle}>Manage your coffee shop gallery</p>
                </div>
                
                <div className={styles.stats}>
                    <div className={styles.statCard}>
                        <div className={styles.statNumber}>{stats.totalImages}</div>
                        <div className={styles.statLabel}>Total Images</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statNumber}>{stats.recentUploads}</div>
                        <div className={styles.statLabel}>Recent Uploads</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statNumber}>{user?.firstName || 'Staff'}</div>
                        <div className={styles.statLabel}>Current User</div>
                    </div>
                </div>
            </div>
            
            <div className={styles.content}>
                <div className={styles.uploadSection}>
                    <UploadForm onImageUploaded={handleImageUploaded} />
                </div>
                
                <div className={styles.gallerySection}>
                    <h2 className={styles.sectionTitle}>Gallery Images</h2>
                    <GalleryGrid 
                        images={images} 
                        onImageDeleted={handleImageDeleted}
                        canDelete={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default StaffGallery; 