import React, { useState, useEffect } from 'react';
import { useCategories } from '../../hooks';
import RoundedPhoto from '../../../../../components/roundedPhoto/RoundedPhoto';
import { uploadPhoto as uploadPhotoService } from '../../../../../services/photoUploadService';
import styles from './index.module.css';

const CategoryManager = () => {
  const { categories, createCategory, updateCategory, deleteCategory, fetchCategories } = useCategories();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    category_name: '',
    category_photo_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      // Create a preview URL for the selected file
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        category_photo_url: previewUrl
      }));
    }
  };

  const uploadCategoryPhoto = async (file) => {
    try {
      setUploadingPhoto(true);
      // Use the unified upload service with 'category' content type
      const photoUrl = await uploadPhotoService(file, 'category');
      return photoUrl;
    } catch (error) {
      console.error('Error uploading category photo:', error);
      throw error;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category_name: '',
      category_photo_url: ''
    });
    setPhotoFile(null);
    setEditingCategory(null);
    setIsAdding(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category_name.trim()) {
      setError('Category name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let finalPhotoUrl = formData.category_photo_url;

      // If we have a new photo file, upload it first
      if (photoFile && !formData.category_photo_url.startsWith('http') && !formData.category_photo_url.startsWith('/uploads')) {
        finalPhotoUrl = await uploadCategoryPhoto(photoFile);
      }

      const submitData = {
        category_name: formData.category_name,
        category_photo_url: finalPhotoUrl
      };

      if (editingCategory) {
        // Update existing category
        const result = await updateCategory(editingCategory.category_id, submitData);
        if (result.success) {
          resetForm();
        } else {
          setError(result.error || 'Failed to update category');
        }
      } else {
        // Create new category
        const result = await createCategory(submitData);
        if (result.success) {
          resetForm();
        } else {
          setError(result.error || 'Failed to create category');
        }
      }
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err.message || 'An error occurred while saving the category');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    console.log('Editing category:', category);
    console.log('Category photo URL:', category.category_photo_url);
    console.log('Display URL:', category.category_photo_url);
    
    setEditingCategory(category);
    setFormData({
      category_name: category.category_name,
      category_photo_url: category.category_photo_url || ''
    });
    setPhotoFile(null);
    setIsAdding(false);
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteCategory(categoryId);
      if (!result.success) {
        setError(result.error || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('An error occurred while deleting the category');
    } finally {
      setLoading(false);
    }
  };

  const startAdding = () => {
    setIsAdding(true);
    setEditingCategory(null);
    setFormData({
      category_name: '',
      category_photo_url: ''
    });
    setPhotoFile(null);
    setError(null);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setFormData(prev => ({
      ...prev,
      category_photo_url: ''
    }));
  };

  return (
    <div className={styles.categoryManager}>
      <div className={styles.header}>
        <h2>Category Management</h2>
        <button 
          onClick={startAdding}
          className={styles.addButton}
          disabled={isAdding || editingCategory}
        >
          + Add Category
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingCategory) && (
        <div className={styles.formSection}>
          <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
          <form onSubmit={handleSubmit} className={styles.categoryForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="category_name">Category Name *</label>
                <input
                  type="text"
                  id="category_name"
                  name="category_name"
                  value={formData.category_name}
                  onChange={handleInputChange}
                  placeholder="Enter category name"
                  required
                  className={styles.textInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="category_photo">Category Photo</label>
                <div className={styles.photoInputGroup}>
                  <input
                    type="file"
                    id="category_photo"
                    name="category_photo"
                    accept="image/*"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                    disabled={uploadingPhoto}
                  />
                  {formData.category_photo_url && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      className={styles.removePhotoBtn}
                      disabled={uploadingPhoto}
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
                {uploadingPhoto && (
                  <div className={styles.uploadingIndicator}>
                    📤 Uploading photo...
                  </div>
                )}
                {formData.category_photo_url && (
                  <div className={styles.photoPreview}>
                    <label>Preview:</label>
                    <RoundedPhoto 
                      src={formData.category_photo_url} 
                      alt="Category preview"
                      size={80}
                    />
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className={styles.error}>
                <p>{error}</p>
              </div>
            )}

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={resetForm}
                className={styles.cancelButton}
                disabled={loading || uploadingPhoto}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading || uploadingPhoto}
              >
                {loading ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className={styles.categoriesList}>
        <h3>Existing Categories ({categories.length})</h3>
        
        {categories.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No categories found. Create your first category to get started!</p>
          </div>
        ) : (
          <div className={styles.categoriesGrid}>
            {categories.map(category => (
              <div key={category.category_id} className={styles.categoryCard}>
                <div className={styles.categoryHeader}>
                  <h4>{category.category_name}</h4>
                  <div className={styles.categoryActions}>
                    <button
                      onClick={() => handleEdit(category)}
                      className={styles.editButton}
                      disabled={isAdding || editingCategory}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.category_id)}
                      className={styles.deleteButton}
                      disabled={isAdding || editingCategory || loading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {category.category_photo_url && (
                  <div className={styles.categoryPhoto}>
                    <RoundedPhoto 
                      src={category.category_photo_url} 
                      alt={category.category_name}
                      size={100}
                    />
                  </div>
                )}
                
                <div className={styles.categoryMeta}>
                  <span className={styles.categoryId}>ID: {category.category_id}</span>
                  {category.dish_count !== undefined && (
                    <span className={styles.dishCount}>
                      {category.dish_count} dish{category.dish_count !== 1 ? 'es' : ''}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManager;
