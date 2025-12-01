import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import SalesForm from './components/SalesForm';
import PostForm from './components/PostForm';
import ProductForm from './components/ProductForm';
import TalentSettings from './components/TalentSettings';
import { ViewState } from './types';
import { LayoutDashboard, ShoppingCart, Share2, Settings, LogOut, Menu, X, Package } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('dashboard');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-amber-500">Loading BMS...</div>;
  }

  if (!user) {
    return <Auth />;
  }

  const NavItem = ({ target, icon: Icon, label }: { target: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => {
        setView(target);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${
        view === target 
          ? 'bg-gradient-to-r from-amber-600/20 to-transparent text-amber-500 border-l-4 border-amber-500' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <Icon size={20} className={view === target ? 'text-amber-500' : ''} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-200">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:block
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <span className="text-xl font-bold text-amber-500 tracking-wider">Talent BMS</span>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2 mt-2">Menu</div>
          <NavItem target="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem target="sales-entry" icon={ShoppingCart} label="Input Sales" />
          <NavItem target="product-entry" icon={Package} label="Input Product" />
          <NavItem target="post-entry" icon={Share2} label="Input Content" />
          
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2 mt-6">Admin</div>
          <NavItem target="settings" icon={Settings} label="Talent Settings" />
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-500 font-bold text-xs">
              {user.email?.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-200 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950">
        {/* Mobile Header */}
        <header className="bg-slate-900 border-b border-slate-800 h-16 flex items-center px-4 lg:hidden">
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-400 p-2 hover:text-white">
            <Menu size={24} />
          </button>
          <span className="ml-4 font-bold text-amber-500">
            {view === 'dashboard' && 'Dashboard'}
            {view === 'sales-entry' && 'Sales Entry'}
            {view === 'product-entry' && 'Product Entry'}
            {view === 'post-entry' && 'Content Entry'}
            {view === 'settings' && 'Settings'}
          </span>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {view === 'dashboard' && <Dashboard />}
          {view === 'sales-entry' && <SalesForm />}
          {view === 'product-entry' && <ProductForm />}
          {view === 'post-entry' && <PostForm />}
          {view === 'settings' && <TalentSettings />}
        </div>
      </main>
    </div>
  );
};

export default App;