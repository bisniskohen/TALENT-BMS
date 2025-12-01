import React, { useState, useEffect, useRef } from 'react';
import { addProduct, getProducts, deleteProduct, getTalentReferences, updateProduct } from '../services/db';
import { ProductData, TalentReference } from '../types';
import { CheckCircle, AlertCircle, Package, Trash2, ExternalLink, Edit2, X, Save, Plus } from 'lucide-react';

const ProductForm: React.FC = () => {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [talents, setTalents] = useState<TalentReference[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    talentName: '',
    accountName: ''
  });
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Ref for auto-focus
  const talentInputRef = useRef<HTMLSelectElement>(null);

  const fetchData = async () => {
    const [productsData, talentsData] = await Promise.all([
      getProducts(),
      getTalentReferences()
    ]);
    setProducts(productsData);
    setTalents(talentsData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getAccounts = (talentName: string) => {
    const t = talents.find(t => t.name === talentName);
    return t?.accounts || [];
  };

  const resetForm = () => {
    setFormData({ name: '', url: '', talentName: '', accountName: '' });
    setEditingId(null);
  };

  const handleEdit = (product: ProductData) => {
    setEditingId(product.id || null);
    setFormData({
      name: product.name,
      url: product.url || '',
      talentName: product.talentName || '',
      accountName: product.accountName || ''
    });
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => talentInputRef.current?.focus(), 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    
    let success;
    if (editingId) {
      success = await updateProduct(editingId, formData);
    } else {
      success = await addProduct(formData);
    }

    if (success) {
      setStatus('success');
      resetForm();
      fetchData();
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      await deleteProduct(id);
      fetchData();
      if (editingId === id) resetForm();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Input Form */}
      <div className={`rounded-xl shadow-lg border transition-all p-8 ${editingId ? 'bg-amber-900/10 border-amber-500/50' : 'bg-slate-900 border-slate-800'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold flex items-center gap-2 ${editingId ? 'text-amber-500' : 'text-slate-100'}`}>
            {editingId ? <Edit2 className="text-amber-500" /> : <Package className="text-amber-500" />} 
            {editingId ? 'Edit Data Produk' : 'Input Produk Baru'}
          </h2>
          {editingId && (
            <button 
              type="button"
              onClick={resetForm}
              className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 shadow-sm transition-colors"
            >
              <X size={14} /> Batal Edit
            </button>
          )}
        </div>
        
        {status === 'success' && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-800 text-green-400 rounded-lg flex items-center gap-2">
            <CheckCircle size={20} /> {editingId ? 'Produk berhasil diupdate!' : 'Produk berhasil ditambahkan!'}
          </div>
        )}
        {status === 'error' && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 text-red-400 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} /> Gagal menyimpan data.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Talent Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Nama Talent</label>
              <select
                ref={talentInputRef}
                required
                value={formData.talentName}
                onChange={e => setFormData({...formData, talentName: e.target.value, accountName: ''})}
                className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">Pilih Talent</option>
                {talents.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>

            {/* Account Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Nama Akun</label>
              <select
                required
                disabled={!formData.talentName}
                value={formData.accountName}
                onChange={e => setFormData({...formData, accountName: e.target.value})}
                className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-900 disabled:text-slate-600"
              >
                <option value="">Pilih Akun</option>
                {getAccounts(formData.talentName).map(acc => <option key={acc} value={acc}>{acc}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-1">Nama Produk</label>
              <input
                type="text"
                required
                placeholder="Contoh: Whitening Serum 30ml"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-1">Link Produk / URL (Opsional)</label>
              <input
                type="url"
                placeholder="https://shopee.co.id/..."
                value={formData.url}
                onChange={e => setFormData({...formData, url: e.target.value})}
                className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className={`w-full md:w-auto md:min-w-[200px] flex justify-center items-center gap-2 py-3 px-6 border border-transparent rounded-lg shadow-lg shadow-amber-900/20 text-sm font-bold text-white transition-colors ${editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-amber-600 hover:bg-amber-500'}`}
            >
              {editingId ? <Save size={18} /> : <Plus size={18} />}
              {editingId ? 'Update Produk' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </div>

      {/* Product List */}
      <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-slate-200">Daftar Produk Terdaftar (Koleksi: DATA PRODUK)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-300 font-medium">
              <tr>
                <th className="px-6 py-3">Nama Produk</th>
                <th className="px-6 py-3">Pemilik (Akun)</th>
                <th className="px-6 py-3">Link</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {products.map((product) => (
                <tr key={product.id} className={`transition-colors ${editingId === product.id ? 'bg-amber-900/10' : 'hover:bg-slate-800'}`}>
                  <td className="px-6 py-3 font-medium text-slate-200">
                    {product.name}
                    {editingId === product.id && <span className="ml-2 text-xs text-amber-500 border border-amber-500/50 px-1 rounded">Editing</span>}
                  </td>
                  <td className="px-6 py-3">
                    {product.talentName ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-300">{product.talentName}</span>
                        <span className="text-xs text-slate-500">{product.accountName || 'No Account'}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600 italic">Produk Umum (Global)</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {product.url ? (
                      <a href={product.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                        View <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right flex justify-end gap-2">
                    <button 
                      type="button"
                      onClick={() => handleEdit(product)}
                      className="text-slate-400 hover:text-amber-500 transition-colors p-1"
                      title="Edit Produk"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => product.id && handleDelete(product.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors p-1"
                      title="Hapus Produk"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-600">
                    Belum ada produk yang ditambahkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-800 bg-slate-950/30 text-right">
            <span className="text-sm text-slate-400">Total Produk: <span className="font-bold text-amber-500">{products.length}</span></span>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;