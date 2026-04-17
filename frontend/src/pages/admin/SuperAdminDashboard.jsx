import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, AlertCircle, Key, ShieldCheck, TrendingUp, Clock } from 'lucide-react';
import adminService from '../../services/adminService';
import { Spinner } from '../../components/common';
import toast from 'react-hot-toast';

const Kpi = ({ label, value, icon: Icon, tone = 'primary' }) => {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-700'
  };
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">{value ?? 0}</p>
        </div>
        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${tones[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getGlobalStats()
      .then((res) => setStats(res.data))
      .catch(() => toast.error('Impossible de charger les statistiques globales'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const s = stats || {};
  const mun = s.municipalities || {};
  const rep = s.reports || {};
  const lic = s.licenses || {};
  const byStatus = rep.byStatus || {};
  const usersByRole = s.users?.byRole || {};

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-amber-600 font-black text-xs uppercase tracking-[0.2em] mb-2">
          <ShieldCheck className="h-4 w-4" /> Vue Globale Système
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Supervision multi-mairies
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Indicateurs consolidés sur l'ensemble des mairies utilisant la plateforme.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <Kpi label="Mairies actives" value={`${mun.active || 0}/${mun.total || 0}`} icon={Building2} tone="primary" />
        <Kpi label="Signalements total" value={rep.total} icon={AlertCircle} tone="slate" />
        <Kpi label="Licences actives" value={lic.active} icon={Key} tone="emerald" />
        <Kpi label="Licences < 30j" value={lic.expiringSoon} icon={Clock} tone="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4">Signalements par statut</h2>
          <div className="space-y-3">
            {Object.entries(byStatus).length === 0 && (
              <p className="text-sm text-slate-400">Aucune donnée.</p>
            )}
            {Object.entries(byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-widest text-slate-500">{status}</span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4">Utilisateurs par rôle</h2>
          <div className="space-y-3">
            {Object.entries(usersByRole).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-bold uppercase tracking-widest text-slate-500">{role}</span>
                </div>
                <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Top mairies par volume</h2>
          <button
            onClick={() => navigate('/admin/municipalities')}
            className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
          >
            Voir toutes <TrendingUp className="h-4 w-4" />
          </button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {(s.topMunicipalities || []).length === 0 && (
            <p className="text-sm text-slate-400 py-4">Aucune mairie.</p>
          )}
          {(s.topMunicipalities || []).map((m, i) => (
            <div key={m.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-bold">
                  0{i + 1}
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{m.name}</span>
              </div>
              <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{m.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
