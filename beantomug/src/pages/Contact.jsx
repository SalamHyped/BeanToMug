import React from 'react';
import styles from './contact.module.css';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

const Contact = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Contact Us</h1>
        <p className={styles.subtitle}>We'd love to hear from you. Get in touch with us!</p>
      </div>

      <div className={styles.content}>
        <div className={styles.contactCards}>
          {/* Phone Numbers Card */}
          <div className={styles.contactCard}>
            <div className={styles.iconWrapper}>
              <FaPhone className={styles.icon} />
            </div>
            <h2 className={styles.cardTitle}>Phone Numbers</h2>
            <div className={styles.contactInfo}>
              <a href="tel:+15551234567" className={styles.contactLink}>
                0525881614
              </a>
              <a href="tel:+15559876543" className={styles.contactLink}>
                0546756660
              </a>
            </div>
            <p className={styles.cardDescription}>
              Call us anytime during business hours
            </p>
          </div>

          {/* Email Card */}
          <div className={styles.contactCard}>
            <div className={styles.iconWrapper}>
              <FaEnvelope className={styles.icon} />
            </div>
            <h2 className={styles.cardTitle}>Email</h2>
            <div className={styles.contactInfo}>
              <a href="mailto:info@beantomug.com" className={styles.contactLink}>
                info@beantomug.com
              </a>
            </div>
            <p className={styles.cardDescription}>
              Send us an email and we'll get back to you soon
            </p>
          </div>

          {/* Location Card */}
          <div className={styles.contactCard}>
            <div className={styles.iconWrapper}>
              <FaMapMarkerAlt className={styles.icon} />
            </div>
            <h2 className={styles.cardTitle}>Location</h2>
            <div className={styles.contactInfo}>
              <p className={styles.address}>
                123 Coffee Street<br />
                Downtown District<br />
                City, State 12345
              </p>
            </div>
            <p className={styles.cardDescription}>
              Visit us at our cozy coffee shop
            </p>
          </div>

          {/* Hours Card */}
          <div className={styles.contactCard}>
            <div className={styles.iconWrapper}>
              <FaClock className={styles.icon} />
            </div>
            <h2 className={styles.cardTitle}>Opening Hours</h2>
            <div className={styles.contactInfo}>
              <div className={styles.hours}>
                <div className={styles.hourItem}>
                  <span className={styles.day}>Monday - Friday</span>
                  <span className={styles.time}>6:00 AM - 10:00 PM</span>
                </div>
                <div className={styles.hourItem}>
                  <span className={styles.day}>Saturday</span>
                  <span className={styles.time}>7:00 AM - 11:00 PM</span>
                </div>
                <div className={styles.hourItem}>
                  <span className={styles.day}>Sunday</span>
                  <span className={styles.time}>7:00 AM - 9:00 PM</span>
                </div>
              </div>
            </div>
            <p className={styles.cardDescription}>
              Holiday hours may vary
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
