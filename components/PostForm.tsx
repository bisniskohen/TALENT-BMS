import React, { useState, useEffect } from 'react';
import { addPost, getTalentReferences, getProducts, getRecentPosts, deletePost } from '../services/db';
import { TalentReference, ProductData, PostData } from '../types';
import { CheckCircle, AlertCircle, Package, Trash2, RotateCcw, ExternalLink, Share2 } from 'lucide-react';

const PostForm: React.FC = () => {
  const [talents, setTalents] = useState<TalentReference[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  
  // History State
  const [recentPosts, setRecentPosts] = useState<PostData[]>([]);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    talentName: '',
    accountName: '',
    platform: 'TikTok',
    link: '',
    productId: ''
  });
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const refreshHistory = async () => {
    const data = await getRecentPosts();
    setRecentPosts(data);
  };

  useEffect(() => {
    const fetchData = async () => {
      const [talentData, productData] = await Promise.all([
        getTalentReferences(),
        getProducts()
      ]);
      setTalents(talentData);
      setProducts(productData);
      refreshHistory();
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const selectedTalent = talents.find(t => t.name === formData.talentName);
  // Safe default to empty array
  const availableAccounts = selectedTalent?.accounts || [];

  // Filter products based on selected account
  const filteredProducts = formData.accountName 
    ? products.filter(p => p.accountName === formData.accountName || !p.accountName)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    
    // Find Product Name from ID
    const selectedProduct = products.find(p => p.id === formData.productId);
    
    const postPayload = {
      ...formData,
      productName: selectedProduct ? selectedProduct.name : 'Unknown'
    };

    // @ts-ignore
    const success = await addPost(postPayload);
    if (success) {
      setStatus('success');
      setFormData(prev => ({ ...prev, link: '', productId: '' }));
      refreshHistory();
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data postingan ini?")) {
      await deletePost(id);
      refreshHistory();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Input Form */}
      <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 p-8">
        <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
          <Share2 className="text-amber-500" />
          Input Konten Harian
        </h2>
        
        {status === 'success' && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-800 text-green-400 rounded-lg flex items-center gap-2">
            <CheckCircle size={20} /> Konten berhasil disimpan!
          </div>
        )}
        {status === 'error' && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 text-red-400 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} /> Gagal menyimpan konten.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Tanggal Post</label>
              <input
                type="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Platform</label>
              <select
                name="platform"
                required
                value={formData.platform}
                onChange={handleChange}
                className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="TikTok">TikTok</option>
                <option value="Instagram">Instagram</option>
                <option value="Shopee">Shopee Video</option>
                <option value="YouTube">YouTube</option>
                <option value="Other">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Nama Talent</label>
              <select
                name="talentName"
                required
                value={formData.talentName}
                onChange={(e) => {
                  setFormData({ ...formData, talentName: e.target.value, accountName: '', productId: '' });
                }}
                className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">Pilih Talent</option>
                {talents.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Nama Akun</label>
              <select
                name="accountName"
                required
                value={formData.accountName}
                onChange={handleChange}
                disabled={!formData.talentName}
                className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-900 disabled:text-slate-600"
              >
                <option value="">Pilih Akun</option>
                {availableAccounts.map(acc => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                <Package size={16} className="text-amber-500" /> Produk Dipromosikan
              </label>
              <select
                name="productId"
                required
                value={formData.productId}
                onChange={handleChange}
                disabled={!formData.accountName}
                className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-900 disabled:text-slate-600"
              >
                <option value="">-- Pilih Produk --</option>
                {filteredProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {!formData.accountName && (
                <p className="text-xs text-slate-500 mt-1">
                   Pilih akun terlebih dahulu untuk melihat produk.
                </p>
              )}
              {formData.accountName && filteredProducts.length === 0 && (
                <p className="text-xs text-amber-500 mt-1">
                  Tidak ada produk untuk akun ini. Silakan input di menu "Input Product".
                </p>
              )}
            </div>

            <div className="md:col-span-2">
               <label className="block text-sm font-medium text-slate-400 mb-1">Link Postingan / URL</label>
               <input
                type="url"
                name="link"
                required
                placeholder="https://..."
                value={formData.link}
                onChange={handleChange}
                className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg shadow-amber-900/20 text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
            >
              Simpan Konten
            </button>
          </div>
        </form>
      </div>

      {/* RECENT POSTS TABLE */}
      <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-200">Riwayat Input Konten</h3>
          <button type="button" onClick={refreshHistory} className="text-slate-500 hover:text-amber-500 transition-colors">
             <RotateCcw size={18} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-300 font-medium">
              <tr>
                <th className="px-6 py-3">Tanggal</th>
                <th className="px-6 py-3">Talent / Akun</th>
                <th className="px-6 py-3">Platform</th>
                <th className="px-6 py-3">Produk</th>
                <th className="px-6 py-3">Link</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recentPosts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-3">{post.date}</td>
                  <td className="px-6 py-3">
                    <div className="font-medium text-slate-200">{post.talentName}</div>
                    <div className="text-xs text-slate-500">{post.accountName}</div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1 rounded text-xs">{post.platform}</span>
                  </td>
                  <td className="px-6 py-3">{post.productName || '-'}</td>
                  <td className="px-6 py-3">
                    {post.link && (
                      <a href={post.link} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                        Link <ExternalLink size={12} />
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button 
                      type="button"
                      onClick={() => post.id && handleDelete(post.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors"
                      title="Hapus Postingan"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {recentPosts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-600">Belum ada data konten.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PostForm;