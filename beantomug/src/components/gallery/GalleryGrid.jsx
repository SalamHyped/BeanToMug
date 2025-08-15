import React, { useState, useEffect } from 'react';
import classes from './galleryGrid.module.css';
import GalleryItem from './GalleryItem';
import Modal from '../modal/Modal';
import { getApiConfig } from '../../utils/config';

const GalleryGrid = ({ images, onDelete, canDelete = false }) => {
    const [selectedImage, setSelectedImage] = useState(null);

    const handleImageClick = (image) => {
        setSelectedImage(image);
    };

    const handleCloseModal = () => {
        setSelectedImage(null);
    };

    const handleDelete = async (imageId) => {
        try {
            const response = await fetch(`${getApiConfig().baseURL}/gallery/${imageId}`, {
                method: 'DELETE',
                credentials: 'include', // Include cookies/session
            });

            const data = await response.json();

            if (data.success) {
                onDelete && onDelete(imageId);
                if (selectedImage && selectedImage.post_id === imageId) {
                    setSelectedImage(null);
                }
            } else {
                console.error('Failed to delete image:', data.message);
            }
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    };

    if (images.length === 0) {
        return (
            <div className={classes.emptyState}>
                <div className={classes.emptyIcon}>📷</div>
                <h3 className={classes.emptyTitle}>No images yet</h3>
                <p className={classes.emptyText}>
                    Upload the first image to start building your gallery!
                </p>
            </div>
        );
    }

    return (
        <div className={classes.container}>
            <div className={classes.grid}>
                {images.map((image) => (
                    <GalleryItem
                        key={image.post_id}
                        image={image}
                        onImageClick={handleImageClick}
                        onDelete={() => handleDelete(image.post_id)}
                        canDelete={canDelete}
                    />
                ))}
            </div>

            {selectedImage && (
                <div className={classes.modal} onClick={handleCloseModal}>
                    <div className={classes.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={classes.closeButton} onClick={handleCloseModal}>
                            ×
                        </button>
                        <img
                            src={`${getApiConfig().baseURL}${selectedImage['photo-url']}`}
                            alt={selectedImage.description || 'Gallery image'}
                            className={classes.modalImage}
                            loading="lazy"
                        />
                        {selectedImage.description && (
                            <div className={classes.modalDescription}>
                                <p>{selectedImage.description}</p>
                            </div>
                        )}
                        {canDelete && (
                            <div className={classes.modalActions}>
                                <button
                                    className={classes.deleteButton}
                                    onClick={() => handleDelete(selectedImage.post_id)}
                                >
                                    Delete Image
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GalleryGrid; 