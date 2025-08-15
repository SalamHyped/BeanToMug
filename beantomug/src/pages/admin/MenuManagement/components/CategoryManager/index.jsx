import React, { useState, useEffect } from 'react';
import { useCategories } from '../../hooks';
import styles from './index.module.css';

const CategoryManager = () => {
  const { categories, createCategory, updateCategory, deleteCategory, fetchCategories } = useCategories();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    category_name: '',
    category_description: '',
    category_photo_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const resetForm = () => {
    setFormData({
      category_name: '',
      category_description: '',
      category_photo_url: ''
    });
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
      if (editingCategory) {
        // Update existing category
        const result = await updateCategory(editingCategory.category_id, formData);
        if (result.success) {
          resetForm();
        } else {
          setError(result.error || 'Failed to update category');
        }
      } else {
        // Create new category
        const result = await createCategory(formData);
        if (result.success) {
          resetForm();
        } else {
          setError(result.error || 'Failed to create category');
        }
      }
    } catch (err) {
      console.error('Error saving category:', err);
      setError('An error occurred while saving the category');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      category_name: category.category_name,
      category_description: category.category_description || '',
      category_photo_url: category.category_photo_url || ''
    });
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
      category_description: '',
      category_photo_url: ''
    });
    setError(null);
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
                <label htmlFor="category_description">Description</label>
                <input
                  type="text"
                  id="category_description"
                  name="category_description"
                  value={formData.category_description}
                  onChange={handleInputChange}
                  placeholder="Optional description"
                  className={styles.textInput}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="category_photo_url">Photo URL</label>
                <input
                  type="url"
                  id="category_photo_url"
                  name="category_photo_url"
                  value={formData.category_photo_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/photo.jpg"
                  className={styles.textInput}
                />
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
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
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
                
                {category.category_description && (
                  <p className={styles.categoryDescription}>
                    {category.category_description}
                  </p>
                )}
                
                {category.category_photo_url && (
                  <div className={styles.categoryPhoto}>
                    <img 
                      src={category.category_photo_url} 
                      alt={category.category_name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
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
