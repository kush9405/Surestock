"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sample organizations
  const organizations = [
    { 
      id: 'bishnu', 
      name: 'Bishnu Furniture', 
      logo: '🪑',
      database: 'BishnuFurniture',
      users: [
        { email: '9405', password: '9405', name: 'Admin User', role: 'Administrator' },

      ]
    }
  ];

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedOrg = localStorage.getItem('organization');
    
    if (savedUser && savedOrg) {
      try {
        setUser(JSON.parse(savedUser));
        setOrganization(JSON.parse(savedOrg));
      } catch (error) {
        console.error('Error parsing saved session:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('organization');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password, orgId) => {
    try {
      const org = organizations.find(o => o.id === orgId);
      if (!org) {
        throw new Error('Organization not found');
      }

      const user = org.users.find(u => u.email === email && u.password === password);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const userData = {
        id: Date.now(),
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: orgId
      };

      setUser(userData);
      setOrganization(org);
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('organization', JSON.stringify(org));
      
      setShowLoginModal(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setOrganization(null);
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
  };

  const switchOrganization = (orgId) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setOrganization(org);
      localStorage.setItem('organization', JSON.stringify(org));
    }
  };

  const value = {
    user,
    organization,
    organizations,
    login,
    logout,
    switchOrganization,
    showLoginModal,
    setShowLoginModal,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext }; 