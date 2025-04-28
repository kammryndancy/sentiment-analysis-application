import React from 'react';
import styles from './LandingPage.module.css';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => (
  <div className={styles['landing-root']}>
    <div className={styles['landing-card']}>
      <div className={styles['landing-title']}>Welcome to Sentiment Analysis Tool</div>
      <div className={styles['landing-desc']}>
        Effortlessly analyze and visualize sentiment in social media comments.<br />
        Filter product-related discussions and gain actionable insights for your brand.
      </div>
      <div className={styles['landing-actions']}>
        <Link className={styles['landing-btn']} to="/login">Login to Get Started</Link>
        <div className={styles['landing-link']} style={{ textDecoration: 'none', cursor: 'default' }}>
          Need an account? <Link className={styles['landing-link']} to="/register">Register</Link>
        </div>
      </div>
    </div>
  </div>
);

export default LandingPage;
