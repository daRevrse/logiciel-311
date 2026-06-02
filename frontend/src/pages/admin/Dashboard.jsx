import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, TrendingUp, AlertCircle, CheckCircle2, Clock,
  MapPin, Calendar, ThumbsUp, Target, ArrowRight
} from 'lucide-react';
import adminService from '../../services/adminService';
import reportService from '../../services/reportService';
import { Card, Spinner, StatusBadge } from '../../components/common';
import { resolveImageUrl } from '../../utils/url';
import { formatShortDate, reportDate } from '../../utils/date';
import toast from 'react-hot-toast';

const PERIODS = [
  { value: 'all', label: 'Tout' },
  { value: '7d', label: '7 j' },
  { value: '30d', label: '30 j' },
  { value: '90d', label: '90 j' },
  { value: '1y', label: '1 an' },
];

const supportsOf = (r) => parseInt(r.supportsCount ?? r.supports_count ?? r.dataValues?.supports_count ?? 0, 10) || 0;

const Dashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (period !== 'all') {
        const now = new Date();
        const dateFrom = new Date();
        if (period === '7d') dateFrom.setDate(now.getDate() - 7);
        else if (period === '30d') dateFrom.setDate(now.getDate() - 30);
        else if (period === '90d') dateFrom.setDate(now.getDate() - 90);
        else if (period === '1y') dateFrom.setFullYear(now.getFullYear() - 1);
        filters.dateFrom = dateFrom.toISOString().split('T')[0];
        filters.dateTo = now.toISOString().split('T')[0];
      }

      const data = await adminService.getDashboard(filters);
      setDashboardData(data);

      const reportsData = await reportService.listReports({ sortBy: 'created_at', sortOrder: 'DESC', limit: 6 });
      setRecentReports(reportsData.reports || reportsData.data || []);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      toast.error('Impossible de charger le tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" className="text-turquoise" />
      </div>
    );
  }

  const overview = dashboardData?.data?.overview || {};
  const reportsByStatus = overview.reportsByStatus || {};
  const reportsByCategory = dashboardData?.data?.reportsByCategory || [];
  const topSupported = dashboardData?.data?.topSupported || [];
  const total = overview.totalReports || 0;
  const active = (reportsByStatus.pending || 0) + (reportsByStatus.in_progress || 0);

  const kpis = [
    { label: 'Signalements reçus', value: total, icon: AlertCircle, color: 'text-turquoise', bg: 'bg-turquoise/10' },
    { label: 'En cours de traitement', value: active, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Problèmes résolus', value: reportsByStatus.resolved || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Nouveaux (récents)', value: dashboardData?.data?.recentActivityCount || 0, icon: TrendingUp, color: 'text-navy-deep', bg: 'bg-navy-deep/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-deep tracking-tight">Tableau de bord</h1>
          <p className="text-slate-500 mt-1">Suivez les signalements et coordonnez les interventions.</p>
        </div>
        <div className="bg-white p-1 rounded-xl border border-slate-200 flex gap-1 self-start">
          {PERIODS.map((o) => (
            <button
              key={o.value}
              onClick={() => setPeriod(o.value)}
              className={`px-3 py-1.5 rounded-lg font-bold text-sm transition-all ${
                period === o.value ? 'bg-navy-deep text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className={`h-11 w-11 rounded-xl ${k.bg} flex items-center justify-center mb-4`}>
              <k.icon className={`h-5 w-5 ${k.color}`} />
            </div>
            <p className="text-3xl font-extrabold text-navy-deep leading-none">{k.value}</p>
            <p className="text-xs font-semibold text-slate-400 mt-2 uppercase tracking-wide">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Répartitions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-navy-deep">Répartition par statut</h2>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {Object.entries(reportsByStatus).length > 0 ? (
              Object.entries(reportsByStatus).map(([status, count]) => {
                const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <StatusBadge status={status} size="sm" />
                      <span className="text-sm font-bold text-navy-deep">{count} <span className="text-slate-400 font-medium">· {pct}%</span></span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-turquoise h-full rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-400 py-8 text-center">Aucune donnée disponible</p>
            )}
          </div>
        </Card>

        <Card className="border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-navy-deep">Signalements par catégorie</h2>
            <Target className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-1">
            {reportsByCategory && reportsByCategory.length > 0 ? (
              reportsByCategory.slice(0, 6).map((item, index) => {
                const count = parseInt(item.count || item.dataValues?.count || 0, 10);
                const name = item.category?.name || item['category.name'] || 'Inconnu';
                return (
                  <div key={index} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">{index + 1}</span>
                      <span className="font-semibold text-slate-700">{name}</span>
                    </div>
                    <span className="text-base font-extrabold text-navy-deep">{count}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-400 py-8 text-center">Aucune donnée disponible</p>
            )}
          </div>
        </Card>
      </div>

      {/* Top appuyés */}
      {topSupported && topSupported.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-navy-deep mb-4">Impact citoyen <span className="text-sm font-normal text-slate-400">· les plus appuyés</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topSupported.slice(0, 4).map((report, index) => (
              <div
                key={report.id}
                onClick={() => navigate(`/admin/reports/${report.id}`)}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-turquoise transition-all cursor-pointer"
              >
                <div className="w-11 h-11 bg-navy-deep text-turquoise rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-navy-deep truncate">{report.title}</h3>
                  <p className="text-xs text-slate-400">{report.category?.name || 'Général'} · {formatShortDate(reportDate(report))}</p>
                </div>
                <div className="flex items-center gap-1 text-turquoise font-bold flex-shrink-0">
                  <ThumbsUp className="h-4 w-4" />
                  {supportsOf(report)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signalements récents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-navy-deep">Signalements récents</h2>
          <button
            onClick={() => navigate('/admin/reports')}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-turquoise-dark hover:underline"
          >
            Tout voir <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {recentReports.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
            <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Aucun signalement sur la période.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recentReports.map((report) => (
              <div
                key={report.id}
                onClick={() => navigate(`/admin/reports/${report.id}`)}
                className="bg-white rounded-2xl p-4 flex gap-4 border border-slate-100 shadow-sm hover:border-turquoise hover:shadow-md transition-all cursor-pointer"
              >
                <div className="w-28 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 relative">
                  {report.photos && report.photos.length > 0 ? (
                    <img src={resolveImageUrl(report.photos[0].photo_url)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="h-8 w-8 text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={report.status} size="sm" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{formatShortDate(reportDate(report))}</span>
                  </div>
                  <h3 className="font-bold text-navy-deep truncate">{report.title}</h3>
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-turquoise" />
                    <span className="truncate">{report.address || 'Localisation non spécifiée'}</span>
                  </div>
                  <div className="mt-auto pt-2 flex items-center gap-1 text-turquoise text-sm font-bold">
                    <ThumbsUp className="h-3.5 w-3.5" /> {supportsOf(report)} appuis
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
