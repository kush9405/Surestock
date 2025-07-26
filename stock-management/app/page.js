"use client";

import { useState, useEffect } from 'react';
import Header from "@/components/Header";

export default function Home() {
  const [productForm, setProductForm] = useState({ productName: '', sku: '', quantity: '', location: '' });
  const [stock, setStock] = useState([]); // Initial state is an empty array
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSku, setSelectedSku] = useState('');

  // --- DATA FETCHING ---
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/product');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
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
  }, []);

  // --- FORM HANDLING ---
  const handleChange = (e) => {
    setProductForm({ ...productForm, [e.target.name]: e.target.value });
  };

  const addProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm),
      });

      if (response.ok) {
        alert('Product added successfully!');
        setProductForm({ productName: '', sku: '', quantity: '', location: '' });
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

  // --- FILTERING LOGIC ---
  // **FIX 1: Defensive Rendering**
  // Use (stock || []) to ensure we always have an array to filter, even if 'stock' is temporarily null or undefined.
  const filteredStock = (stock || [])
    .filter(product =>
      product.productName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(product =>
      selectedSku ? product.sku === selectedSku : true
    );

  const uniqueSkus = [...new Set((stock || []).map(p => p.sku))];

  return (
    <>
      <Header />
      <div className="container mx-auto p-8 bg-gray-50 min-h-screen">
        {/* --- ADD PRODUCT FORM --- */}
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Add a Product</h1>
        <form onSubmit={addProduct} className="bg-white p-6 rounded-lg shadow-md mb-12 max-w-2xl">
          {/* Form fields... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label htmlFor="productName" className="block text-sm font-medium text-gray-700">Product Name</label><input name="productName" type="text" id="productName" value={productForm.productName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required /></div>
            <div><label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU</label><input type="text" name="sku" id="sku" value={productForm.sku} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required /></div>
            <div><label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label><input type="number" name='quantity' id="quantity" value={productForm.quantity} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" min="0" required /></div>
            <div><label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label><select name="location" id="location" value={productForm.location} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required><option value="">Select a location</option><option value="Warehouse">Warehouse</option><option value="Showroom">Showroom</option></select></div>
          </div>
          <div className="mt-6"><button type="submit" className="w-full md:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Add Product to Stock</button></div>
        </form>

        {/* --- CURRENT STOCK DISPLAY --- */}
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Current Stock</h1>
        
        {/* Controls... */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-grow w-full md:w-auto"><input type="text" placeholder="Search by product name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" /></div>
          <div className="w-full md:w-auto"><select value={selectedSku} onChange={(e) => setSelectedSku(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"><option value="">All SKUs</option>{uniqueSkus.map(sku => (<option key={sku} value={sku}>{sku}</option>))}</select></div>
        </div>
        
        {/* Table... */}
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-200">
              <tr>
                <th scope="col" className="py-3 px-6">Product Name</th>
                <th scope="col" className="py-3 px-6">SKU</th>
                <th scope="col" className="py-3 px-6">Quantity</th>
                <th scope="col" className="py-3 px-6">Location</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map((product) => (
                <tr key={product.sku} className="bg-white border-b hover:bg-gray-50">
                  <th scope="row" className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">{product.productName}</th>
                  <td className="py-4 px-6">{product.sku}</td>
                  <td className="py-4 px-6">{product.quantity}</td>
                  <td className="py-4 px-6">{product.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}