import React from 'react';
import Modal from '../../../../../components/modal/Modal';
import DishForm from '../DishForm';
import styles from './dishEditModal.module.css';

const DishEditModal = ({ 
  isOpen, 
  onClose, 
  dishId, 
  onDishUpdated 
}) => {
  const handleDishUpdated = () => {
    if (onDishUpdated) {
      onDishUpdated();
    }
    onClose(); // Close modal after successful update
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen || !dishId) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Dish">
      <div className={styles.modalContent}>
        <DishForm
          editingDishId={dishId}
          onDishUpdated={handleDishUpdated}
          onCancel={handleCancel}
        />
      </div>
    </Modal>
  );
};

export default DishEditModal;
