import React, { useEffect, useState } from 'react';
import { SalesData, PostData, ProductData } from '../types';
import { getRecentSales, getRecentPosts, getProducts, deleteSale } from '../services/db';
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
import { DollarSign, Share2, TrendingUp, Users, Package, Trash2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [sales, setSales] = useState<SalesData[]>([]);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [salesData, postsData, productsData] = await Promise.all([
      getRecentSales(),
      getRecentPosts(),
      getProducts()
    ]);
    setSales(salesData);
    setPosts(postsData);
    setProducts(productsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteSale = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data penjualan ini dari Dashboard?")) {
      await deleteSale(id);
      fetchData(); // Refresh data
    }
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
    // How many posts link to this product?
    const relatedPosts = posts.filter(p => p.productId === product.id);
    const postCount = relatedPosts.length;
    
    // Revenue logic:
    // 1. New Logic: Sales directly linked to productId
    // 2. Old Logic: Sales linked to a Post, which is linked to a Product (Backwards compatibility)
    
    // Direct product sales
    const directSales = sales.filter(s => s.type === 'content' && s.productId === product.id);
    const directRevenue = directSales.reduce((sum, s) => sum + s.revenue, 0);

    // Legacy indirect sales via posts (if any existing data)
    const relatedPostIds = relatedPosts.map(p => p.id);
    const indirectSales = sales.filter(s => s.type === 'content' && !s.productId && s.linkedPostId && relatedPostIds.includes(s.linkedPostId));
    const indirectRevenue = indirectSales.reduce((sum, s) => sum + s.revenue, 0);

    return {
      name: product.name,
      account: product.accountName,
      posts: postCount,
      revenue: directRevenue + indirectRevenue
    };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 10); // Sort by revenue instead of posts now

  // Format currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const COLORS = ['#d97706', '#059669', '#2563eb', '#9333ea', '#db2777']; // Updated colors for dark mode context

  if (loading) return <div className="flex h-full items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-amber-500 rounded-full border-t-transparent"></div></div>;

  return (
    <div className="p-2 md:p-6 space-y-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-100 border-b border-slate-800 pb-4">Dashboard Overview</h2>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 flex items-center transition-all hover:border-amber-500/50">
          <div className="p-3 rounded-full bg-slate-800 text-amber-500 mr-4 border border-slate-700">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Total Value (GMV/Rev)</p>
            <p className="text-xl font-bold text-white">{formatIDR(totalRevenue)}</p>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 flex items-center transition-all hover:border-emerald-500/50">
          <div className="p-3 rounded-full bg-slate-800 text-emerald-500 mr-4 border border-slate-700">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Total Commission</p>
            <p className="text-xl font-bold text-white">{formatIDR(totalCommission)}</p>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 flex items-center transition-all hover:border-blue-500/50">
          <div className="p-3 rounded-full bg-slate-800 text-blue-500 mr-4 border border-slate-700">
            <Share2 size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Total Posts</p>
            <p className="text-xl font-bold text-white">{totalPosts}</p>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 flex items-center transition-all hover:border-purple-500/50">
          <div className="p-3 rounded-full bg-slate-800 text-purple-500 mr-4 border border-slate-700">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Products Promoted</p>
            <p className="text-xl font-bold text-white">{productPerformance.filter(p => p.posts > 0 || p.revenue > 0).length}</p>
          </div>
        </div>
      </div>

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
          <h3 className="text-lg font-semibold text-slate-200">Top Performing Products</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-300 font-medium">
              <tr>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">Account Owner</th>
                <th className="px-6 py-3">Posts Created</th>
                <th className="px-6 py-3">Total Revenue Attributed</th>
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
                   <td colSpan={4} className="p-6 text-center text-slate-600">No product data available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-slate-200">Recent Sales Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-300 font-medium">
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
              {sales.slice(0, 50).map((sale, idx) => (
                <tr key={sale.id || idx} className="hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-3">{sale.date}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${sale.type === 'general' ? 'bg-blue-900/20 text-blue-400 border-blue-900/50' : 'bg-purple-900/20 text-purple-400 border-purple-900/50'}`}>
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;