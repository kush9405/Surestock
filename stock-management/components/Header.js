import React, { useState, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

const Header = () => {
  const { user, organization, logout, showLoginModal, setShowLoginModal } = useContext(AuthContext);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  const organizations = [
    { id: 'bishnu', name: 'Bishnu Furniture', logo: '🪑' },
    { id: 'surestock', name: 'SureStock Solutions', logo: '📦' },
    { id: 'inventory', name: 'Inventory Pro', logo: '🏢' }
  ];

  return (
    <header className="text-gray-600 body-font bg-white shadow-sm border-b">
      <div className="container mx-auto flex flex-wrap p-4 flex-col md:flex-row items-center justify-between">
        <div className="flex items-center">
          <a className="flex title-font font-medium items-center text-gray-900 mb-4 md:mb-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-10 h-10 text-white p-2 bg-indigo-500 rounded-full" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <div className="ml-3">
              <div className="text-xl font-bold text-gray-900">
                {organization ? organization.name : 'Stock Management System'}
              </div>
              <div className="text-xs text-gray-500">
                {organization ? 'Inventory Management Platform' : 'Select Organization'}
              </div>
            </div>
          </a>
        </div>

        <div className="flex items-center space-x-4">
          {/* Organization Selector */}
          <div className="relative">
            <button
              onClick={() => setShowOrgDropdown(!showOrgDropdown)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <span className="text-lg">{organization?.logo || '🏢'}</span>
              <span className="hidden sm:inline">{organization?.name || 'Select Org'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showOrgDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 border">
                <div className="py-1">
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => {
                        // Handle organization selection
                        setShowOrgDropdown(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <span className="text-lg mr-3">{org.logo}</span>
                      <span>{org.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Authentication */}
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">{user.role}</div>
              </div>
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
