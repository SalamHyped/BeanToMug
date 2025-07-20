import React from 'react';
import styles from './galleryUpdates.module.css';

const GalleryUpdates = ({ galleryUpdates = [] }) => {
    return (
        <div className={styles.section}>
            <h3>🖼️ Gallery Updates</h3>
            <div className={styles.list}>
                {galleryUpdates.length === 0 ? (
                    <p className={styles.empty}>No recent uploads</p>
                ) : (
                    galleryUpdates.map((update, index) => (
                        <div key={index} className={styles.item}>
                            <div className={styles.itemHeader}>
                                <span className={styles.type}>
                                    {update.fileType?.startsWith('image/') ? '📷 Image' : '🎥 Video'}
                                </span>
                                <span className={styles.time}>
                                    {new Date(update.publishDate).toLocaleDateString()}
                                </span>
                            </div>
                            <div className={styles.itemDetails}>
                                <span className={styles.description}>
                                    {update.description || 'No description'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default GalleryUpdates; 