import React, { useState, useEffect } from 'react';
import { Plus, Edit, Power, KeyRound, Users, Shield, Check, Copy, Mail, UserRound } from 'lucide-react';
import { Card, Button, Spinner, Modal } from '../../components/common';
import adminService from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const roleBadge = (role) => {
  if (role === 'super_admin') return { label: 'Super admin', cls: 'bg-amber-100 text-amber-800' };
  return { label: 'Administrateur', cls: 'bg-turquoise/15 text-turquoise-dark' };
};

function formatLastLogin(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ManageUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: '', full_name: '' });
  const [createError, setCreateError] = useState(null);

  const [editing, setEditing] = useState(null); // { id, full_name, is_active }
  const [savingEdit, setSavingEdit] = useState(false);

  const [credResult, setCredResult] = useState(null); // { name, temp_password, mail_warning }
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({ role: 'admin' });
      // Page Administrateurs : uniquement les admins de la mairie (jamais les super_admins de la plateforme)
      setUsers((res.data || []).filter((u) => u.role === 'admin'));
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      toast.error('Impossible de charger les administrateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError(null);
    if (!form.email.trim() || !form.full_name.trim()) {
      setCreateError('Email et nom complet requis.');
      return;
    }
    setCreating(true);
    try {
      const res = await adminService.createUser({ email: form.email.trim(), full_name: form.full_name.trim() });
      const data = res?.data || res;
      setCreateOpen(false);
      setForm({ email: '', full_name: '' });
      if (res?.temp_password) {
        setCredResult({ name: data.full_name, temp_password: res.temp_password, mail_warning: res.mail_warning });
        setCopied(false);
      } else {
        toast.success('Administrateur créé — invitation envoyée');
      }
      loadUsers();
    } catch (error) {
      setCreateError(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      await adminService.updateUser(editing.id, { full_name: editing.full_name });
      toast.success('Administrateur mis à jour');
      setEditing(null);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleActive = async (u) => {
    const isActive = u.is_active !== false;
    if (isActive && !confirm(`Désactiver l'accès de ${u.full_name} ?`)) return;
    setBusyId(u.id);
    try {
      await adminService.setUserActive(u.id, !isActive);
      toast.success(isActive ? 'Compte désactivé' : 'Compte réactivé');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  const handleResetPassword = async (u) => {
    if (!confirm(`Réinitialiser le mot de passe de ${u.full_name} ?`)) return;
    setBusyId(u.id);
    try {
      const res = await adminService.resetUserPassword(u.id);
      if (res?.temp_password) {
        setCredResult({ name: u.full_name, temp_password: res.temp_password, mail_warning: res.mail_warning });
        setCopied(false);
      } else {
        toast.success("Mot de passe réinitialisé — email envoyé");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  const copyTemp = async () => {
    try { await navigator.clipboard.writeText(credResult.temp_password); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* noop */ }
  };

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active !== false).length,
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size="lg" className="text-turquoise" /></div>;
  }

  const ActionButtons = ({ u, compact }) => {
    const isActive = u.is_active !== false;
    const isSelf = currentUser?.id === u.id;
    return (
      <div className={`flex items-center ${compact ? 'gap-2' : 'justify-end gap-1'}`}>
        <button onClick={() => setEditing({ id: u.id, full_name: u.full_name, is_active: isActive })} title="Modifier"
          className="p-2 rounded-lg text-slate-500 hover:text-turquoise-dark hover:bg-slate-100"><Edit className="h-4 w-4" /></button>
        <button onClick={() => handleResetPassword(u)} disabled={busyId === u.id} title="Réinitialiser le mot de passe"
          className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 disabled:opacity-50"><KeyRound className="h-4 w-4" /></button>
        {!isSelf && (
          <button onClick={() => handleToggleActive(u)} disabled={busyId === u.id} title={isActive ? 'Désactiver' : 'Réactiver'}
            className={`p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 ${isActive ? 'text-slate-500 hover:text-red-600' : 'text-emerald-600'}`}><Power className="h-4 w-4" /></button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-deep tracking-tight">Administrateurs</h1>
          <p className="text-slate-500 text-sm mt-0.5">Comptes de gestion de votre mairie.</p>
        </div>
        <button onClick={() => { setForm({ email: '', full_name: '' }); setCreateError(null); setCreateOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-turquoise text-navy-deep text-sm font-bold hover:bg-turquoise/90">
          <Plus className="h-4 w-4" /> Nouvel administrateur
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 max-w-md">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-navy-deep/10 flex items-center justify-center"><Shield className="h-5 w-5 text-navy-deep" /></div>
          <div><p className="text-2xl font-extrabold text-navy-deep leading-none">{stats.total}</p><p className="text-xs text-slate-400 font-semibold uppercase mt-1">Administrateurs</p></div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center"><Check className="h-5 w-5 text-emerald-600" /></div>
          <div><p className="text-2xl font-extrabold text-navy-deep leading-none">{stats.active}</p><p className="text-xs text-slate-400 font-semibold uppercase mt-1">Actifs</p></div>
        </div>
      </div>

      {/* Liste */}
      {users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Users className="h-10 w-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">Aucun administrateur.</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <Card className="border border-slate-100 shadow-sm p-0 overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Administrateur</th>
                    <th className="px-5 py-3 font-semibold">Rôle</th>
                    <th className="px-5 py-3 font-semibold">Dernière connexion</th>
                    <th className="px-5 py-3 font-semibold">Statut</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const rb = roleBadge(u.role);
                    const lastLogin = formatLastLogin(u.last_login);
                    return (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-navy-deep text-turquoise flex items-center justify-center font-bold">
                              {u.full_name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div>
                              <div className="font-bold text-navy-deep">{u.full_name}</div>
                              <div className="text-xs text-slate-400">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3"><span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${rb.cls}`}>{rb.label}</span></td>
                        <td className="px-5 py-3 text-slate-600">{lastLogin || <span className="text-amber-600 text-xs font-medium">Jamais connecté</span>}</td>
                        <td className="px-5 py-3">
                          {u.is_active !== false
                            ? <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">Actif</span>
                            : <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-slate-200 text-slate-600">Désactivé</span>}
                        </td>
                        <td className="px-5 py-3"><ActionButtons u={u} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {users.map((u) => {
              const rb = roleBadge(u.role);
              const lastLogin = formatLastLogin(u.last_login);
              return (
                <div key={u.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-navy-deep truncate">{u.full_name}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${rb.cls}`}>{rb.label}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Dernière connexion : {lastLogin || <span className="text-amber-600 font-medium">jamais</span>}</p>
                  <div className="mt-3 pt-3 border-t border-slate-100"><ActionButtons u={u} compact /></div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal création */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Nouvel administrateur">
        <form onSubmit={handleCreate} className="space-y-4">
          <p className="text-sm text-slate-500">Un mot de passe temporaire sera généré et envoyé par email. L'administrateur le changera à sa première connexion.</p>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nom complet</label>
            <div className="relative">
              <UserRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-turquoise/30 focus:border-turquoise outline-none" placeholder="Jean Dupont" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-turquoise/30 focus:border-turquoise outline-none" placeholder="admin@mairie.tg" />
            </div>
          </div>
          {createError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{createError}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)} fullWidth>Annuler</Button>
            <Button type="submit" variant="primary" fullWidth loading={creating}>Créer</Button>
          </div>
        </form>
      </Modal>

      {/* Modal édition */}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Modifier l'administrateur">
        {editing && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nom complet</label>
              <input required value={editing.full_name} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-turquoise/30 focus:border-turquoise outline-none" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)} fullWidth>Annuler</Button>
              <Button type="submit" variant="primary" fullWidth loading={savingEdit}>Enregistrer</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal mot de passe temporaire */}
      <Modal isOpen={!!credResult} onClose={() => setCredResult(null)} title="Mot de passe temporaire">
        {credResult && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Transmettez ce mot de passe à <strong className="text-navy-deep">{credResult.name}</strong> — il ne sera plus affiché.
            </p>
            {credResult.mail_warning && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">{credResult.mail_warning}</p>}
            <div className="flex items-center gap-2">
              <input readOnly value={credResult.temp_password} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono text-sm" />
              <button onClick={copyTemp} className="px-3 py-2 rounded-lg bg-turquoise text-navy-deep flex items-center gap-2 text-sm font-semibold hover:bg-turquoise/90">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setCredResult(null)} className="px-4 py-2 rounded-lg bg-navy-deep text-white text-sm font-semibold hover:bg-navy-deep/90">Fermer</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageUsers;
