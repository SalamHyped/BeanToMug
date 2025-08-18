import React from 'react';
import { Link } from 'react-router-dom';
import { FaTags, FaFolder, FaExchangeAlt } from 'react-icons/fa';
import styles from './ConfigurationDashboard.module.css';

const ConfigurationDashboard = () => {
  const configSections = [
    {
      title: 'Ingredient Types',
      description: 'Manage ingredient types and their physical properties',
      icon: FaTags,
      path: '/admin/menuManagement/ingredient-types',
      color: '#4CAF50'
    },
    {
      title: 'Ingredient Categories',
      description: 'Organize ingredients into logical categories',
      icon: FaFolder,
      path: '/admin/menuManagement/ingredient-categories',
      color: '#2196F3'
    },
    {
      title: 'Ingredient Effects',
      description: 'Configure how options affect ingredient stock levels',
      icon: FaExchangeAlt,
      path: '/admin/menuManagement/ingredient-effects',
      color: '#FF9800'
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Configuration Dashboard</h1>
        <p>Manage ingredient settings and relationships</p>
      </div>

      <div className={styles.grid}>
        {configSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Link 
              key={section.path}
              to={section.path} 
              className={styles.card}
              style={{ '--accent-color': section.color }}
            >
              <div className={styles.cardIcon}>
                <IconComponent />
              </div>
              <div className={styles.cardContent}>
                <h3>{section.title}</h3>
                <p>{section.description}</p>
              </div>
              <div className={styles.cardArrow}>→</div>
            </Link>
          );
        })}
      </div>

      <div className={styles.info}>
        <h2>Configuration Overview</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <h4>Ingredient Types</h4>
            <p>Define whether ingredients are physical (affect stock) or non-physical (options like size, temperature).</p>
          </div>
          <div className={styles.infoCard}>
            <h4>Categories</h4>
            <p>Group related ingredients together for better organization and easier menu management.</p>
          </div>
          <div className={styles.infoCard}>
            <h4>Effects</h4>
            <p>Set up how non-physical options (like "Large Size") affect the stock of physical ingredients.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationDashboard;

