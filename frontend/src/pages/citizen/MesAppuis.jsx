import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThumbsUp, MapPin } from 'lucide-react';
import { StatusBadge, Spinner, HeroBackground, ImageWithFallback } from '../../components/common';
import { IMAGES } from '../../config/images';
import { formatShortDate, reportDate } from '../../utils/date';
import supportService from '../../services/supportService';
import toast from 'react-hot-toast';

/**
 * Mes appuis — signalements que le citoyen a soutenus.
 */
const MesAppuis = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await supportService.getMySupportedReports(1, 50);
        const supports = res.data?.supports || res.supports || [];
        // On ne garde que les appuis dont le signalement est encore disponible
        setItems(supports.filter((s) => s.report));
      } catch (err) {
        console.error('Erreur chargement appuis:', err);
        toast.error('Impossible de charger vos appuis');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      {/* En-tête */}
      <div className="relative overflow-hidden bg-navy-deep text-white">
        <HeroBackground image={IMAGES.heroCommunity} opacity={0.25} />
        <div className="relative z-10 max-w-2xl mx-auto px-4 pt-8 pb-16">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Mes appuis</h1>
          <p className="text-white/60 text-sm mt-1">
            {items.length} signalement{items.length > 1 ? 's' : ''} que vous soutenez
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-8 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-gray-500">Chargement…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <ImageWithFallback
              src={IMAGES.emptyReports}
              alt=""
              className="w-36 h-36 rounded-3xl mx-auto mb-5 shadow-lg"
            >
              <ThumbsUp className="h-10 w-10 text-white/70" />
            </ImageWithFallback>
            <p className="text-navy-deep font-bold">Aucun appui pour le moment</p>
            <p className="text-gray-500 text-sm mt-1 mb-5">
              Soutenez les signalements qui comptent pour vous depuis l'accueil.
            </p>
            <button
              onClick={() => navigate('/home')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-turquoise text-navy-deep font-bold rounded-xl active:scale-95 transition-transform"
            >
              Découvrir les signalements
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((s) => {
              const report = s.report;
              return (
                <button
                  key={s.report_id || report.id}
                  onClick={() => navigate(`/reports/${report.id}`)}
                  className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-transform relative overflow-hidden"
                >
                  <div
                    className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                      report.status === 'resolved'
                        ? 'bg-emerald-500'
                        : report.status === 'completed'
                        ? 'bg-cyan-500'
                        : report.status === 'in_progress'
                        ? 'bg-amber-500'
                        : report.status === 'assigned'
                        ? 'bg-blue-500'
                        : 'bg-slate-300'
                    }`}
                  />
                  <div className="flex items-start justify-between gap-3 pl-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-turquoise bg-turquoise/10 px-2 py-0.5 rounded">
                          {report.category?.name || 'Général'}
                        </span>
                        <span className="text-[10px] font-medium text-gray-400">
                          {formatShortDate(reportDate(report))}
                        </span>
                      </div>
                      <h3 className="font-bold text-navy-deep leading-snug truncate">{report.title}</h3>
                      <div className="flex items-center gap-1.5 mt-1.5 text-gray-500">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="text-xs truncate">{report.address}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <StatusBadge status={report.status} />
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-turquoise bg-turquoise/10 px-2 py-1 rounded">
                        <ThumbsUp className="h-3 w-3" /> Appuyé
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MesAppuis;
