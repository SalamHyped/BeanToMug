import { useState, useEffect, useMemo, useCallback } from 'react';

export const useUserFilters = (users) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      // Search is handled in the filteredUsers memo
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Memoized filtered users for better performance
  const filteredUsers = useMemo(() => {
    let filtered = [...users];
    
    // Filter by search term (username, email, first_name, last_name, phone_number)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.first_name && user.first_name.toLowerCase().includes(searchLower)) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchLower)) ||
        (user.phone_number && user.phone_number.toString().includes(searchLower))
      );
    }
    
    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    return filtered;
  }, [users, searchTerm, roleFilter]);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleRoleChange = useCallback((e) => {
    setRoleFilter(e.target.value);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setRoleFilter('all');
  }, []);

  return {
    searchTerm,
    roleFilter,
    filteredUsers,
    handleSearchChange,
    handleRoleChange,
    clearFilters
  };
};
