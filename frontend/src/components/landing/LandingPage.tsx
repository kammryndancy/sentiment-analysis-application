import React from 'react';
import './LandingPage.css';
import '../../App.css';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => (
  <div className="landing-root">
    <div className="landing-card">
      <div className="landing-title">Welcome to Tonique</div>
      <div className="landing-desc">
        Effortlessly analyze and visualize sentiment in social media comments.<br />
        Filter product-related discussions and gain actionable insights for your brand.
      </div>
      <div className="landing-actions">
        <button className="landing-btn" onClick={() => window.location.href = '/login'}>Login to Get Started</button>
        <div className="landing-link" style={{ textDecoration: 'none', cursor: 'default' }}>
          Need an account? <Link className="landing-link" to="/register">Register</Link>
        </div>
      </div>
    </div>
  </div>
);

export default LandingPage;
