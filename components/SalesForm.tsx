import React, { useState, useEffect } from 'react';
import { addSale, getTalentReferences, getProducts, getRecentSales, deleteSale } from '../services/db';
import { TalentReference, ProductData, SalesData } from '../types';
import { CheckCircle, AlertCircle, ShoppingBag, Package, Trash2, RotateCcw } from 'lucide-react';

type SalesType = 'general' | 'content'; 

const SalesForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SalesType>('general');
  const [talents, setTalents] = useState<TalentReference[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // History State
  const [recentHistory, setRecentHistory] = useState<SalesData[]>([]);

  // General Form State
  const [generalForm, setGeneralForm] = useState({
    date: new Date().toISOString().split('T')[0],
    talentName: '',
    accountName: '',
    gmv: 0,
    commission: 0,
    quantity: 0,
    productViews: 0,
    productClicks: 0
  });

  // Product Sales Form State
  const [productForm, setProductForm] = useState({
    date: new Date().toISOString().split('T')[0],
    talentName: '',
    accountName: '',
    productId: '',
    revenue: 0, 
    quantity: 0, 
    commission: 0
  });

  const refreshHistory = async () => {
    const data = await getRecentSales();
    setRecentHistory(data);
  };

  useEffect(() => {
    const initData = async () => {
      const [talentData, productData] = await Promise.all([
        getTalentReferences(),
        getProducts()
      ]);
      setTalents(talentData);
      setProducts(productData);
      refreshHistory();
    };
    initData();
  }, []);

  const getAccounts = (talentName: string) => {
    const t = talents.find(t => t.name === talentName);
    return t?.accounts || [];
  };

  // Filter products based on selected account in Product Form
  const getFilteredProducts = () => {
    if (!productForm.accountName) return [];
    
    return products.filter(p => {
        // Show if product is linked to this account OR if it has no account linked (Global product)
        return p.accountName === productForm.accountName || !p.accountName;
    });
  };

  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    const success = await addSale({
      ...generalForm,
      type: 'general',
      revenue: 0,
      productName: 'General Report'
    });
    
    if (success) {
      setStatus('success');
      setGeneralForm(prev => ({ 
        ...prev, 
        gmv: 0, commission: 0, quantity: 0, productViews: 0, productClicks: 0 
      }));
      refreshHistory();
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('error');
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    
    const selectedProduct = products.find(p => p.id === productForm.productId);
    const productName = selectedProduct ? selectedProduct.name : 'Unknown Product';

    const success = await addSale({
      date: productForm.date,
      talentName: productForm.talentName,
      accountName: productForm.accountName,
      type: 'content',
      revenue: productForm.revenue,
      quantity: productForm.quantity,
      commission: productForm.commission,
      productId: productForm.productId,
      productName: productName
    });

    if (success) {
      setStatus('success');
      setProductForm(prev => ({ 
        ...prev, 
        revenue: 0, quantity: 0, commission: 0, productId: '' 
      }));
      refreshHistory();
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data penjualan ini?")) {
      await deleteSale(id);
      refreshHistory();
    }
  };

  // Format currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const filteredProducts = getFilteredProducts();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex space-x-4 bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'general' 
              ? 'bg-amber-600 text-white shadow-lg' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <ShoppingBag size={18} />
          Penjualan Umum
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'content' 
              ? 'bg-amber-600 text-white shadow-lg' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Package size={18} />
          Penjualan per Produk
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 p-8">
        <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
          {activeTab === 'general' ? <ShoppingBag className="text-amber-500" /> : <Package className="text-amber-500" />}
          {activeTab === 'general' ? 'Input Data Penjualan Umum' : 'Input Penjualan per Produk'}
        </h2>
        
        {status === 'success' && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-800 text-green-400 rounded-lg flex items-center gap-2">
            <CheckCircle size={20} /> Data berhasil disimpan!
          </div>
        )}
        {status === 'error' && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 text-red-400 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} /> Gagal menyimpan data. Silakan coba lagi.
          </div>
        )}

        {/* GENERAL SALES FORM */}
        {activeTab === 'general' && (
          <form onSubmit={handleGeneralSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={generalForm.date}
                    onChange={e => setGeneralForm({...generalForm, date: e.target.value})}
                    className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nama Talent</label>
                  <select
                    required
                    value={generalForm.talentName}
                    onChange={e => setGeneralForm({...generalForm, talentName: e.target.value, accountName: ''})}
                    className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">Pilih Talent</option>
                    {talents.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nama Akun</label>
                  <select
                    required
                    disabled={!generalForm.talentName}
                    value={generalForm.accountName}
                    onChange={e => setGeneralForm({...generalForm, accountName: e.target.value})}
                    className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-900 disabled:text-slate-600"
                  >
                    <option value="">Pilih Akun</option>
                    {getAccounts(generalForm.talentName).map(acc => <option key={acc} value={acc}>{acc}</option>)}
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-800 md:col-span-2 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">GMV (IDR)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={generalForm.gmv}
                    onChange={e => setGeneralForm({...generalForm, gmv: Number(e.target.value)})}
                    className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Estimasi Komisi (IDR)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={generalForm.commission}
                    onChange={e => setGeneralForm({...generalForm, commission: Number(e.target.value)})}
                    className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Jumlah Produk Terjual</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={generalForm.quantity}
                    onChange={e => setGeneralForm({...generalForm, quantity: Number(e.target.value)})}
                    className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Produk Dilihat</label>
                    <input
                      type="number"
                      min="0"
                      value={generalForm.productViews}
                      onChange={e => setGeneralForm({...generalForm, productViews: Number(e.target.value)})}
                      className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Produk Diklik</label>
                    <input
                      type="number"
                      min="0"
                      value={generalForm.productClicks}
                      onChange={e => setGeneralForm({...generalForm, productClicks: Number(e.target.value)})}
                      className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg shadow-amber-900/20 text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
              >
                Simpan Data Umum
              </button>
            </div>
          </form>
        )}

        {/* PRODUCT SALES FORM */}
        {activeTab === 'content' && (
          <form onSubmit={handleProductSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={productForm.date}
                    onChange={e => setProductForm({...productForm, date: e.target.value})}
                    className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nama Talent</label>
                  <select
                    required
                    value={productForm.talentName}
                    onChange={e => setProductForm({...productForm, talentName: e.target.value, accountName: '', productId: ''})}
                    className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">Pilih Talent</option>
                    {talents.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nama Akun</label>
                  <select
                    required
                    disabled={!productForm.talentName}
                    value={productForm.accountName}
                    onChange={e => setProductForm({...productForm, accountName: e.target.value, productId: ''})}
                    className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-900 disabled:text-slate-600"
                  >
                    <option value="">Pilih Akun</option>
                    {getAccounts(productForm.talentName).map(acc => <option key={acc} value={acc}>{acc}</option>)}
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-1">Pilih Produk</label>
                <select
                  required
                  disabled={!productForm.accountName}
                  value={productForm.productId}
                  onChange={e => setProductForm({...productForm, productId: e.target.value})}
                  className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-900 disabled:text-slate-600"
                >
                  <option value="">-- Pilih Produk --</option>
                  {filteredProducts.map(prod => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name}
                    </option>
                  ))}
                </select>
                {!productForm.accountName && (
                  <p className="text-xs text-slate-500 mt-1">
                    Silakan pilih akun terlebih dahulu untuk melihat daftar produk.
                  </p>
                )}
                {productForm.accountName && filteredProducts.length === 0 && (
                  <p className="text-xs text-amber-500 mt-1">
                    Tidak ada produk untuk akun ini. Silakan input di menu "Input Product".
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Jumlah Omset (IDR)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={productForm.revenue}
                  onChange={e => setProductForm({...productForm, revenue: Number(e.target.value)})}
                  className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Estimasi Komisi (IDR)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={productForm.commission}
                  onChange={e => setProductForm({...productForm, commission: Number(e.target.value)})}
                  className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Jumlah Produk Terjual</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={productForm.quantity}
                  onChange={e => setProductForm({...productForm, quantity: Number(e.target.value)})}
                  className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg shadow-amber-900/20 text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
              >
                Simpan Penjualan Produk
              </button>
            </div>
          </form>
        )}
      </div>

      {/* RECENT SALES TABLE (HISTORY) */}
      <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-200">Riwayat Input Penjualan</h3>
          <button type="button" onClick={refreshHistory} className="text-slate-500 hover:text-amber-500 transition-colors">
             <RotateCcw size={18} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-300 font-medium">
              <tr>
                <th className="px-6 py-3">Tanggal</th>
                <th className="px-6 py-3">Tipe</th>
                <th className="px-6 py-3">Talent</th>
                <th className="px-6 py-3">Produk / Info</th>
                <th className="px-6 py-3">Nilai (IDR)</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recentHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-3">{item.date}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${item.type === 'general' ? 'bg-blue-900/20 text-blue-400 border-blue-900/50' : 'bg-purple-900/20 text-purple-400 border-purple-900/50'}`}>
                      {item.type === 'general' ? 'Umum' : 'Produk'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-200">{item.talentName}</td>
                  <td className="px-6 py-3 truncate max-w-xs">{item.productName || '-'}</td>
                  <td className="px-6 py-3 font-medium text-emerald-400">
                    {formatIDR(item.type === 'general' ? (item.gmv || 0) : (item.revenue || 0))}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button 
                      type="button"
                      onClick={() => item.id && handleDelete(item.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors"
                      title="Hapus Data"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {recentHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-600">Belum ada data penjualan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesForm;