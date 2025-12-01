import React, { useEffect, useState } from 'react';
import { SalesData, PostData, ProductData } from '../types';
import { getSalesByDateRange, getPostsByDateRange, getProducts, deleteSale } from '../services/db';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DollarSign, Share2, TrendingUp, Users, Package, Trash2, Calendar, Download, RefreshCw, Cloud, AlertTriangle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [sales, setSales] = useState<SalesData[]>([]);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('syncing');

  // Date Filter State
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const fetchData = async () => {
    setLoading(true);
    setSyncStatus('syncing');
    try {
      const [salesData, postsData, productsData] = await Promise.all([
        getSalesByDateRange(startDate, endDate),
        getPostsByDateRange(startDate, endDate),
        getProducts()
      ]);
      setSales(salesData);
      setPosts(postsData);
      setProducts(productsData);
      setSyncStatus('idle');
    } catch (error) {
      console.error("Sync error:", error);
      setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]); // Refresh when dates change

  const handleDeleteSale = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data penjualan ini dari Dashboard?")) {
      setSyncStatus('syncing');
      await deleteSale(id);
      fetchData(); // Refresh data
    }
  };

  const handleDownloadCSV = () => {
    if (sales.length === 0) return;
    
    // Headers
    const headers = ["Date", "Type", "Talent", "Account", "Product/Context", "GMV/Revenue", "Commission", "Qty", "Views", "Clicks"];
    
    // Rows
    const rows = sales.map(s => [
      s.date,
      s.type,
      s.talentName,
      s.accountName || '-',
      s.productName || '-',
      s.type === 'general' ? s.gmv : s.revenue,
      s.commission,
      s.quantity,
      s.productViews || 0,
      s.productClicks || 0
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate Totals
  const totalRevenue = sales.reduce((sum, item) => {
    const val = item.type === 'general' ? (item.gmv || 0) : (item.revenue || 0);
    return sum + val;
  }, 0);

  const totalCommission = sales.reduce((sum, item) => sum + (item.commission || 0), 0);
  const totalPosts = posts.length;
  
  // Aggregation for charts
  const salesByTalent = sales.reduce((acc, curr) => {
    const value = curr.type === 'general' ? (curr.gmv || 0) : (curr.revenue || 0);
    const found = acc.find(item => item.name === curr.talentName);
    if (found) {
      found.value += value;
    } else {
      acc.push({ name: curr.talentName, value: value });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const postsByPlatform = posts.reduce((acc, curr) => {
    const found = acc.find(item => item.name === curr.platform);
    if (found) {
      found.count += 1;
    } else {
      acc.push({ name: curr.platform, count: 1 });
    }
    return acc;
  }, [] as { name: string; count: number }[]);

  // Product Performance Aggregation
  const productPerformance = products.map(product => {
    // How many posts link to this product IN THIS DATE RANGE?
    const relatedPosts = posts.filter(p => p.productId === product.id);
    const postCount = relatedPosts.length;
    
    // Revenue logic:
    // Direct product sales
    const directSales = sales.filter(s => s.type === 'content' && s.productId === product.id);
    const directRevenue = directSales.reduce((sum, s) => sum + s.revenue, 0);

    return {
      name: product.name,
      account: product.accountName,
      posts: postCount,
      revenue: directRevenue
    };
  })
  .filter(p => p.revenue > 0 || p.posts > 0) // Only show active products in this range
  .sort((a, b) => b.revenue - a.revenue)
  .slice(0, 10);

  // Format currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const COLORS = ['#d97706', '#059669', '#2563eb', '#9333ea', '#db2777']; 

  return (
    <div className="p-2 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-100">Dashboard Overview</h2>
          
          {/* Sync Status Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium">
            {syncStatus === 'syncing' && (
              <>
                <RefreshCw size={12} className="animate-spin text-amber-500" />
                <span className="text-slate-400">Syncing...</span>
              </>
            )}
            {syncStatus === 'idle' && (
              <>
                <Cloud size={12} className="text-emerald-500" />
                <span className="text-emerald-500">Data Synced</span>
              </>
            )}
            {syncStatus === 'error' && (
              <>
                <AlertTriangle size={12} className="text-red-500" />
                <span className="text-red-500">Sync Error</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800 flex-1 md:flex-none">
            <Calendar size={16} className="text-amber-500 ml-2" />
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-slate-200 text-sm focus:outline-none px-2 py-1 w-full md:w-auto"
            />
            <span className="text-slate-500">-</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-slate-200 text-sm focus:outline-none px-2 py-1 w-full md:w-auto"
            />
          </div>
          
          <button 
            onClick={handleDownloadCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 transition-colors text-sm font-medium whitespace-nowrap"
            title="Download CSV Laporan Penjualan"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 flex items-center transition-all hover:border-amber-500/50">
          <div className="p-3 rounded-full bg-slate-800 text-amber-500 mr-4 border border-slate-700">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Total Value (GMV)</p>
            {loading ? <div className="h-6 w-24 bg-slate-800 rounded animate-pulse"/> : <p className="text-xl font-bold text-white">{formatIDR(totalRevenue)}</p>}
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 flex items-center transition-all hover:border-emerald-500/50">
          <div className="p-3 rounded-full bg-slate-800 text-emerald-500 mr-4 border border-slate-700">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Total Commission</p>
            {loading ? <div className="h-6 w-24 bg-slate-800 rounded animate-pulse"/> : <p className="text-xl font-bold text-white">{formatIDR(totalCommission)}</p>}
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 flex items-center transition-all hover:border-blue-500/50">
          <div className="p-3 rounded-full bg-slate-800 text-blue-500 mr-4 border border-slate-700">
            <Share2 size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Total Posts</p>
            {loading ? <div className="h-6 w-16 bg-slate-800 rounded animate-pulse"/> : <p className="text-xl font-bold text-white">{totalPosts}</p>}
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 flex items-center transition-all hover:border-purple-500/50">
          <div className="p-3 rounded-full bg-slate-800 text-purple-500 mr-4 border border-slate-700">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Products Active</p>
            {loading ? <div className="h-6 w-10 bg-slate-800 rounded animate-pulse"/> : <p className="text-xl font-bold text-white">{productPerformance.length}</p>}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center flex-col gap-4">
          <div className="animate-spin h-10 w-10 border-4 border-amber-500 rounded-full border-t-transparent"></div>
          <p className="text-slate-500 animate-pulse">Synchronizing Data...</p>
        </div>
      ) : (
        <>
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Sales Value by Talent</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByTalent}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `Rp${val/1000000}m`} tick={{fill: '#94a3b8'}} />
                    <Tooltip 
                        formatter={(value: number) => formatIDR(value)}
                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', color: '#f8fafc' }}
                        itemStyle={{ color: '#fbbf24' }}
                        cursor={{fill: '#334155', opacity: 0.4}}
                    />
                    <Bar dataKey="value" fill="#d97706" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Posts by Platform</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={postsByPlatform}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {postsByPlatform.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', color: '#f8fafc' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 flex-wrap mt-2">
                  {postsByPlatform.map((entry, index) => (
                    <div key={index} className="flex items-center text-xs text-slate-400">
                      <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      {entry.name} ({entry.count})
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Product Performance Table */}
          <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-slate-200">Top Performing Products (In Selected Date)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950 text-slate-300 font-medium">
                  <tr>
                    <th className="px-6 py-3">Product Name</th>
                    <th className="px-6 py-3">Account Owner</th>
                    <th className="px-6 py-3">Posts Created</th>
                    <th className="px-6 py-3">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {productPerformance.map((prod, idx) => (
                    <tr key={idx} className="hover:bg-slate-800 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-200">{prod.name}</td>
                      <td className="px-6 py-3 text-xs text-slate-500">{prod.account || 'Global'}</td>
                      <td className="px-6 py-3">
                        <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1 rounded-full text-xs font-bold">
                          {prod.posts} Posts
                        </span>
                      </td>
                      <td className="px-6 py-3 text-emerald-400 font-medium">
                        {formatIDR(prod.revenue)}
                      </td>
                    </tr>
                  ))}
                  {productPerformance.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-600">No active products found in this date range.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Sales Table */}
          <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-slate-200">Sales Activity Log ({startDate} to {endDate})</h3>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950 text-slate-300 font-medium sticky top-0">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Talent</th>
                    <th className="px-6 py-3">Product/Context</th>
                    <th className="px-6 py-3">Value</th>
                    <th className="px-6 py-3">Commission</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sales.map((sale, idx) => (
                    <tr key={sale.id || idx} className="hover:bg-slate-800 transition-colors">
                      <td className="px-6 py-3">{sale.date}</td>
                      <td className="px-6 py-3">
                        <span 
                          title={sale.type === 'general' ? "Aggregated general sales data (GMV)" : "Direct sales linked to a specific product"}
                          className={`cursor-help px-2 py-1 rounded-full text-xs font-medium border ${sale.type === 'general' ? 'bg-blue-900/20 text-blue-400 border-blue-900/50' : 'bg-purple-900/20 text-purple-400 border-purple-900/50'}`}
                        >
                          {sale.type === 'general' ? 'General' : 'Product Sales'}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-medium text-slate-200">{sale.talentName}</td>
                      <td className="px-6 py-3 truncate max-w-xs">{sale.productName || '-'}</td>
                      <td className="px-6 py-3 text-emerald-400 font-medium">
                        {formatIDR(sale.type === 'general' ? (sale.gmv || 0) : (sale.revenue || 0))}
                      </td>
                      <td className="px-6 py-3 text-emerald-500">
                        {formatIDR(sale.commission || 0)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button 
                          onClick={() => sale.id && handleDeleteSale(sale.id)}
                          className="text-slate-600 hover:text-red-400 transition-colors"
                          title="Delete Entry"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sales.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-600">No sales data found for this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;