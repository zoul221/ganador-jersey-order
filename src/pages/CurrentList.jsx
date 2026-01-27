import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Download, Trash2, Lock, Unlock, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const GOOGLE_SHEETS_URL = import.meta.env.VITE_GOOGLE_SHEETS_URL;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const ITEMS_PER_PAGE = 10;

export default function CurrentList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const handlePasswordSubmit = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setShowPasswordModal(false);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
      setPasswordInput('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(GOOGLE_SHEETS_URL + '?action=GET');
      const data = await response.json();
      
      if (data.orders) {
        // Reverse to show newest first
        setOrders(data.orders.reverse());
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      alert('Failed to fetch orders. Make sure your Google Apps Script is set up to handle GET requests.');
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId, orderName) => {
    if (!isAuthenticated) {
      setShowPasswordModal(true);
      return;
    }

    if (!confirm(`Are you sure you want to delete the order for ${orderName}?`)) {
      return;
    }

    try {
      setDeleting(orderId);
      
      await fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          id: orderId
        })
      });

      // Remove from local state immediately for better UX
      setOrders(orders.filter(order => order.id !== orderId));
      
      // Refresh from server to confirm
      setTimeout(() => {
        fetchOrders();
      }, 1000);
      
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const togglePaid = async (order) => {
    if (!isAuthenticated) {
      setShowPasswordModal(true);
      return;
    }

    try {
      setUpdating(order.id);
      const updatedOrder = {
        ...order,
        paid: order.paid === 'Yes' ? 'No' : 'Yes'
      };

      await fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedOrder)
      });

      // Update local state
      setOrders(orders.map(o => 
        o.id === order.id ? updatedOrder : o
      ));

    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const calculatePrice = (order) => {
    let price = order.size?.includes('yr') ? 38 : 50;
    if (order.isLongSleeve === true) price += 5;
    if (order.isMuslimah === true) price += 10;
    if (['4XL', '5XL', '6XL'].includes(order.size)) price += 5;
    if (['7XL', '8XL'].includes(order.size)) price += 10;
    return price;
  };

  // Filter orders by search query
  const filteredOrders = useMemo(() => {
    return orders.filter(order =>
      order.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [orders, searchQuery]);

  // Paginate filtered orders
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => o.paid === 'Yes').length;
  const pendingOrders = totalOrders - paidOrders;
  const totalAmount = orders.reduce((sum, o) => sum + (o.price || calculatePrice(o)), 0);

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Update Loading Modal */}
      {updating && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl p-8 flex flex-col items-center gap-4">
            <RefreshCw size={48} className="animate-spin text-indigo-600" />
            <div className="text-center">
              <p className="font-semibold text-gray-900">Updating Order...</p>
              <p className="text-sm text-gray-600 mt-1">Sending update to Google Sheets</p>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={24} className="text-indigo-600" />
              <h3 className="font-bold text-xl text-gray-900">Admin Access Required</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Enter the password to mark orders as paid.</p>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError('');
              }}
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              placeholder="Enter password"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
              autoFocus
            />
            {passwordError && (
              <p className="text-red-600 text-sm mb-4 font-medium">{passwordError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordInput('');
                  setPasswordError('');
                }}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mt-6">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-start">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-indigo-900">Current Orders</h1>
              {lastUpdated && (
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-amber-600 text-white px-3 md:px-4 py-2 rounded-md hover:bg-amber-700 transition-colors text-xs md:text-sm"
                >
                  <Unlock size={16} />
                  Logout
                </button>
              )}
              <button
                onClick={fetchOrders}
                disabled={loading}
                className="flex items-center gap-2 bg-indigo-600 text-white px-3 md:px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-xs md:text-sm disabled:bg-gray-400"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>

        {loading && orders.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw size={48} className="animate-spin mx-auto text-indigo-600 mb-4" />
            <p className="text-gray-600">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No orders yet. Be the first to order!</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs md:text-sm">
                <div>
                  <span className="font-semibold">Total Orders:</span>
                  <p className="text-lg font-bold text-indigo-600">{totalOrders}</p>
                </div>
                <div>
                  <span className="font-semibold">Paid:</span>
                  <p className="text-lg font-bold text-green-600">{paidOrders}</p>
                </div>
                <div>
                  <span className="font-semibold">Pending:</span>
                  <p className="text-lg font-bold text-orange-600">{pendingOrders}</p>
                </div>
                { isAuthenticated ? (
                <div className="col-span-2 sm:col-span-1">
                  <span className="font-semibold">Total Amount:</span>
                  <p className="text-lg font-bold text-purple-600">RM {totalAmount}</p>
                </div> ) : (<div className="col-span-2 sm:col-span-1"></div>) }
              </div>
              {searchQuery && (
                <p className="mt-4 text-xs md:text-sm text-gray-600">
                  Showing {paginatedOrders.length} of {filteredOrders.length} matching orders
                </p>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jersey Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Options</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fulfillment</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedOrders.map((order, index) => {
                    const displayIndex = filteredOrders.length - ((currentPage - 1) * ITEMS_PER_PAGE + index);
                    return (
                      <tr key={order.id || index} className={order.paid === 'Yes' ? 'bg-green-50' : ''}>
                        <td className="px-4 py-3 text-sm">{displayIndex}</td>
                        <td className="px-4 py-3 text-sm font-medium">{order.name}</td>
                        <td className="px-4 py-3 text-sm">{order.number || '-'}</td>
                        <td className="px-4 py-3 text-sm">{order.size}</td>
                        <td className="px-4 py-3 text-sm">{order.nameOnJersey || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          {(order.isMuslimah === true || order.isMuslimah === 'Yes') && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs mr-1">
                              Muslimah
                            </span>
                          )}
                          {(order.isLongSleeve === true || order.isLongSleeve === 'Yes') && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              Long Sleeve
                            </span>
                          )}
                          {(order.isMuslimah !== true && order.isMuslimah !== 'Yes') && (order.isLongSleeve !== true && order.isLongSleeve !== 'Yes') && '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {order.fulfillment === 'delivery' ? (
                            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded text-xs font-semibold">🚚 Delivery</span>
                          ) : (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-xs font-semibold">🏪 Pickup</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          RM {order.price || calculatePrice(order)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => togglePaid(order)}
                            disabled={updating === order.id}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                              order.paid === 'Yes'
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : isAuthenticated && updating !== order.id ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            } ${updating === order.id ? 'opacity-50' : ''}`}
                          >
                            {!isAuthenticated && <Lock size={14} />}
                            {updating === order.id ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              order.paid === 'Yes' ? '✅ Paid' : 'Mark Paid'
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => deleteOrder(order.id, order.name)}
                            disabled={deleting === order.id}
                            className={`transition-colors ${
                              deleting === order.id 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : isAuthenticated 
                                  ? 'text-red-600 hover:text-red-800 cursor-pointer' 
                                  : 'text-yellow-600 hover:text-yellow-800 cursor-pointer'
                            }`}
                            title={isAuthenticated ? "Delete order" : "Login required to delete"}
                          >
                            {deleting === order.id ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : !isAuthenticated ? (
                              <Lock size={16} />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-2">
              {paginatedOrders.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-600">No matching orders found.</p>
                </div>
              ) : (
                paginatedOrders.map((order, index) => {
                  const displayIndex = filteredOrders.length - ((currentPage - 1) * ITEMS_PER_PAGE + index);
                  return (
                    <div
                      key={order.id || index}
                      className={`border rounded p-3 text-xs ${order.paid === 'Yes' ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-white'}`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">{order.name}</h3>
                          <p className="text-gray-500">#{displayIndex}</p>
                        </div>
                        <button
                          onClick={() => deleteOrder(order.id, order.name)}
                          disabled={deleting === order.id}
                          className={`flex-shrink-0 transition-colors ${
                            deleting === order.id 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : isAuthenticated 
                                ? 'text-red-600 hover:text-red-800 cursor-pointer' 
                                : 'text-yellow-600 hover:text-yellow-800 cursor-pointer'
                          }`}
                          title={isAuthenticated ? "Delete order" : "Login required to delete"}
                        >
                          {deleting === order.id ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : !isAuthenticated ? (
                            <Lock size={14} />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>

                      <div className="space-y-1 mb-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500">Number:</span>
                            <p className="font-medium">{order.number || '-'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Size:</span>
                            <p className="font-medium">{order.size}</p>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Jersey:</span>
                          <p className="font-medium truncate">{order.nameOnJersey || '-'}</p>
                        </div>
                      </div>

                      {((order.isMuslimah === true || order.isMuslimah === 'Yes') || (order.isLongSleeve === true || order.isLongSleeve === 'Yes')) && (
                        <div className="py-1 border-t border-gray-200 mb-2">
                          <div className="flex flex-wrap gap-1">
                            {(order.isMuslimah === true || order.isMuslimah === 'Yes') && (
                              <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-xs">
                                Muslimah
                              </span>
                            )}
                            {(order.isLongSleeve === true || order.isLongSleeve === 'Yes') && (
                              <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs">
                                Long Sleeve
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="py-1 border-t border-gray-200 mb-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">
                            {order.fulfillment === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
                          </span>
                          <span className="font-bold text-indigo-600">RM {order.price || calculatePrice(order)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => togglePaid(order)}
                        disabled={updating === order.id}
                        className={`w-full py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                          order.paid === 'Yes'
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : isAuthenticated && updating !== order.id ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        } ${updating === order.id ? 'opacity-50' : ''}`}
                      >
                        {updating === order.id ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          order.paid === 'Yes' ? '✅ Paid' : 'Mark Paid'
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-1 md:gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors text-xs md:text-sm"
                >
                  <ChevronLeft size={14} />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                <div className="flex items-center gap-0.5 md:gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-1.5 md:px-2 py-1 rounded text-xs md:text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  {totalPages > 5 && <span className="text-gray-500 text-xs px-1">...</span>}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors text-xs md:text-sm"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-900 mb-2">Important Dates:</h3>
        <div className="text-xs md:text-sm text-amber-800 space-y-1">
          <p>📅 <strong>Cut-off Date:</strong> 31st January 2026</p>
          <p>💰 <strong>Payment Deadline:</strong> 5th February 2026</p>
        </div>
      </div>
    </div>
  );
}