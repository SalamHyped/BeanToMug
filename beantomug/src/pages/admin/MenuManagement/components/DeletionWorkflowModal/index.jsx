import React from 'react';
import styles from './deletionWorkflowModal.module.css';

const DeletionWorkflowModal = ({ 
  title, 
  workflow, 
  onClose, 
  onRetry 
}) => {
  if (!workflow || !workflow.steps) {
    return null;
  }

  const { steps } = workflow;
  const canDelete = steps.length === 1 && steps[0].completed;

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button 
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalBody}>
          {canDelete ? (
            // Ready to delete
            <div className={styles.readyToDelete}>
              <div className={styles.successIcon}>✅</div>
              <h4>Ready to Delete</h4>
              <p>No dependencies found. This item can be safely deleted.</p>
            </div>
          ) : (
            // Show workflow steps
            <div className={styles.workflowContainer}>
              <div className={styles.workflowHeader}>
                <div className={styles.warningIcon}>⚠️</div>
                <div className={styles.workflowInfo}>
                  <h4>Cannot Delete - Dependencies Found</h4>
                  <p>
                    This item cannot be deleted because it's being used by other components. 
                    Complete the following steps in order to safely remove it:
                  </p>
                </div>
              </div>

              <div className={styles.stepsContainer}>
                {steps.map((step, index) => (
                  <div 
                    key={step.step} 
                    className={`${styles.stepItem} ${
                      step.completed ? styles.completedStep : styles.pendingStep
                    }`}
                  >
                    <div className={styles.stepNumber}>
                      {step.completed ? (
                        <span className={styles.checkmark}>✓</span>
                      ) : (
                        step.step
                      )}
                    </div>
                    
                    <div className={styles.stepContent}>
                      <div className={styles.stepAction}>
                        {step.action}
                      </div>
                      <div className={styles.stepDescription}>
                        {step.description}
                      </div>
                      {step.instructions && (
                        <div className={styles.stepInstructions}>
                          💡 {step.instructions}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.workflowHelp}>
                <h5>📋 Deletion Process:</h5>
                <ol className={styles.helpList}>
                  <li>Complete each step above in the exact order shown</li>
                  <li>Each step must be finished before moving to the next</li>
                  <li>Once all dependencies are removed, deletion will be safe</li>
                  <li>Use the "Check Again" button to verify your progress</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          {canDelete ? (
            <>
              <button 
                className={styles.cancelButton}
                onClick={handleClose}
              >
                Cancel
              </button>
              <button 
                className={styles.deleteButton}
                onClick={handleRetry}
              >
                Proceed with Deletion
              </button>
            </>
          ) : (
            <>
              <button 
                className={styles.cancelButton}
                onClick={handleClose}
              >
                Close
              </button>
              <button 
                className={styles.retryButton}
                onClick={handleRetry}
              >
                Check Again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeletionWorkflowModal;

