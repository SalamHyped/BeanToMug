import { useState, useCallback, useEffect } from 'react';
import classes from './LogInForm.module.css';
import axios from 'axios';

export default function LoginForm({ onLoginSuccess, onSignupSuccess }) {
    const [signIn, toggle] = useState(true);
    const [loginFormData, setLoginFormData] = useState({
        username: "",
        password: "",
    });
    
    const [signupFormData, setSignupFormData] = useState({
        username: "",
        password: "",
        confirmPassword: "",
        email: "",
    });
    
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        label: ''
    });
      
    const [loginErrors, setLoginErrors] = useState({
        username: "",
        password: "",
    });
    
    const [signupErrors, setSignupErrors] = useState({
        username: "",
        password: "",
        confirmPassword: "",
        email: "",
        general: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Auto-clear errors after a delay
    useEffect(() => {
        if (Object.values(loginErrors).some(error => error) || 
            Object.values(signupErrors).some(error => error)) {
            const timer = setTimeout(() => {
                setLoginErrors({username: "", password: ""});
                setSignupErrors({username: "", password: "", confirmPassword: "", email: "", general: ""});
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [loginErrors, signupErrors]);

    // Login Form Handlers
    function handleLoginSubmit(event) {
        event.preventDefault();
        const newErrors = validateLoginForm(loginFormData);
      
        if (Object.keys(newErrors).length > 0) {
            setLoginErrors(newErrors);
            return;
        }
      
        console.log("Login attempt with:", loginFormData);
        
        if (onLoginSuccess) {
            setIsSubmitting(true);
            onLoginSuccess(loginFormData)
                .catch(err => console.error("Login error:", err))
                .finally(() => setIsSubmitting(false));
        }
    }
      
    function handleLoginChange(event) {
        const { name, value } = event.target;
        const updatedForm = { ...loginFormData, [name]: value };
        setLoginFormData(updatedForm);
      
        const newErrors = validateLoginForm(updatedForm);
        setLoginErrors(prevErrors => ({
            ...prevErrors,
            [name]: newErrors[name] || ""
        }));
    }

    function validateLoginForm(formData) {
        const newErrors = {};
      
        if (!formData.username) {
            newErrors.username = "Username is required";
        }
      
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }
      
        return newErrors;
    }
    
    // Signup Form Handlers
    function handleSignupSubmit(event) {
        event.preventDefault();
        const newErrors = validateSignupForm(signupFormData);
      
        if (Object.keys(newErrors).length > 0) {
            setSignupErrors(newErrors);
            return;
        }
        
        console.log("Signup attempt with:", signupFormData);
        
        // Handle signup submission
        setIsSubmitting(true);
        
        axios.post('http://localhost:8801/auth/signup', {
            username: signupFormData.username,
            password: signupFormData.password,
            email: signupFormData.email 
        }, {
            withCredentials: true
        })
        .then(response => {
            console.log("Signup successful:", response.data);
            if (onSignupSuccess) {
                onSignupSuccess({
                    ...response.data.user,
                    email: signupFormData.email
                });
            }
            
            // Reset form
            setSignupFormData({
                username: "",
                password: "",
                confirmPassword: "",
                email: ""
            });
            
            setSignupErrors({
                username: "",
                password: "",
                confirmPassword: "",
                email: "",
                general: ""
            });
            
            // Switch to login view after a brief delay
            setTimeout(() => {
                toggle(true);
            }, 1500);
        })
        .catch(error => {
            console.error("Signup error:", error);
            
            // Set form errors based on API response
            if (error.response && error.response.data) {
                const errorMessage = error.response.data.message;
                
                if (error.response.status === 409) {
                    // Handle conflict errors (username or email already exists)
                    if (errorMessage.includes('Username')) {
                        setSignupErrors(prev => ({
                            ...prev,
                            username: "Username already exists"
                        }));
                    } else if (errorMessage.includes('Email')) {
                        setSignupErrors(prev => ({
                            ...prev,
                            email: "Email already in use"
                        }));
                    } else {
                        setSignupErrors(prev => ({
                            ...prev,
                            general: errorMessage || "Signup failed. Please try again."
                        }));
                    }
                } else if (error.response.status === 400) {
                    // Handle validation errors
                    setSignupErrors(prev => ({
                        ...prev,
                        general: errorMessage || "Please check your information and try again."
                    }));
                } else {
                    // Handle other errors
                    setSignupErrors(prev => ({
                        ...prev,
                        general: errorMessage || "Signup failed. Please try again."
                    }));
                }
            } else {
                setSignupErrors(prev => ({
                    ...prev,
                    general: "Signup failed. Please try again."
                }));
            }
        })
        .finally(() => {
            setIsSubmitting(false);
        });
    }
    
    function handleSignupChange(event) {
        const { name, value } = event.target;
        const updatedForm = { ...signupFormData, [name]: value };
        setSignupFormData(updatedForm);
        
        // Calculate password strength when password field changes
        if (name === 'password') {
            calculatePasswordStrength(value);
        }
        
        const newErrors = validateSignupForm(updatedForm);
        setSignupErrors(prevErrors => ({
            ...prevErrors,
            [name]: newErrors[name] || ""
        }));
    }
    
    function validateSignupForm(formData) {
        const newErrors = {};
        
        // Validate username
        if (!formData.username) {
            newErrors.username = "Username is required";
        } else if (formData.username.length < 4) {
            newErrors.username = "Username must be at least 4 characters";
        }
        
        // Validate password
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }
        
        // Validate confirm password
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }
        
        // Validate email (optional)
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }
        
        return newErrors;
    }
    
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
      
    return (
        <div className={classes.container}>
            <div className={`${classes.SignInContainer} ${!signIn ? classes.active : ''}`}>
                <form onSubmit={handleLoginSubmit}>
                    <h2>Login</h2>
                    
                    <div className={classes.formGroup}>
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={loginFormData.username}
                            onChange={handleLoginChange}
                            placeholder="Enter your username"
                            disabled={isSubmitting}
                        />
                        {loginErrors.username && <span className={classes.error}>{loginErrors.username}</span>}
                    </div>
                    
                    <div className={classes.formGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={loginFormData.password}
                            onChange={handleLoginChange}
                            placeholder="Enter your password"
                            disabled={isSubmitting}
                        />
                        {loginErrors.password && <span className={classes.error}>{loginErrors.password}</span>}
                    </div>

                    <button type="submit" className={classes.submitButton} disabled={isSubmitting}>
                        {isSubmitting ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>

            <div className={`${classes.SignUpContainer} ${!signIn ? classes.active : ''}`}>
                <form onSubmit={handleSignupSubmit}>
                    <h2>Create Account</h2>
                    
                    {signupErrors.general && (
                        <div className={classes.generalError}>{signupErrors.general}</div>
                    )}
                    
                    <div className={classes.formGroup}>
                        <label htmlFor="signup-username">Username</label>
                        <input
                            type="text"
                            id="signup-username"
                            name="username"
                            value={signupFormData.username}
                            onChange={handleSignupChange}
                            placeholder="Choose a username"
                            disabled={isSubmitting}
                        />
                        {signupErrors.username && <span className={classes.error}>{signupErrors.username}</span>}
                    </div>
                    
                    <div className={classes.formGroup}>
                        <label htmlFor="signup-email">Email (optional)</label>
                        <input
                            type="email"
                            id="signup-email"
                            name="email"
                            value={signupFormData.email}
                            onChange={handleSignupChange}
                            placeholder="Enter your email"
                            disabled={isSubmitting}
                        />
                        {signupErrors.email && <span className={classes.error}>{signupErrors.email}</span>}
                    </div>
                    
                    <div className={classes.formGroup}>
                        <label htmlFor="signup-password">Password</label>
                        <input
                            type="password"
                            id="signup-password"
                            name="password"
                            value={signupFormData.password}
                            onChange={handleSignupChange}
                            placeholder="Create a password"
                            disabled={isSubmitting}
                        />
                        {signupErrors.password && <span className={classes.error}>{signupErrors.password}</span>}
                        
                        {signupFormData.password && (
                            <div className={classes.passwordStrength}>
                                <div className={classes.strengthBar}>
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <div 
                                            key={index} 
                                            className={`${classes.strengthSegment} ${
                                                index < passwordStrength.score 
                                                    ? classes[`strength${passwordStrength.score}`]
                                                    : ''
                                            }`}
                                        />
                                    ))}
                                </div>
                                {passwordStrength.label && (
                                    <span className={classes.strengthLabel}>
                                        {passwordStrength.label}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className={classes.formGroup}>
                        <label htmlFor="signup-confirm-password">Confirm Password</label>
                        <input
                            type="password"
                            id="signup-confirm-password"
                            name="confirmPassword"
                            value={signupFormData.confirmPassword}
                            onChange={handleSignupChange}
                            placeholder="Confirm your password"
                            disabled={isSubmitting}
                        />
                        {signupErrors.confirmPassword && <span className={classes.error}>{signupErrors.confirmPassword}</span>}
                    </div>

                    <button type="submit" className={classes.submitButton} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>
            </div>

            <div className={`${classes.OverlayContainer} ${!signIn ? classes.active : ''}`}>
                <div className={`${classes.Overlay} ${!signIn ? classes.active : ''}`}>
                    <div className={classes.OverlayPanel}>
                        {signIn ? (
                            <div className={classes.RightOverlayPanel}>
                                <h2>Hello, Friend!</h2>
                                <p>
                                    Enter your personal details and start your journey with us
                                </p>
                                <button type="button" className={classes.GhostButton} onClick={() => toggle(false)}>
                                    Sign Up
                                </button>
                            </div>
                        ) : (
                            <div className={classes.LeftOverlayPanel}>
                                <h2>Welcome Back!</h2>
                                <p>
                                    To keep connected with us please login with your personal info
                                </p>
                                <button type="button" className={classes.GhostButton} onClick={() => toggle(true)}>
                                    Sign In
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}