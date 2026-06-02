import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ThumbsUp, ArrowRight, RotateCcw } from 'lucide-react';
import { StatusBadge, Spinner, Select } from '../../components/common';
import reportService from '../../services/reportService';
import { resolveImageUrl } from '../../utils/url';
import { formatShortDate, reportDate } from '../../utils/date';
import toast from 'react-hot-toast';

const STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'assigned', label: 'Assigné' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminé' },
  { value: 'resolved', label: 'Résolu' },
  { value: 'rejected', label: 'Rejeté' },
];

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Plus récents' },
  { value: 'priority_score', label: 'Priorité' },
  { value: 'supports_count', label: "Appuis" },
  { value: 'updated_at', label: 'Mise à jour' },
];

const supportsOf = (r) => parseInt(r.supportsCount ?? r.supports_count ?? 0, 10) || 0;

const DEFAULTS = { status: '', categoryId: '', search: '', sortBy: 'created_at', sortOrder: 'DESC', page: 1, limit: 20 };

const ManageReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalReports: 0, limit: 20 });
  const [filters, setFilters] = useState(DEFAULTS);
  const [searchInput, setSearchInput] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    reportService.getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : (data?.data || data?.categories || [])))
      .catch((err) => console.error('Erreur chargement catégories:', err));
  }, []);

  const load = async (next) => {
    const merged = { ...filters, ...next };
    setFilters(merged);
    setLoading(true);
    try {
      const data = await reportService.listReports(merged);
      setReports(data.reports || data.data || []);
      const p = data.pagination;
      if (p) {
        setPagination({
          currentPage: p.page ?? p.currentPage ?? 1,
          totalPages: p.totalPages ?? 1,
          totalReports: p.total ?? p.totalReports ?? 0,
          limit: p.limit ?? 20,
        });
      }
    } catch (err) {
      console.error('Erreur chargement signalements:', err);
      toast.error('Impossible de charger les signalements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryOptions = [
    { value: '', label: 'Toutes les catégories' },
    ...categories.map((c) => ({ value: c.id.toString(), label: c.name })),
  ];

  const reset = () => { setSearchInput(''); load({ ...DEFAULTS }); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-deep tracking-tight">Signalements</h1>
          <p className="text-slate-500 text-sm mt-0.5">{pagination.totalReports} signalement{pagination.totalReports > 1 ? 's' : ''} au total</p>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load({ search: searchInput, page: 1 })}
              placeholder="Rechercher (titre, description, adresse)…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-turquoise/30 focus:border-turquoise outline-none"
            />
          </div>
          <div className="flex gap-2">
            <div className="w-44">
              <Select value={filters.categoryId} onChange={(e) => load({ categoryId: e.target.value, page: 1 })} options={categoryOptions} />
            </div>
            <div className="w-40">
              <Select value={filters.sortBy} onChange={(e) => load({ sortBy: e.target.value, page: 1 })} options={SORT_OPTIONS} />
            </div>
            <button onClick={reset} title="Réinitialiser" className="px-3 rounded-xl border border-slate-200 text-slate-500 hover:text-navy-deep hover:border-turquoise transition-colors">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Chips statut */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => load({ status: f.value, page: 1 })}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                filters.status === f.value ? 'bg-navy-deep text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-turquoise" /></div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200 text-slate-500">
          Aucun signalement ne correspond à ces critères.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              onClick={() => navigate(`/admin/reports/${report.id}`)}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-4 hover:border-turquoise hover:shadow-md transition-all cursor-pointer"
            >
              {report.photos?.length > 0 ? (
                <img src={resolveImageUrl(report.photos[0].photo_url)} alt="" className="w-24 h-24 object-cover rounded-xl flex-shrink-0" />
              ) : (
                <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-8 w-8 text-slate-300" />
                </div>
              )}

              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold text-turquoise uppercase tracking-wide bg-turquoise/10 px-2 py-0.5 rounded">
                      {report.category?.name || 'Général'}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">{formatShortDate(reportDate(report))}</span>
                  </div>
                  <StatusBadge status={report.status} size="sm" />
                </div>
                <h3 className="font-bold text-navy-deep leading-tight truncate">{report.title}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1 truncate">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-turquoise" />
                  <span className="truncate">{report.address}</span>
                </p>
                <div className="mt-auto pt-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-navy-deep">
                    <ThumbsUp className="h-4 w-4 text-turquoise" /> {supportsOf(report)} <span className="text-slate-400 font-medium text-xs">appuis</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-turquoise-dark">
                    Traiter <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-sm p-3">
          <button
            onClick={() => load({ page: pagination.currentPage - 1 })}
            disabled={pagination.currentPage === 1}
            className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-600 text-sm disabled:opacity-40 hover:bg-slate-200 transition-colors"
          >
            Précédent
          </button>
          <span className="text-sm text-slate-500">Page {pagination.currentPage} / {pagination.totalPages}</span>
          <button
            onClick={() => load({ page: pagination.currentPage + 1 })}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-4 py-2 rounded-xl bg-navy-deep font-semibold text-white text-sm disabled:opacity-40 hover:bg-navy-deep/90 transition-colors"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageReports;
