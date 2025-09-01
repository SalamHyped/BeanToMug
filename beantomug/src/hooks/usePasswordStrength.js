import { useState, useCallback } from 'react';

export default function usePasswordStrength() {
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: ''
  });

  const calculatePasswordStrength = useCallback((password) => {
    if (!password) {
      setPasswordStrength({ score: 0, label: '' });
      return;
    }
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    let label = '';
    if (score === 0) label = 'Very Weak';
    else if (score <= 2) label = 'Weak';
    else if (score <= 3) label = 'Medium';
    else if (score <= 4) label = 'Strong';
    else label = 'Very Strong';
    
    setPasswordStrength({ score, label });
  }, []);

  return { passwordStrength, calculatePasswordStrength };
}

