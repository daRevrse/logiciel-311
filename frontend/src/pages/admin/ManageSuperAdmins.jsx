import React, { useEffect, useState } from 'react';
import { Plus, Shield, Copy, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Card, Button, Spinner } from '../../components/common';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const ManageSuperAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '+228' });
  const [created, setCreated] = useState(null);
  const [reveal, setReveal] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminService.listSuperAdmins();
      setAdmins(res.data || []);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await adminService.createSuperAdmin(form);
      toast.success('Super admin créé');
      setCreated(res.data);
      setShowModal(false);
      setForm({ full_name: '', email: '', phone: '+228' });
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const copy = (v, l) => { navigator.clipboard.writeText(v); toast.success(`${l} copié`); };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super administrateurs</h1>
          <p className="text-gray-600 mt-2">Gérez les comptes super admin de la plateforme Muno.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />Nouveau super admin
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créé le</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.map((a) => (
                <tr key={a.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary-600" />
                      <span className="font-medium">{a.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{a.email}</td>
                  <td className="px-6 py-4 text-sm">{a.phone}</td>
                  <td className="px-6 py-4">
                    {a.is_active ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Actif</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Désactivé</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(a.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {admins.length === 0 && <div className="py-12 text-center text-gray-500">Aucun super administrateur</div>}
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nouveau super administrateur</h2>
            <form onSubmit={submit} className="space-y-4">
              <input type="text" required placeholder="Nom complet" className="input-field"
                value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              <input type="email" required placeholder="Email" className="input-field"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input type="tel" required placeholder="+228XXXXXXXX" className="input-field"
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)} fullWidth>Annuler</Button>
                <Button type="submit" variant="primary" fullWidth>Créer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {created && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Compte créé</h2>
            <p className="text-sm text-gray-600 mb-4">Communiquez ces identifiants — le mot de passe temporaire ne sera plus affiché.</p>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-500 uppercase text-xs mb-1">Email</div>
                <code className="bg-gray-100 px-3 py-2 rounded block">{created.user.email}</code>
              </div>
              <div>
                <div className="text-gray-500 uppercase text-xs mb-1">Mot de passe temporaire</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 px-3 py-2 rounded">{reveal ? created.temp_password : '••••••••'}</code>
                  <button onClick={() => setReveal(!reveal)}>{reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  <button onClick={() => copy(created.temp_password, 'Mot de passe')}><Copy className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="text-xs text-gray-500">Email {created.email_sent ? 'envoyé' : 'non envoyé'}.</div>
            </div>
            <div className="mt-6">
              <Button variant="primary" fullWidth onClick={() => { setCreated(null); setReveal(false); }}>J'ai bien noté</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSuperAdmins;
