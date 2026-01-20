import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, Trash2, Lock, Unlock } from 'lucide-react';

const GOOGLE_SHEETS_URL = import.meta.env.VITE_GOOGLE_SHEETS_URL;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

export default function CurrentList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

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
        setOrders(data.orders);
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
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const calculatePrice = (order) => {
    let price = order.size?.includes('yr') ? 38 : 50;
    if (order.isLongSleeve === 'Yes') price += 5;
    if (order.isMuslimah === 'Yes') price += 10;
    if (['4XL', '5XL', '6XL'].includes(order.size)) price += 5;
    if (['7XL', '8XL'].includes(order.size)) price += 10;
    return price;
  };

  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => o.paid === 'Yes').length;
  const pendingOrders = totalOrders - paidOrders;
  const totalAmount = orders.reduce((sum, o) => sum + (o.price || calculatePrice(o)), 0);

  return (
    <div className="max-w-6xl mx-auto p-4">
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
      <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-indigo-900">Current Orders</h1>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex gap-2 items-center">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors text-sm"
              >
                <Unlock size={16} />
                Logout
              </button>
            )}
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm disabled:bg-gray-400"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
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
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Total Orders:</span> {totalOrders}
                </div>
                <div>
                  <span className="font-semibold">Paid:</span> {paidOrders}
                </div>
                <div>
                  <span className="font-semibold">Pending:</span> {pendingOrders}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
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
                  {orders.map((order, index) => (
                    <tr key={order.id || index} className={order.paid === 'Yes' ? 'bg-green-50' : ''}>
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium">{order.name}</td>
                      <td className="px-4 py-3 text-sm">{order.number || '-'}</td>
                      <td className="px-4 py-3 text-sm">{order.size}</td>
                      <td className="px-4 py-3 text-sm">{order.nameOnJersey || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        {order.isMuslimah === 'Yes' && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs mr-1">
                            Muslimah
                          </span>
                        )}
                        {order.isLongSleeve === 'Yes' && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            Long Sleeve
                          </span>
                        )}
                        {order.isMuslimah !== 'Yes' && order.isLongSleeve !== 'Yes' && '-'}
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
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                            order.paid === 'Yes'
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : isAuthenticated ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {!isAuthenticated && <Lock size={14} />}
                          {order.paid === 'Yes' ? '✅ Paid' : 'Mark Paid'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => deleteOrder(order.id, order.name)}
                          disabled={deleting === order.id}
                          className="text-red-600 hover:text-red-800 disabled:text-gray-400 transition-colors"
                          title="Delete order"
                        >
                          {deleting === order.id ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-900 mb-2">Important Dates:</h3>
        <div className="text-sm text-amber-800 space-y-1">
          <p>📅 <strong>Cut-off Date:</strong> 31st January 2026</p>
          <p>💰 <strong>Payment Deadline:</strong> 5th February 2026</p>
        </div>
      </div>
    </div>
  );
}