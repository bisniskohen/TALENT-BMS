import React, { useState, useEffect } from 'react';
import { addTalentReference, getTalentReferences, deleteTalentReference, updateTalentReference } from '../services/db';
import { TalentReference } from '../types';
import { Trash2, Plus, Users, Edit2, X, CheckCircle, Save } from 'lucide-react';

const TalentSettings: React.FC = () => {
  const [talents, setTalents] = useState<TalentReference[]>([]);
  const [newName, setNewName] = useState('');
  const [newAccount, setNewAccount] = useState('');
  const [accounts, setAccounts] = useState<string[]>([]);
  
  // Edit Mode State
  const [editingId, setEditingId] = useState<string | null>(null);

  const refreshList = async () => {
    try {
      const data = await getTalentReferences();
      setTalents(data);
    } catch (error) {
      console.error("Failed to load talents", error);
    }
  };

  useEffect(() => {
    refreshList();
  }, []);

  const handleAddAccount = () => {
    if (newAccount.trim()) {
      setAccounts([...accounts, newAccount.trim()]);
      setNewAccount('');
    }
  };

  const removeAccount = (indexToRemove: number) => {
    setAccounts(accounts.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async () => {
    if (newName.trim()) { // Removed accounts.length > 0 requirement to allow saving name first
      if (editingId) {
        // Update existing
        await updateTalentReference(editingId, newName.trim(), accounts);
      } else {
        // Create new
        await addTalentReference(newName.trim(), accounts);
      }
      resetForm();
      refreshList();
    }
  };

  const handleEdit = (talent: TalentReference) => {
    if (talent.id) {
      setEditingId(talent.id);
      setNewName(talent.name);
      // Safe spread with default ensures no crash if accounts is undefined
      setAccounts([...(talent.accounts || [])]);
      // Scroll to top to see form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setNewName('');
    setAccounts([]);
    setNewAccount('');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data talent ini? Data yang dihapus tidak bisa dikembalikan.")) {
      await deleteTalentReference(id);
      refreshList();
      if (editingId === id) {
        resetForm();
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Form Section */}
      <div className={`p-6 rounded-xl shadow-lg border transition-all ${editingId ? 'bg-amber-900/10 border-amber-500/50' : 'bg-slate-900 border-slate-800'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold flex items-center gap-2 ${editingId ? 'text-amber-500' : 'text-slate-100'}`}>
            {editingId ? <Edit2 size={20} /> : <Users size={20} className="text-amber-500" />} 
            {editingId ? 'Edit Data Talent' : 'Management Talent & Akun'}
          </h2>
          {editingId && (
            <button 
              onClick={resetForm}
              className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 shadow-sm transition-colors"
            >
              <X size={14} /> Batal Edit
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Nama Talent</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-600"
              placeholder="Contoh: Nama Lengkap"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Username Akun</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAccount}
                onChange={e => setNewAccount(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border-slate-700 border text-white p-2.5 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-600"
                placeholder="@username_akun"
                onKeyDown={e => e.key === 'Enter' && handleAddAccount()}
              />
              <button 
                onClick={handleAddAccount}
                type="button"
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        {accounts.length > 0 && (
          <div className="mb-6 p-3 bg-slate-950/50 rounded-lg border border-slate-800">
            <label className="block text-sm font-medium text-slate-400 mb-2">Daftar Akun Terdaftar:</label>
            <div className="flex flex-wrap gap-2">
              {accounts.map((acc, idx) => (
                <span key={idx} className="bg-amber-900/20 text-amber-500 border border-amber-900/50 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                  {acc}
                  <button 
                    onClick={() => removeAccount(idx)}
                    className="hover:text-red-400 rounded-full p-0.5"
                    title="Hapus akun ini"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!newName}
          className={`w-full py-3 rounded-lg text-white font-bold transition-all flex justify-center items-center gap-2 shadow-lg shadow-amber-900/20 ${
            editingId 
              ? 'bg-amber-600 hover:bg-amber-500' 
              : 'bg-amber-600 hover:bg-amber-500'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {editingId ? <Save size={18} /> : <Plus size={18} />}
          {editingId ? 'Update Data Talent' : 'Simpan Talent'}
        </button>
      </div>

      {/* List Section */}
      <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800">
        <h2 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">Daftar Talent (Koleksi: NAMA TALENT)</h2>
        <div className="grid grid-cols-1 gap-4">
          {talents.map(t => (
            <div 
              key={t.id} 
              className={`border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all group ${
                editingId === t.id ? 'border-amber-500 bg-amber-900/10' : 'border-slate-800 hover:border-slate-600 hover:bg-slate-800/50'
              }`}
            >
              <div>
                <h3 className="font-bold text-slate-200 text-lg flex items-center gap-2">
                  {t.name}
                  {editingId === t.id && <span className="text-xs bg-amber-900/50 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded-full">Editing</span>}
                </h3>
                <div className="mt-2 flex flex-wrap gap-1">
                  {/* Safe map with fallback */}
                  {(t.accounts || []).map((acc, i) => (
                    <span key={i} className="text-xs bg-slate-950 text-slate-400 px-2 py-1 rounded border border-slate-800">
                      {acc}
                    </span>
                  ))}
                  {(!t.accounts || t.accounts.length === 0) && (
                    <span className="text-xs text-red-400 italic bg-red-900/20 px-2 py-1 rounded border border-red-900/30">Belum ada akun linked</span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(t)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors shadow-sm"
                >
                  <Edit2 size={16} /> Edit
                </button>
                <button 
                  onClick={() => t.id && handleDelete(t.id)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-red-400 bg-slate-800 hover:bg-red-900/30 rounded-lg border border-slate-700 hover:border-red-900/50 transition-colors shadow-sm"
                >
                  <Trash2 size={16} /> Hapus
                </button>
              </div>
            </div>
          ))}
          {talents.length === 0 && (
            <div className="text-center py-12 text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
              <Users size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">Belum ada data talent di koleksi "NAMA TALENT".</p>
              <p className="text-sm mt-1">Tambahkan talent pertama Anda pada form di atas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TalentSettings;