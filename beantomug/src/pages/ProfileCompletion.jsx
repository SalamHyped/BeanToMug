import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileCompletion from '../components/forms/ProfileCompletion';

const ProfileCompletionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user;

  const handleProfileComplete = (userData) => {
    console.log('Profile completed:', userData);
    // Navigate to home page or rating page
    navigate('/');
  };

  const handleProfileSkip = (userData) => {
    console.log('Profile skipped:', userData);
    // Navigate to home page or rating page
    navigate('/');
  };

  return (
    <ProfileCompletion
      onComplete={handleProfileComplete}
      onSkip={handleProfileSkip}
      user={user}
    />
  );
};

export default ProfileCompletionPage; 