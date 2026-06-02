import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff, Check, CheckCheck, Loader2, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from '../../components/common';
import { IMAGES } from '../../config/images';
import notificationService from '../../services/notificationService';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import toast from 'react-hot-toast';

const TYPE_META = {
  status_change: { label: 'Statut', dot: 'bg-blue-500' },
  new_support:   { label: 'Appui', dot: 'bg-emerald-500' },
  resolution:    { label: 'Résolution', dot: 'bg-emerald-600' },
  system:        { label: 'Système', dot: 'bg-amber-500' }
};

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [marking, setMarking] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await notificationService.list({ unreadOnly: filter === 'unread', limit: 50 });
      const payload = res?.data ?? res;
      const list = payload?.notifications || payload || [];
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Impossible de charger les notifications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);

  // Realtime : ajoute en tête lors d'un événement notification:new
  useRealtimeNotifications({
    'notification:new': () => load()
  });

  async function markOne(id) {
    try {
      await notificationService.markRead(id);
      setItems((prev) => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* noop */ }
  }

  async function markAll() {
    if (marking) return;
    setMarking(true);
    try {
      await notificationService.markAllRead();
      setItems((prev) => prev.map(n => ({ ...n, is_read: true })));
      toast.success('Tout marqué comme lu');
    } catch (err) {
      toast.error('Erreur');
    } finally {
      setMarking(false);
    }
  }

  const unreadCount = items.filter(n => !n.is_read).length;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-deep flex items-center gap-2">
            <Bell className="w-6 h-6 text-turquoise" />
            Notifications
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAll}
            disabled={marking}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Tout marquer lu
          </button>
        )}
      </header>

      <div className="flex gap-1 mb-4">
        {[
          { key: 'all', label: 'Toutes' },
          { key: 'unread', label: 'Non lues' }
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f.key
                ? 'bg-navy-deep text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-card border border-slate-100">
          <ImageWithFallback
            src={IMAGES.emptyNotifications}
            alt=""
            className="w-36 h-36 rounded-3xl mx-auto mb-5 shadow-md"
          >
            <BellOff className="w-10 h-10 text-white/70" />
          </ImageWithFallback>
          <p className="text-sm text-slate-500">
            {filter === 'unread' ? 'Aucune notification non lue.' : 'Aucune notification.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const meta = TYPE_META[n.type] || TYPE_META.system;
            return (
              <li
                key={n.id}
                className={`flex items-start gap-3 p-3.5 rounded-lg border transition-colors ${
                  n.is_read
                    ? 'bg-white border-slate-100'
                    : 'bg-turquoise/5 border-turquoise/20'
                }`}
              >
                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{meta.label}</span>
                    {!n.is_read && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-turquoise">Nouveau</span>
                    )}
                    <span className="text-xs text-slate-400 ml-auto">{formatDate(n.created_at)}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{n.title}</p>
                  <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                  {n.report_id && (
                    <Link
                      to={`/reports/${n.report_id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-navy-deep hover:text-turquoise hover:underline mt-1.5"
                    >
                      Voir le signalement <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
                {!n.is_read && (
                  <button
                    onClick={() => markOne(n.id)}
                    className="text-slate-400 hover:text-turquoise p-1 -m-1"
                    title="Marquer comme lu"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
