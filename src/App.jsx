import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import OrderForm from './pages/OrderForm';
import CurrentList from './pages/CurrentList';
import { ClipboardList, List } from 'lucide-react';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="bg-indigo-900 text-white shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Ganador Jersey 2026</h1>
          <div className="flex gap-4">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                location.pathname === '/' 
                  ? 'bg-indigo-700' 
                  : 'hover:bg-indigo-800'
              }`}
            >
              <ClipboardList size={20} />
              <span>New Order</span>
            </Link>
            <Link
              to="/list"
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                location.pathname === '/list' 
                  ? 'bg-indigo-700' 
                  : 'hover:bg-indigo-800'
              }`}
            >
              <List size={20} />
              <span>Current List</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <Routes>
          <Route path="/" element={<OrderForm />} />
          <Route path="/list" element={<CurrentList />} />
        </Routes>
      </div>
    </Router>
  );
}