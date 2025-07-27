"use client";

import { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import Header from "@/components/Header";
import LoginModal from "@/components/LoginModal";
import { AuthContext } from "@/context/AuthContext";

export default function Home() {
  const { user, organization, loading, setShowLoginModal } = useContext(AuthContext);

  const [productForm, setProductForm] = useState({ productName: '', sku: '', quantity: '', location: '', color: '' });
  const [stock, setStock] = useState([]); // Initial state is an empty array
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSku, setSelectedSku] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [editingQuantity, setEditingQuantity] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modificationLog, setModificationLog] = useState([]);
  const [bulkQuantity, setBulkQuantity] = useState('');

  // --- DATA FETCHING ---
  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/product?orgId=${organization?.id || 'bishnu'}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      // console.log(type(data.products))
      // **FIX 2: Safer Data Handling**
      // Only update state if data.products is actually an array
      if (Array.isArray(data.products)) {
        setStock(data.products);
      } else {
        console.error("API did not return a products array:", data);
        setStock([]); // Fallback to an empty array
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setStock([]); // Also fallback to an empty array on network error
    }
  };
  
  useEffect(() => {
    fetchProducts();
    // Load modification logs from localStorage
    const savedLogs = localStorage.getItem('modificationLogs');
    if (savedLogs) {
      try {
        const logs = JSON.parse(savedLogs);
        setModificationLog(logs);
      } catch (error) {
        console.error('Error loading modification logs:', error);
      }
    }
  }, []);

  // --- FORM HANDLING ---
  const handleChange = useCallback((e) => {
    setProductForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const addProduct = async (e) => {
    e.preventDefault();
    
    // Check for duplicate entry
    const isDuplicate = stock.some(product => 
      product.productName.toLowerCase() === productForm.productName.toLowerCase() &&
      product.sku.toLowerCase() === productForm.sku.toLowerCase() &&
      product.location === productForm.location &&
      product.color === productForm.color
    );

    if (isDuplicate) {
      alert('A product with the same name, company, location, and color already exists!');
      return;
    }

    try {
      const response = await fetch('/api/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productForm,
          orgId: organization?.id || 'bishnu'
        }),
      });

      if (response.ok) {
        alert('Product added successfully!');
        setProductForm({ productName: '', sku: '', quantity: '', location: '', color: '' });
        fetchProducts(); // Re-fetch to update the table
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Could not add the product.'}`);
      }
    } catch (error) {
      alert('An error occurred while adding the product.');
      console.error('An error occurred:', error);
    }
  };

  // --- QUANTITY EDITING ---
  const updateQuantity = async (productId, newQuantity, change = 0) => {
    if (newQuantity < 0) {
      alert('Quantity cannot be negative!');
      return;
    }

    try {
      const response = await fetch(`/api/product/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          quantity: newQuantity,
          lastModified: new Date().toISOString(),
          modificationType: change > 0 ? 'increased' : change < 0 ? 'decreased' : 'updated'
        }),
      });

      if (response.ok) {
        // Update the selected product in real-time if modal is open
        if (selectedProduct && selectedProduct._id === productId) {
          setSelectedProduct(prev => ({
            ...prev,
            quantity: newQuantity,
            lastModified: new Date().toISOString()
          }));
        }
        
        // Update the stock array in real-time
        setStock(prevStock => 
          prevStock.map(product => 
            product._id === productId 
              ? { ...product, quantity: newQuantity, lastModified: new Date().toISOString() }
              : product
          )
        );
        
        // Add to modification log
        if (change !== 0) {
          const logEntry = {
            timestamp: new Date().toISOString(),
            action: change > 0 ? 'Quantity Increased' : 'Quantity Decreased',
            change: change > 0 ? `+${change}` : `${change}`,
            newQuantity: newQuantity,
            productId: productId,
            productName: selectedProduct?.productName || 'Unknown Product'
          };
          setModificationLog(prev => {
            const newLogs = [logEntry, ...prev.slice(0, 49)]; // Keep last 50 entries
            // Save to localStorage
            localStorage.setItem('modificationLogs', JSON.stringify(newLogs));
            return newLogs;
          });
        }
        
        setEditingQuantity({}); // Clear editing state
      } else {
        alert('Failed to update quantity');
      }
    } catch (error) {
      alert('An error occurred while updating quantity');
      console.error('Error updating quantity:', error);
    }
  };

  const handleQuantityChange = (productId, currentQuantity, change) => {
    const newQuantity = parseInt(currentQuantity) + change;
    updateQuantity(productId, newQuantity, change);
  };

  const handleBulkQuantityUpdate = (productId, newQuantity) => {
    if (newQuantity < 0) {
      alert('Quantity cannot be negative!');
      return;
    }
    
    const currentQuantity = selectedProduct.quantity;
    const change = newQuantity - currentQuantity;
    
    if (change === 0) {
      alert('New quantity is the same as current quantity!');
      return;
    }
    
    updateQuantity(productId, newQuantity, change);
    setBulkQuantity(''); // Clear the input after update
  };

  // --- DELETE FUNCTIONALITY ---
  const deleteProduct = async (productId) => {
    try {
      const response = await fetch(`/api/product/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Product deleted successfully!');
        fetchProducts(); // Re-fetch to update the table
        setDeleteConfirm(null); // Clear confirmation state
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      alert('An error occurred while deleting the product');
      console.error('Error deleting product:', error);
    }
  };

  const confirmDelete = (product) => {
    setDeleteConfirm(product);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // --- PRODUCT DETAILS MODAL ---
  const showProductDetails = (product) => {
    setSelectedProduct(product);
  };

  const closeProductDetails = () => {
    setSelectedProduct(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // --- FILTERING LOGIC ---
  // **FIX 1: Defensive Rendering**
  // Use (stock || []) to ensure we always have an array to filter, even if 'stock' is temporarily null or undefined.
  const filteredStock = useMemo(() => {
    return (stock || [])
      .filter(product =>
        product.productName.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .filter(product =>
        selectedSku ? product.sku === selectedSku : true
      )
      .filter(product =>
        selectedColor ? product.color === selectedColor : true
      );
  }, [stock, searchQuery, selectedSku, selectedColor]);

  const uniqueSkus = useMemo(() => [...new Set((stock || []).map(p => p.sku))], [stock]);
  const uniqueColors = useMemo(() => [...new Set((stock || []).map(p => p.color).filter(Boolean))], [stock]);

  // Color mapping for visual indicators
  const getColorClass = (colorName) => {
    const color = colorName.toLowerCase();
    const colorMap = {
      'red': 'bg-red-500',
      'blue': 'bg-blue-500',
      'green': 'bg-green-500',
      'yellow': 'bg-yellow-400',
      'orange': 'bg-orange-500',
      'purple': 'bg-purple-500',
      'pink': 'bg-pink-500',
      'brown': 'bg-amber-700',
      'black': 'bg-gray-900',
      'white': 'bg-gray-100',
      'gray': 'bg-gray-500',
      'grey': 'bg-gray-500',
      'cyan': 'bg-cyan-500',
      'teal': 'bg-teal-500',
      'indigo': 'bg-indigo-500',
      'lime': 'bg-lime-500',
      'emerald': 'bg-emerald-500',
      'violet': 'bg-violet-500',
      'fuchsia': 'bg-fuchsia-500',
      'rose': 'bg-rose-500',
      'amber': 'bg-amber-500',
      'sky': 'bg-sky-500',
      'slate': 'bg-slate-500',
      'zinc': 'bg-zinc-500',
      'neutral': 'bg-neutral-500',
      'stone': 'bg-stone-500',
      'red-500': 'bg-red-500',
      'blue-500': 'bg-blue-500',
      'green-500': 'bg-green-500',
      'yellow-400': 'bg-yellow-400',
      'orange-500': 'bg-orange-500',
      'purple-500': 'bg-purple-500',
      'pink-500': 'bg-pink-500',
      'brown-700': 'bg-amber-700',
      'black-900': 'bg-gray-900',
      'white-100': 'bg-gray-100',
      'gray-500': 'bg-gray-500',
      'grey-500': 'bg-gray-500',
      'cyan-500': 'bg-cyan-500',
      'teal-500': 'bg-teal-500',
      'indigo-500': 'bg-indigo-500',
      'lime-500': 'bg-lime-500',
      'emerald-500': 'bg-emerald-500',
      'violet-500': 'bg-violet-500',
      'fuchsia-500': 'bg-fuchsia-500',
      'rose-500': 'bg-rose-500',
      'amber-500': 'bg-amber-500',
      'sky-500': 'bg-sky-500',
      'slate-500': 'bg-slate-500',
      'zinc-500': 'bg-zinc-500',
      'neutral-500': 'bg-neutral-500',
      'stone-500': 'bg-stone-500'
    };
    return colorMap[color] || 'bg-gray-400'; // Default gray for unknown colors
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-16 h-16 text-indigo-500 mx-auto mb-4" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Management System</h1>
            <p className="text-gray-600">Please sign in to access your organization's inventory</p>
          </div>
          <button
            onClick={() => setShowLoginModal(true)}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign In
          </button>
        </div>
        <LoginModal />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 bg-gray-50 min-h-screen">
        {/* --- ADD PRODUCT FORM --- */}
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">Add a Product</h1>
        <form onSubmit={addProduct} className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-8 sm:mb-12 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="sm:col-span-2">
              <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input 
                name="productName" 
                type="text" 
                id="productName" 
                value={productForm.productName} 
                onChange={handleChange} 
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" 
                required 
              />
            </div>
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input 
                type="text" 
                name="sku" 
                id="sku" 
                value={productForm.sku} 
                onChange={handleChange} 
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" 
                required 
              />
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input 
                type="number" 
                name='quantity' 
                id="quantity" 
                value={productForm.quantity} 
                onChange={handleChange} 
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" 
                min="0" 
                required 
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select 
                name="location" 
                id="location" 
                value={productForm.location} 
                onChange={handleChange} 
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" 
                required
              >
                <option value="">Select a location</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Showroom">Showroom</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input 
                type="text" 
                name="color" 
                id="color" 
                value={productForm.color} 
                onChange={handleChange} 
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" 
                placeholder="e.g., Red, Blue, Brown" 
              />
            </div>
          </div>
          <div className="mt-6">
            <button 
              type="submit" 
              className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Add Product to Stock
            </button>
          </div>
        </form>

        {/* --- CURRENT STOCK DISPLAY --- */}
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">Current Stock</h1>
        
        {/* Controls... */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:gap-4 sm:items-center">
          <div className="flex-1">
            <input 
              type="text" 
              placeholder="Search by product name..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" 
            />
          </div>
          <div className="w-full sm:w-auto">
            <select 
              value={selectedSku} 
              onChange={(e) => setSelectedSku(e.target.value)} 
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            >
              <option value="">All Companies</option>
              {uniqueSkus.map(sku => (
                <option key={sku} value={sku}>{sku}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <select 
              value={selectedColor} 
              onChange={(e) => setSelectedColor(e.target.value)} 
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            >
              <option value="">All Colors</option>
              {uniqueColors.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Table... */}
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-200">
              <tr>
                <th scope="col" className="py-3 px-3 sm:px-6">Product Name</th>
                <th scope="col" className="py-3 px-3 sm:px-6 hidden sm:table-cell">Company</th>
                <th scope="col" className="py-3 px-3 sm:px-6">Quantity</th>
                <th scope="col" className="py-3 px-3 sm:px-6 hidden md:table-cell">Location</th>
                <th scope="col" className="py-3 px-3 sm:px-6 hidden lg:table-cell">Color</th>
                <th scope="col" className="py-3 px-3 sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map((product, index) => (
                <tr 
                  key={(product._id || product.sku) + '-' + index} 
                  className="bg-white border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => showProductDetails(product)}
                >
                  <th scope="row" className="py-4 px-3 sm:px-6 font-medium text-gray-900">
                    <div>
                      <div className="font-medium">{product.productName}</div>
                      <div className="text-xs text-gray-500 sm:hidden">{product.sku}</div>
                    </div>
                  </th>
                  <td className="py-4 px-3 sm:px-6 hidden sm:table-cell">{product.sku}</td>
                  <td className="py-4 px-3 sm:px-6 text-center">
                    <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                      <span className="font-medium text-sm sm:text-base">{product.quantity}</span>
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuantityChange(product._id, product.quantity, -1);
                          }}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500 text-white text-xs font-bold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                          title="Decrease quantity"
                        >
                          -
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuantityChange(product._id, product.quantity, 1);
                          }}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-500 text-white text-xs font-bold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3 sm:px-6 hidden md:table-cell">{product.location}</td>
                  <td className="py-4 px-3 sm:px-6 hidden lg:table-cell">
                    {product.color && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <span className={`w-3 h-3 rounded-full ${getColorClass(product.color)} mr-1 border border-gray-300`}></span>
                        {product.color}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-3 sm:px-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(product);
                      }}
                      className="text-red-600 hover:text-red-900 font-medium text-xs sm:text-sm transition-colors"
                      title="Delete product"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 sm:top-20 mx-auto p-4 sm:p-5 border w-11/12 sm:w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete "{deleteConfirm.productName}" from {deleteConfirm.sku}?
                  This action cannot be undone.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => deleteProduct(deleteConfirm._id)}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Details Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-2 sm:top-5 mx-auto p-4 sm:p-6 border w-11/12 sm:w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Product Details</h3>
                <button
                  onClick={closeProductDetails}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Basic Information</h4>
                  <div className="space-y-2">
                    <div><span className="font-medium">Product Name:</span> {selectedProduct.productName}</div>
                    <div><span className="font-medium">Company:</span> {selectedProduct.sku}</div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Quantity:</span>
                      <span className="text-lg font-bold text-blue-600">{selectedProduct.quantity}</span>
                      <span className="ml-2 text-xs text-gray-500">(Live)</span>
                    </div>
                    <div><span className="font-medium">Location:</span> {selectedProduct.location}</div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Color:</span>
                      {selectedProduct.color && (
                        <>
                          <span className={`w-4 h-4 rounded-full ${getColorClass(selectedProduct.color)} mr-2 border border-gray-300`}></span>
                          {selectedProduct.color}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Timestamps</h4>
                  <div className="space-y-2">
                    <div><span className="font-medium">Created:</span> {formatDate(selectedProduct.createdAt || selectedProduct._id)}</div>
                    <div><span className="font-medium">Last Modified:</span> {formatDate(selectedProduct.lastModified || selectedProduct.updatedAt || selectedProduct._id)}</div>
                  </div>
                  
                  <h4 className="font-semibold text-gray-700 mb-2 mt-4">Product ID</h4>
                  <div className="text-sm text-gray-500 font-mono bg-gray-100 p-2 rounded">
                    {selectedProduct._id}
                  </div>
                </div>
              </div>
              
              <div className="mb-6 pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-3">Quantity Management</h4>
                
                {/* Quick Actions */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-600 mb-2">Quick Adjustments</h5>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={() => handleQuantityChange(selectedProduct._id, selectedProduct.quantity, 1)}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                    >
                      +1 Quantity
                    </button>
                    <button
                      onClick={() => handleQuantityChange(selectedProduct._id, selectedProduct.quantity, -1)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    >
                      -1 Quantity
                    </button>
                  </div>
                </div>

                {/* Bulk Quantity Update */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-600 mb-2">Bulk Quantity Update</h5>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={bulkQuantity}
                        onChange={(e) => setBulkQuantity(e.target.value)}
                        placeholder={`Current: ${selectedProduct.quantity}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        min="0"
                      />
                    </div>
                    <button
                      onClick={() => handleBulkQuantityUpdate(selectedProduct._id, parseInt(bulkQuantity))}
                      disabled={!bulkQuantity || bulkQuantity === ''}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      Update
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the exact quantity you want to set (not the change amount)
                  </p>
                </div>

                {/* Delete Action */}
                <div className="pt-3 border-t border-gray-200">
                  <button
                    onClick={() => {
                      confirmDelete(selectedProduct);
                      closeProductDetails();
                    }}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Delete Product
                  </button>
                </div>
              </div>

              {/* Real-time Stock Summary */}
              <div className="pt-4 border-t border-gray-200 mb-4">
                <h4 className="font-semibold text-gray-700 mb-3">Real-time Stock Summary</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Total Products</div>
                    <div className="text-2xl font-bold text-blue-800">{stock.length}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm text-green-600 font-medium">Total Quantity</div>
                    <div className="text-2xl font-bold text-green-800">
                      {stock.reduce((sum, product) => sum + (parseInt(product.quantity) || 0), 0)}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-sm text-purple-600 font-medium">Warehouse</div>
                    <div className="text-2xl font-bold text-purple-800">
                      {stock.filter(p => p.location === 'Warehouse').reduce((sum, product) => sum + (parseInt(product.quantity) || 0), 0)}
                    </div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-sm text-orange-600 font-medium">Showroom</div>
                    <div className="text-2xl font-bold text-orange-800">
                      {stock.filter(p => p.location === 'Showroom').reduce((sum, product) => sum + (parseInt(product.quantity) || 0), 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modification Log */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-3">Modification History (Last 30 Days)</h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {modificationLog.filter(log => {
                    const logDate = new Date(log.timestamp);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return logDate >= thirtyDaysAgo && log.productId === selectedProduct._id;
                  }).length > 0 ? (
                    <div className="space-y-2">
                      {modificationLog
                        .filter(log => {
                          const logDate = new Date(log.timestamp);
                          const thirtyDaysAgo = new Date();
                          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                          return logDate >= thirtyDaysAgo && log.productId === selectedProduct._id;
                        })
                        .map((log, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                            <div className="flex items-center space-x-3">
                              <span className={`w-2 h-2 rounded-full ${log.change.startsWith('+') ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              <span className="text-sm font-medium">{log.action}</span>
                              <span className={`text-sm font-bold ${log.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                                {log.change}
                              </span>
                              <span className="text-xs text-gray-500">→ {log.newQuantity}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(log.timestamp)}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No modifications in the last 30 days
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        <LoginModal />
      </div>
    </>
  );
}