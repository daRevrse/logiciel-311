import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Clock,
  Users,
  MapPin,
  Calendar,
  ThumbsUp,
  Target,
  Building2,
  Shield
} from 'lucide-react';
import adminService from '../../services/adminService';
import reportService from '../../services/reportService';
import { Card, Button, Spinner, StatusBadge } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * Tableau de bord administrateur
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // Calculer les dates en fonction de la période
      const filters = {};
      if (period !== 'all') {
        const now = new Date();
        const dateFrom = new Date();

        switch (period) {
          case '7d':
            dateFrom.setDate(now.getDate() - 7);
            break;
          case '30d':
            dateFrom.setDate(now.getDate() - 30);
            break;
          case '90d':
            dateFrom.setDate(now.getDate() - 90);
            break;
          case '1y':
            dateFrom.setFullYear(now.getFullYear() - 1);
            break;
        }

        filters.dateFrom = dateFrom.toISOString().split('T')[0];
        filters.dateTo = now.toISOString().split('T')[0];
      }

      const data = await adminService.getDashboard(filters);
      setDashboardData(data);

      // Charger les signalements récents
      const reportsData = await reportService.listReports({
        sortBy: 'created_at',
        sortOrder: 'DESC',
        limit: 5
      });
      setRecentReports(reportsData.reports || reportsData.data || []);

      // La vue super admin globale est sur /admin/system, plus de chargement cross-mairies ici.
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      toast.error('Impossible de charger le tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const periodOptions = [
    { value: 'all', label: 'Tout' },
    { value: '7d', label: '7 jours' },
    { value: '30d', label: '30 jours' },
    { value: '90d', label: '90 jours' },
    { value: '1y', label: '1 an' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const overview = dashboardData?.data?.overview || {};
  const reportsByStatus = overview.reportsByStatus || {};
  const reportsByCategory = dashboardData?.data?.reportsByCategory || [];
  const topSupported = dashboardData?.data?.topSupported || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            {/* <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
              <span className="w-8 h-[2px] bg-primary rounded-full"></span>
              {isSuperAdmin() ? 'Système Central' : 'Console Locale'}
            </div> */}
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 font-headline tracking-tight">
              Tableau de bord
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
              Suivez les signalements de votre secteur et coordonnez les interventions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800 flex gap-1">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPeriod(option.value)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 ${
                    period === option.value
                      ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            {isSuperAdmin() && (
              <Button
                variant="primary"
                onClick={() => navigate('/admin/system')}
                className="rounded-2xl shadow-lg shadow-primary/25 h-12 px-6"
              >
                <Shield className="h-4 w-4 mr-2" />
                Vue globale
              </Button>
            )}
          </div>
        </div>

        {/* Super Admin - Statistiques système (désactivé, maintenant sur /admin/system) */}
        {false && isSuperAdmin() && municipalities.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter mb-1">Municipalités</p>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
                    {municipalities.length}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Total enregistrées</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-emerald-600 uppercase tracking-tighter mb-1">Licences actives</p>
                  <p className="text-3xl font-extrabold text-emerald-600">
                    {municipalities.filter(m => m.license && m.license.is_active).length}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Services opérationnels</p>
                </div>
                <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-rose-600 uppercase tracking-tighter mb-1">Licences expirées</p>
                  <p className="text-3xl font-extrabold text-rose-600">
                    {municipalities.filter(m => {
                      if (!m.license) return false;
                      const expiresAt = new Date(m.license.expires_at);
                      return expiresAt < new Date();
                    }).length}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Action requise</p>
                </div>
                <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-rose-600" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-amber-600 uppercase tracking-tighter mb-1">Expirent bientôt</p>
                  <p className="text-3xl font-extrabold text-amber-600">
                    {municipalities.filter(m => {
                      if (!m.license || !m.license.is_active) return false;
                      const expiresAt = new Date(m.license.expires_at);
                      const now = new Date();
                      const daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
                      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
                    }).length}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Sous 30 jours</p>
                </div>
                <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KPI Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110">
                <AlertCircle className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-lg">TOTAL</span>
            </div>
            <p className="text-4xl font-extrabold text-slate-900 dark:text-slate-50 font-headline leading-none">
              {overview.totalReports || 0}
            </p>
            <p className="text-sm font-medium text-slate-400 mt-2 uppercase tracking-tighter">Signalements reçus</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center transition-transform group-hover:scale-110">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-xs font-bold bg-orange-50 text-orange-600 px-2 py-1 rounded-lg">ACTIFS</span>
            </div>
            <p className="text-4xl font-extrabold text-orange-600 font-headline leading-none">
              {(reportsByStatus.pending || 0) + (reportsByStatus.in_progress || 0)}
            </p>
            <p className="text-sm font-medium text-slate-400 mt-2 uppercase tracking-tighter">En cours de traitement</p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
               <div className="active-progress-bar bg-orange-500 h-full transition-all duration-1000" style={{ width: `${Math.min(100, (((reportsByStatus.pending || 0) + (reportsByStatus.in_progress || 0)) / (overview.totalReports || 1)) * 100)}%` }}></div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center transition-transform group-hover:scale-110">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">SUCCÈS</span>
            </div>
            <p className="text-4xl font-extrabold text-emerald-600 font-headline leading-none">
              {reportsByStatus.resolved || 0}
            </p>
            <p className="text-sm font-medium text-slate-400 mt-2 uppercase tracking-tighter">Problèmes résolus</p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
               <div className="resolved-progress-bar bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${Math.min(100, ((reportsByStatus.resolved || 0) / (overview.totalReports || 1)) * 100)}%` }}></div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-1">
               <div className="h-12 w-12 rounded-2xl bg-primary-50 flex items-center justify-center transition-transform group-hover:scale-110">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> +12%
                </span>
                <span className="text-[10px] font-bold text-slate-400">CE MOIS</span>
              </div>
            </div>
            <p className="text-4xl font-extrabold text-slate-900 dark:text-slate-50 font-headline leading-none mt-3">
              {dashboardData?.data?.recentActivityCount || 0}
            </p>
            <p className="text-sm font-medium text-slate-400 mt-2 uppercase tracking-tighter">Nouveaux signalements</p>
          </div>
        </div>

        {/* Charts and Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <Card className="border-none shadow-sm dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 font-headline">Répartition par statut</h2>
              <BarChart3 className="h-5 w-5 text-slate-400" />
            </div>
            <div className="space-y-5">
              {Object.entries(reportsByStatus).length > 0 ? (
                Object.entries(reportsByStatus).map(([status, count]) => {
                  const total = overview.totalReports || 1;
                  const percentage = ((count / total) * 100).toFixed(1);

                  return (
                    <div key={status} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={status} size="sm" />
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{percentage}%</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {count}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-1000 group-hover:brightness-110"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <AlertCircle className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm font-medium">Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="border-none shadow-sm dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 font-headline">Signalements par catégorie</h2>
              <Target className="h-5 w-5 text-slate-400" />
            </div>
            <div className="space-y-4">
              {reportsByCategory && reportsByCategory.length > 0 ? (
                reportsByCategory.slice(0, 6).map((item, index) => {
                  const count = parseInt(item.count || item.dataValues?.count || 0);
                  const categoryName = item.category?.name || item['category.name'] || 'Inconnu';

                  return (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                      <div className="flex items-center gap-4">
                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-bold group-hover:bg-primary group-hover:text-white transition-colors">
                          0{index + 1}
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{categoryName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{count}</span>
                        <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-primary/40 rounded-full" style={{ width: `${Math.min(100, (count / (overview.totalReports || 1)) * 200)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <AlertCircle className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm font-medium">Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Top signalements appuyés */}
        {topSupported && topSupported.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 font-headline">Impact Citoyen</h2>
                <p className="text-slate-500 text-sm">Signalements ayant reçu le plus de soutiens</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {topSupported.map((report, index) => {
                const supportsCount = parseInt(report.dataValues?.supports_count || report.supports_count || 0);

                return (
                  <div
                    key={report.id}
                    onClick={() => navigate(`/admin/reports/${report.id}`)}
                    className="flex items-center gap-5 p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="relative">
                       <div className="flex-shrink-0 w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-md">ID #{report.id}</span>
                        {report.category?.name && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {report.category.name}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate text-lg group-hover:text-primary transition-colors">
                        {report.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-2">
                         <div className="flex items-center gap-1 text-slate-400 text-xs">
                           <Calendar className="h-3 w-3" />
                           {formatDate(report.created_at)}
                         </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl group-hover:bg-primary/5 transition-colors">
                      <ThumbsUp className="h-5 w-5 text-primary mb-1" />
                      <span className="font-black text-slate-900 dark:text-slate-100 text-xl leading-none">{supportsCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Reports Section */}
        <div className="space-y-8 mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 font-headline tracking-tight">Signalements Récents</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Intervenez sur les derniers signalements déposés par les citoyens.</p>
            </div>
            <button 
              onClick={() => navigate('/admin/reports')}
              className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-sm hover:shadow-md transition-all flex items-center gap-2 text-slate-700 dark:text-slate-300"
            >
              Voir tout le catalogue <TrendingUp className="h-4 w-4 text-primary" />
            </button>
          </div>

          {recentReports.length === 0 ? (
            <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl p-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
              <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Aucun signalement récencé</h3>
              <p className="text-slate-400 max-w-sm mx-auto">Le flux est actuellement vide pour la période sélectionnée. Les nouveaux signalements apparaîtront ici.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => navigate(`/admin/reports/${report.id}`)}
                  className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 flex flex-col sm:flex-row gap-6 group transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 cursor-pointer border border-slate-100 dark:border-slate-800 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 transition-transform duration-500">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                      <Target className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="w-full sm:w-48 h-40 flex-shrink-0 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                    {report.photos && report.photos.length > 0 ? (
                      <img
                        src={report.photos[0].photo_url}
                        alt="Incident"
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-800">
                        <MapPin className="h-12 w-12 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg">
                      <StatusBadge status={report.status} size="sm" />
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">#{report.id}</span>
                        <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(report.created_at)}</span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-primary transition-colors font-headline tracking-tight">
                        {report.title}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-500 text-sm mt-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="truncate font-medium">{report.address || 'Localisation non spécifiée'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-black text-3xl font-headline leading-none tracking-tighter">
                            {report.supports_count || 0}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-900 dark:text-slate-200 uppercase leading-none tracking-tighter">Appuis</span>
                            <span className="text-[9px] font-bold text-emerald-500 uppercase leading-none mt-0.5">+5%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
                            <Clock className="h-5 w-5" />
                         </div>
                         <div className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm group-hover:bg-primary group-hover:text-white transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                            Détails
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
