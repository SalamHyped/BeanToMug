import React from 'react';
import { Link } from 'react-router-dom';
import classes from './Home.module.css';

export default function Home() {
  return (
    <div className={classes.homeContainer}>
      {/* Hero Section */}
      <section className={classes.hero}>
        <div className={classes.heroContent}>
          <h1 className={classes.heroTitle}>
            Welcome to <span className={classes.brandName}>Bean to Mug</span>
          </h1>
          <p className={classes.heroSubtitle}>
            Your perfect coffee companion - from bean selection to your favorite mug
          </p>
          <div className={classes.heroButtons}>
            <Link to="/menu" className={classes.primaryButton}>
              Explore Our Menu
            </Link>
            <Link to="/login" className={classes.secondaryButton}>
              Order Now
            </Link>
          </div>
        </div>
        <div className={classes.heroImage}>
          <div className={classes.coffeeIcon}>☕</div>
        </div>
      </section>

      {/* About Section */}
      <section className={classes.about}>
        <div className={classes.aboutContent}>
          <h2 className={classes.sectionTitle}>About Our Project</h2>
          <div className={classes.aboutGrid}>
            <div className={classes.aboutCard}>
              <div className={classes.cardIcon}>🛒</div>
              <h3>Smart Cart System</h3>
              <p>
                Experience seamless shopping with our intelligent cart system. 
                Add items as a guest and seamlessly migrate to your account when you log in.
              </p>
            </div>
            <div className={classes.aboutCard}>
              <div className={classes.cardIcon}>🔐</div>
              <h3>Secure Authentication</h3>
              <p>
                Built with modern authentication including email verification, 
                secure sessions, and protected routes for a safe user experience.
              </p>
            </div>
            <div className={classes.aboutCard}>
              <div className={classes.cardIcon}>💳</div>
              <h3>PayPal Integration</h3>
              <p>
                Complete your orders securely with PayPal integration, 
                supporting both guest and authenticated user checkouts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={classes.features}>
        <div className={classes.featuresContent}>
          <h2 className={classes.sectionTitle}>Key Features</h2>
          <div className={classes.featuresGrid}>
            <div className={classes.featureItem}>
              <h4>🎯 Customizable Orders</h4>
              <p>Personalize your coffee with ingredient selections and quantity controls</p>
            </div>
            <div className={classes.featureItem}>
              <h4>📱 Responsive Design</h4>
              <p>Enjoy a seamless experience across all devices - desktop, tablet, and mobile</p>
            </div>
            <div className={classes.featureItem}>
              <h4>⚡ Real-time Updates</h4>
              <p>See your cart update instantly as you add, modify, or remove items</p>
            </div>
            <div className={classes.featureItem}>
              <h4>🔄 Session Management</h4>
              <p>Your cart persists across browser sessions and device changes</p>
            </div>
            <div className={classes.featureItem}>
              <h4>👥 Multi-User Support</h4>
              <p>Support for customers, staff, and admin roles with appropriate permissions</p>
            </div>
            <div className={classes.featureItem}>
              <h4>📊 Order Tracking</h4>
              <p>Track your orders from placement to completion with detailed status updates</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className={classes.techStack}>
        <div className={classes.techContent}>
          <h2 className={classes.sectionTitle}>Built With Modern Technology</h2>
          <div className={classes.techGrid}>
            <div className={classes.techCard}>
              <h4>Frontend</h4>
              <ul>
                <li>React.js with Hooks</li>
                <li>CSS Modules for styling</li>
                <li>React Router for navigation</li>
                <li>Axios for API calls</li>
              </ul>
            </div>
            <div className={classes.techCard}>
              <h4>Backend</h4>
              <ul>
                <li>Node.js with Express</li>
                <li>MySQL database</li>
                <li>Express sessions</li>
                <li>PayPal SDK integration</li>
              </ul>
            </div>
            <div className={classes.techCard}>
              <h4>Features</h4>
              <ul>
                <li>User authentication</li>
                <li>Email verification</li>
                <li>Cart management</li>
                <li>Payment processing</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className={classes.cta}>
        <div className={classes.ctaContent}>
          <h2>Ready to Experience Great Coffee?</h2>
          <p>Join us and discover the perfect blend of technology and taste</p>
          <div className={classes.ctaButtons}>
            <Link to="/menu" className={classes.primaryButton}>
              Browse Menu
            </Link>
            <Link to="/login" className={classes.secondaryButton}>
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 