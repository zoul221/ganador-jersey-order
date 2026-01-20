import React, { useMemo, useState } from 'react';
import { RefreshCw, Plus, Trash2, ChevronDown, ChevronRight, Shirt, Image as ImageIcon, X, Maximize2 } from 'lucide-react';

const GOOGLE_SHEETS_URL = import.meta.env.VITE_GOOGLE_SHEETS_URL;

const DELIVERY_FEE = 5;
const SIZES = [
  'XS','S','M','L','XL','2XL','3XL','4XL','5XL','6XL','7XL','8XL',
  '3/4 yr','5/6 yr','7/8 yr'
];

function blankItem() {
  return {
    id: crypto?.randomUUID?.() || String(Date.now() + Math.random()),
    number: '',
    size: '',
    nameOnJersey: '',
    isMuslimah: false,
    isLongSleeve: false,
  };
}

function calculateUnitPrice(order) {
  let price = order.size.includes('yr') ? 38 : 50;
  if (order.isLongSleeve) price += 5;
  if (order.isMuslimah) price += 10;
  if (['4XL','5XL','6XL'].includes(order.size)) price += 5;
  if (['7XL','8XL'].includes(order.size)) price += 10;
  return price;
}

function SizeChartModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('adult');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <ImageIcon size={24} />
              <h3 className="font-bold text-xl sm:text-2xl">Size Guide</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <div className="inline-flex rounded-lg bg-white/20 backdrop-blur-sm p-1 mt-4">
            <button
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                tab === 'adult' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-white hover:bg-white/10'
              }`}
              onClick={() => setTab('adult')}
              type="button"
            >
              Adult Sizes
            </button>
            <button
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                tab === 'kids' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-white hover:bg-white/10'
              }`}
              onClick={() => setTab('kids')}
              type="button"
            >
              Kids Sizes
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-gray-50 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="bg-white rounded-lg overflow-hidden shadow-sm">
            {tab === 'adult' ? (
              <img 
                src="/size-chart-adult.jpeg" 
                alt="Adult Size Chart" 
                className="w-full h-auto"
              />
            ) : (
              <img 
                src="/size-chart-kid.jpeg" 
                alt="Kids Size Chart" 
                className="w-full h-auto"
              />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            📏 Sizing in inches. Width is pit-to-pit. Size tolerance ±0.5–0.7"
          </p>
        </div>
      </div>
    </div>
  );
}

function QRCodeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xl text-white">Scan to Pay</h3>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 bg-gray-50 flex flex-col items-center">
          <div className="bg-white rounded-lg overflow-hidden shadow-md mb-4">
            <img 
              src="/zul-maybank-qr.jpeg" 
              alt="Maybank QR Code" 
              className="w-full h-auto"
            />
          </div>
          <p className="text-sm text-gray-600 text-center font-medium">Scan with your banking app to transfer</p>
        </div>
      </div>
    </div>
  );
}

function SizeChartImages() {
  const [tab, setTab] = useState('adult');

  return (
    <div className="mt-6 bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <ImageIcon size={20} />
            <h3 className="font-bold text-lg">Size Guide</h3>
          </div>
          <div className="inline-flex rounded-lg bg-white/20 backdrop-blur-sm p-1">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                tab === 'adult' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-white hover:bg-white/10'
              }`}
              onClick={() => setTab('adult')}
              type="button"
            >
              Adult
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                tab === 'kids' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-white hover:bg-white/10'
              }`}
              onClick={() => setTab('kids')}
              type="button"
            >
              Kids
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-50">
        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
          {tab === 'adult' ? (
            <img 
              src="/size-chart-adult.jpeg" 
              alt="Adult Size Chart" 
              className="w-full h-auto"
            />
          ) : (
            <img 
              src="/size-chart-kid.jpeg" 
              alt="Kids Size Chart" 
              className="w-full h-auto"
            />
          )}
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center">
          📏 Sizing in inches. Width is pit-to-pit. Size tolerance ±0.5–0.7"
        </p>
      </div>
    </div>
  );
}

export default function OrderForm() {
  const [buyerName, setBuyerName] = useState('');
  const [fulfillment, setFulfillment] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [items, setItems] = useState([blankItem()]);
  const [expandedId, setExpandedId] = useState(null);
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  const setItemField = (id, field, value) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const addItem = () => {
    const n = blankItem();
    setItems(prev => [n, ...prev]);
    setExpandedId(n.id);
  };

  const removeItem = (id) => {
    setItems(prev => {
      const next = prev.filter(it => it.id !== id);
      if (expandedId === id && next.length) setExpandedId(next[0].id);
      if (!next.length) {
        const n = blankItem();
        setExpandedId(n.id);
        return [n];
      }
      return next;
    });
  };

  const subtotal = items.reduce((sum, it) => sum + (it.size ? calculateUnitPrice(it) : 0), 0);
  const deliveryFeeApplied = fulfillment === 'delivery' ? DELIVERY_FEE : 0;
  const grandTotal = subtotal + deliveryFeeApplied;

  // Calculate summary statistics
  const validItems = items.filter(it => it.size);
  const baseSubtotal = validItems.reduce((sum, it) => {
    let price = it.size.includes('yr') ? 38 : 50;
    return sum + price;
  }, 0);
  const totalAddOns = subtotal - baseSubtotal;
  const longSleeveCount = items.filter(it => it.isLongSleeve && it.size).length;
  const muslimaCount = items.filter(it => it.isMuslimah && it.size).length;
  const largeSizeCount = items.filter(it => it.size && ['4XL','5XL','6XL','7XL','8XL'].includes(it.size)).length;

  const numbersCount = useMemo(() => {
    const map = new Map();
    items.forEach(it => {
      const key = String(it.number || '').trim();
      if (!key) return;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [items]);

  const validate = () => {
    if (!buyerName.trim()) {
      alert('Please enter your name (orderer).');
      return false;
    }
    if (!/^[0-9+\-() ]{6,}$/.test(contactPhone.trim())) {
      alert('Please provide a valid contact phone.');
      return false;
    }
    if (items.length === 0) {
      alert('Please add at least one jersey.');
      return false;
    }
    for (const [idx, it] of items.entries()) {
      if (it.size === '') {
        alert(`Jersey ${idx + 1}: Please fill in Size`);
        return false;
      }

      // Jersey Number is optional, but if provided, validate it
      const nStr = String(it.number).trim();
      if (nStr !== '') {
        const isDigits = /^\d{1,3}$/.test(nStr);
        const n = Number(nStr);

        if (!isDigits || !Number.isInteger(n) || n < 0 || n > 100) {
          alert(`Jersey ${idx + 1}: Jersey Number must be an integer between 0 and 100`);
          return false;
        }
      }
    }
    if (fulfillment === 'delivery') {
      if (!deliveryAddress.trim()) {
        alert('Please provide a delivery address.');
        return false;
      }
    }
    return true;
  };

  const syncToGoogleSheets = async (payload) => {
    try {
      setLoading(true);
      setSyncStatus('Saving to Google Sheets...');

      await fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setSyncStatus('✓ Order saved successfully!');
      setTimeout(() => setSyncStatus(''), 3000);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('✗ Failed to save order');
      setTimeout(() => setSyncStatus(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const orderId = Date.now();
    const timestamp = new Date().toISOString();

    const payload = {
      orderId,
      timestamp,
      paid,
      buyerName: buyerName.trim(),
      fulfillment,
      deliveryAddress: fulfillment === 'delivery' ? deliveryAddress.trim() : '',
      contactPhone: contactPhone.trim(),
      deliveryFee: deliveryFeeApplied,
      items: items.map(it => {
        const unitPrice = calculateUnitPrice(it);
        return {
          id: it.id,
          number: String(it.number).trim(),
          size: it.size,
          nameOnJersey: it.nameOnJersey.trim(),
          isMuslimah: !!it.isMuslimah,
          isLongSleeve: !!it.isLongSleeve,
          unitPrice,
          lineTotal: unitPrice,
        };
      }),
      subtotal,
      grandTotal,
    };

    await syncToGoogleSheets(payload);

    const n = blankItem();
    setItems([n]);
    setExpandedId(n.id);
    setPaid(false);
    setBuyerName('');
    setFulfillment('pickup');
    setDeliveryAddress('');
    setContactPhone('');
  };

  const DuplicateHint = ({ item }) => {
    const key = String(item.number || '').trim();
    if (!key || numbersCount.get(key) <= 1) return null;
    return (
      <span className="ml-2 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
        ⚠ Duplicate
      </span>
    );
  };

  const JerseySummary = ({ item, index }) => {
    const price = item.size ? calculateUnitPrice(item) : null;
    return (
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex-shrink-0">
          <Shirt size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">
            Jersey #{index + 1}
            {String(item.number).trim() !== '' && (
              <span className="text-indigo-600 ml-1">• #{item.number}</span>
            )}
            {item.size && <span className="text-gray-500 ml-1">• {item.size}</span>}
            <DuplicateHint item={item} />
          </div>
          <div className="text-xs text-gray-500 truncate flex flex-wrap gap-1">
            {item.isLongSleeve && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Long Sleeve</span>}
            {item.isMuslimah && <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Muslimah</span>}
            {item.nameOnJersey && <span className="text-gray-600">"{item.nameOnJersey}"</span>}
          </div>
        </div>
        <div className="text-sm font-bold text-indigo-900 flex-shrink-0">
          {price ? `RM ${price}` : ''}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
      {/* Size Chart Modal */}
      <SizeChartModal isOpen={showSizeChart} onClose={() => setShowSizeChart(false)} />
      {/* QR Code Modal */}
      <QRCodeModal isOpen={showQRCode} onClose={() => setShowQRCode(false)} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
        {/* Jersey Image Section */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Ganador Jersey 2026</h2>
              <p className="text-indigo-100 text-sm mt-1">Official team jersey</p>
            </div>

            <div className="p-4 sm:p-6">
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden shadow-inner">
                <img 
                  src="/ganador-jersey-26.jpeg" 
                  alt="Ganador Jersey 2026" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 sm:p-6 shadow-md">
            <h3 className="font-bold text-blue-900 mb-3 text-lg flex items-center gap-2">
              💰 Pricing Information
            </h3>
            <div className="space-y-2 text-sm text-blue-900">
              <div className="flex justify-between items-center bg-white rounded-lg px-3 py-2">
                <span className="font-medium">Adult Jersey</span>
                <span className="font-bold">RM 50</span>
              </div>
              <div className="flex justify-between items-center bg-white rounded-lg px-3 py-2">
                <span className="font-medium">Child Jersey</span>
                <span className="font-bold">RM 38</span>
              </div>
              
              <div className="mt-3 pt-3 border-t-2 border-blue-200">
                <p className="font-semibold mb-2">Add-ons:</p>
                <div className="space-y-1.5 ml-2">
                  <div className="flex justify-between">
                    <span>• Long Sleeve</span>
                    <span className="font-semibold">+RM 5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Muslimah</span>
                    <span className="font-semibold">+RM 10</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 4XL - 6XL</span>
                    <span className="font-semibold">+RM 5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 7XL - 8XL</span>
                    <span className="font-semibold">+RM 10</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t-2 border-blue-200">
                <div className="flex justify-between items-center bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg px-3 py-2">
                  <span className="font-medium">🚚 Delivery</span>
                  <span className="font-bold">RM {DELIVERY_FEE}</span>
                </div>
                <p className="text-xs text-blue-700 mt-1 text-center">*Only if delivery option selected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Form */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Place Your Order</h1>
                <p className="text-indigo-100 text-xs sm:text-sm mt-1 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Auto-syncing to Google Sheets
                </p>
              </div>
              {syncStatus && (
                <div className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full ${
                  syncStatus.includes('✓') 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {syncStatus}
                </div>
              )}
            </div>
            <div className="mt-3 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-white text-xs sm:text-sm font-medium">
                ⏰ Cut-off: <span className="font-bold">31 Jan 2026</span> | 
                💳 Payment by: <span className="font-bold">5 Feb 2026</span>
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Your Name (Orderer) *
                </label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Full name"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="+60 12-345 6789"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fulfillment Method *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`relative flex items-center justify-center gap-2 cursor-pointer border-2 rounded-lg px-4 py-3 transition-all ${
                    fulfillment === 'pickup'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <input
                      type="radio"
                      name="fulfillment"
                      value="pickup"
                      checked={fulfillment === 'pickup'}
                      onChange={() => setFulfillment('pickup')}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">🏪 Self Pickup</span>
                  </label>
                  <label className={`relative flex items-center justify-center gap-2 cursor-pointer border-2 rounded-lg px-4 py-3 transition-all ${
                    fulfillment === 'delivery'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <input
                      type="radio"
                      name="fulfillment"
                      value="delivery"
                      checked={fulfillment === 'delivery'}
                      onChange={() => setFulfillment('delivery')}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">🚚 Delivery</span>
                  </label>
                </div>
              </div>

              {fulfillment === 'delivery' && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Delivery Address *
                  </label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Street, area, postcode, city, state"
                  />
                </div>
              )}
            </div>

            {/* Jerseys Section */}
            <div className="pt-4 border-t-2 border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">Jersey Items</h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {items.map((item, idx) => {
                  const expanded = expandedId === item.id;
                  return (
                    <div key={item.id} className={`border-2 rounded-lg transition-all ${
                      expanded ? 'border-indigo-300 shadow-md' : 'border-gray-200'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : item.id)}
                        className="w-full px-3 py-3 flex items-center gap-2 hover:bg-gray-50 rounded-t-lg transition-colors"
                      >
                        <div className={`transition-transform ${expanded ? 'rotate-0' : '-rotate-90'}`}>
                          <ChevronDown size={18} className="text-gray-400" />
                        </div>
                        <JerseySummary item={item} index={idx} />
                      </button>

                      {expanded && (
                        <div className="px-3 pb-4 border-t border-gray-200 bg-gray-50">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Jersey Number (optional)
                              </label>
                              <input
                                type="number"
                                value={item.number}
                                onChange={(e) => {
                                  let val = e.target.value;
                                  if (val.length > 3) val = val.slice(0, 3);
                                  setItemField(item.id, 'number', val);
                                }}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                min={0}
                                max={100}
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="0–100"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Size *
                              </label>
                              <div className="flex gap-2">
                                <select
                                  value={item.size}
                                  onChange={(e) => setItemField(item.id, 'size', e.target.value)}
                                  className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                  <option value="">Select size</option>
                                  {SIZES.map((size) => (
                                    <option key={size} value={size}>{size}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => setShowSizeChart(true)}
                                  className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors flex items-center gap-1 flex-shrink-0"
                                  title="View size guide"
                                >
                                  <Maximize2 size={16} />
                                  <span className="hidden sm:inline text-xs font-medium">Guide</span>
                                </button>
                              </div>
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Name on Jersey (optional)
                              </label>
                              <input
                                type="text"
                                value={item.nameOnJersey}
                                onChange={(e) => setItemField(item.id, 'nameOnJersey', e.target.value)}
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Leave blank if none"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 mt-3">
                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border-2 border-gray-200 hover:border-indigo-300 transition-colors">
                              <input
                                type="checkbox"
                                checked={item.isLongSleeve}
                                onChange={(e) => setItemField(item.id, 'isLongSleeve', e.target.checked)}
                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <span className="text-xs font-medium text-gray-700">Long Sleeve (+RM 5)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border-2 border-gray-200 hover:border-indigo-300 transition-colors">
                              <input
                                type="checkbox"
                                checked={item.isMuslimah}
                                onChange={(e) => setItemField(item.id, 'isMuslimah', e.target.checked)}
                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <span className="text-xs font-medium text-gray-700">Muslimah (+RM 10)</span>
                            </label>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-300">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                <Trash2 size={14} />
                                Remove
                              </button>
                            )}
                            <div className="ml-auto flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg">
                              <span className="text-xs text-gray-600">Price:</span>
                              <span className="text-sm font-bold text-indigo-900">
                                RM {item.size ? calculateUnitPrice(item) : 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={addItem}
                className="w-full mt-3 border-2 border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all"
              >
                <Plus size={18} />
                Add Another Jersey
              </button>
            </div>
          </div>

          {/* Total and Submit */}
          <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-t-2 border-gray-200">
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h4 className="text-sm font-bold text-gray-700 mb-3">Order Summary</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
                    <div className="text-xs text-gray-600 font-medium">Total Jerseys</div>
                    <div className="text-2xl font-bold text-blue-600">{validItems.length}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3">
                    <div className="text-xs text-gray-600 font-medium">Long Sleeve</div>
                    <div className="text-2xl font-bold text-purple-600">{longSleeveCount}</div>
                  </div>
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-3">
                    <div className="text-xs text-gray-600 font-medium">Muslimah</div>
                    <div className="text-2xl font-bold text-pink-600">{muslimaCount}</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3">
                    <div className="text-xs text-gray-600 font-medium">Large Sizes</div>
                    <div className="text-2xl font-bold text-orange-600">{largeSizeCount}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Base Total:</span>
                  <span className="text-lg font-bold text-gray-900">RM {baseSubtotal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Add-ons:</span>
                  <span className="text-lg font-bold text-indigo-600">+RM {totalAddOns}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Subtotal:</span>
                  <span className="text-lg font-bold text-gray-900">RM {subtotal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Delivery:</span>
                  <span className="text-lg font-bold text-gray-900">RM {deliveryFeeApplied}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2 border-gray-200">
                  <span className="text-gray-900 font-bold text-lg">Grand Total:</span>
                  <span className="text-2xl font-bold text-indigo-600">RM {grandTotal}</span>
                </div>
              </div>
            </div>

              <label className="mt-4 flex items-center gap-2 cursor-pointer bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={paid}
                  onChange={(e) => setPaid(e.target.checked)}
                  className="w-5 h-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">✅ Payment Made</span>
              </label>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:from-gray-400 disabled:to-gray-400 flex items-center justify-center gap-2"
            >
              {loading && <RefreshCw size={20} className="animate-spin" />}
              {loading ? 'Submitting...' : 'Submit Order'}
            </button>
          </div>
      </div>
      

      {/* Payment Info */}
      <div className="mt-6 bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-gray-200">
        <h3 className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
          💳 Payment Information
        </h3>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Bank:</span>
            <span className="text-sm font-bold text-gray-900">MAYBANK</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Account:</span>
            <span className="text-sm font-bold text-gray-900">005121411539</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Name:</span>
            <span className="text-sm font-bold text-gray-900">Zulhilmi Omar</span>
          </div>
          <div className="mt-3 pt-3 border-t-2 border-blue-200">
            <p className="text-xs text-gray-600 italic mb-3">
              💡 Reference format: <span className="font-semibold">name - jersey</span>
            </p>
            <button
              onClick={() => setShowQRCode(true)}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <ImageIcon size={16} />
              Scan QR Code
            </button>
          </div>
          <div className="mt-4 pt-4 border-t-2 border-blue-200 bg-amber-50 rounded-lg p-3">
            <p className="text-xs text-amber-800 font-medium mb-2">
              ⚠️ Important:Proof of Payment
            </p>
            <p className="text-xs text-amber-700">
              After making the transfer, please send a screenshot of your payment receipt to <span className="font-bold">Ozil via WhatsApp</span> to confirm your payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}