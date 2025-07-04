import { useReducer, useCallback, useEffect } from 'react';
import { UserContext } from './UserContext';
import { userReducer, initialState } from './UserReducer';
import axios from 'axios';

export function UserProvider({ children }) {
  const [state, dispatch] = useReducer(userReducer, initialState);
console.log(state)
  // Add initial authentication check
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get('http://localhost:8801/auth/status', {
          withCredentials: true
        });
        
        if (response.data.authenticated && response.data.user) {
          dispatch({ type: 'SET_USER', payload: response.data.user });
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        dispatch({ type: 'LOGOUT' });
      }
    };

    checkAuthStatus();
  }, []);

  const setUser = useCallback((userData) => {
    dispatch({ type: 'SET_USER', payload: userData });
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post('http://localhost:8801/auth/logout', {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const updateUser = useCallback((userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  }, []);

  const value = {
    ...state,
    setUser,
    logout,
    updateUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
} 