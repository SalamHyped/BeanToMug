import React from 'react';
import classes from './footer.module.css';
import { FaFacebook, FaInstagram, FaTwitter, FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from 'react-icons/fa';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={classes.footer}>
      <div className={classes.footerContent}>
        <div className={classes.footerSection}>
          <div className={classes.footerLogo}>
            <img src="/images/logo.png" alt="Bean to Mug" />
            <h3>Bean to Mug</h3>
          </div>
          <p className={classes.footerDescription}>
            Crafting the perfect cup of coffee, one bean at a time. 
            From farm to cup, we bring you the finest coffee experience 
            with passion and dedication.
          </p>
          <div className={classes.socialLinks}>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <FaFacebook />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <FaTwitter />
            </a>
          </div>
        </div>

        <div className={classes.footerSection}>
          <h4>Quick Links</h4>
          <ul className={classes.footerLinks}>
            <li><a href="/">Home</a></li>
            <li><a href="/menu">Menu</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="/contact">Contact</a></li>
            <li><a href="/gallery">Gallery</a></li>
            <li><a href="/careers">Careers</a></li>
          </ul>
        </div>

        <div className={classes.footerSection}>
          <h4>Our Menu</h4>
          <ul className={classes.footerLinks}>
            <li><a href="/menu/hot-coffee">Hot Coffee</a></li>
            <li><a href="/menu/cold-coffee">Cold Coffee</a></li>
            <li><a href="/menu/hot-tea">Hot Tea</a></li>
            <li><a href="/menu/cold-tea">Cold Tea</a></li>
            <li><a href="/menu/beverages">Bottled Beverages</a></li>
            <li><a href="/menu/specialty">Specialty Drinks</a></li>
          </ul>
        </div>

        <div className={classes.footerSection}>
          <h4>Contact Info</h4>
          <div className={classes.contactInfo}>
            <div className={classes.contactItem}>
              <FaMapMarkerAlt />
              <div>
                <p>123 Coffee Street</p>
                <p>Downtown District</p>
                <p>City, State 12345</p>
              </div>
            </div>
            <div className={classes.contactItem}>
              <FaPhone />
              <div>
                <p>+1 (555) 123-4567</p>
                <p>+1 (555) 987-6543</p>
              </div>
            </div>
            <div className={classes.contactItem}>
              <FaEnvelope />
              <div>
                <p>info@beantomug.com</p>
                <p>orders@beantomug.com</p>
              </div>
            </div>
          </div>
        </div>

        <div className={classes.footerSection}>
          <h4>Opening Hours</h4>
          <div className={classes.hours}>
            <div className={classes.hourItem}>
              <span>Monday - Friday</span>
              <span>6:00 AM - 10:00 PM</span>
            </div>
            <div className={classes.hourItem}>
              <span>Saturday</span>
              <span>7:00 AM - 11:00 PM</span>
            </div>
            <div className={classes.hourItem}>
              <span>Sunday</span>
              <span>7:00 AM - 9:00 PM</span>
            </div>
          </div>
          <div className={classes.holidayNote}>
            <FaClock />
            <p>Holiday hours may vary</p>
          </div>
        </div>
      </div>

      <div className={classes.footerBottom}>
        <div className={classes.footerBottomContent}>
          <p>&copy; {currentYear} Bean to Mug. All rights reserved.</p>
          <div className={classes.footerBottomLinks}>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/sitemap">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;