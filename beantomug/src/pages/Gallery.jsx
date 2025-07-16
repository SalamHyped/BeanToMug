import React, { useState, useEffect } from 'react';
import styles from './gallery.module.css';
import GalleryGrid from '../components/gallery/GalleryGrid';
import UploadForm from '../components/gallery/UploadForm';
import { useUser } from '../context/UserContext/UserContext';

const Gallery = () => {
    const { user } = useUser();
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Check if user is staff or admin
    const isStaffOrAdmin = user && (user.role === 'staff' || user.role === 'admin');

    const fetchImages = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8801/gallery', {
                credentials: 'include', // Include cookies/session
            });
            const data = await response.json();
            
            if (data.success) {
                setImages(data.data);
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
                <h1 className={styles.title}>Our Gallery</h1>
                <p className={styles.subtitle}>Discover our beautiful coffee moments</p>
            </div>
            
            {isStaffOrAdmin && (
                <UploadForm onImageUploaded={handleImageUploaded} />
            )}
            
            <GalleryGrid 
                images={images} 
                onImageDeleted={handleImageDeleted}
                canDelete={isStaffOrAdmin}
            />
        </div>
    );
};

export default Gallery; 