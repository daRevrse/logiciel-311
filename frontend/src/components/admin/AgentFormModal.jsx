import React, { useState, useEffect } from 'react';
import { X, Copy, Check, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';

const AgentFormModal = ({ open, onClose, onSaved, mode = 'create', initialAgent = null, categories = [] }) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [specializations, setSpecializations] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [tempPassword, setTempPassword] = useState(null);
  const [mailWarning, setMailWarning] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTempPassword(null);
    setMailWarning(null);
    setCopied(false);
    if (mode === 'edit' && initialAgent) {
      setEmail(initialAgent.email || '');
      setFullName(initialAgent.full_name || initialAgent.name || '');
      const ids = (initialAgent.specialization_details || []).map((c) => c.id);
      setSpecializations(ids.length ? ids : (initialAgent.specializations || []));
    } else {
      setEmail('');
      setFullName('');
      setSpecializations([]);
    }
  }, [open, mode, initialAgent]);

  if (!open) return null;

  const toggleSpec = (id) => {
    setSpecializations((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const validate = () => {
    if (mode === 'create' && !email.trim()) return 'L\'email est requis.';
    if (!fullName.trim()) return 'Le nom complet est requis.';
    if (specializations.length === 0) return 'Au moins une spécialisation est requise.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'create') {
        const payload = { email: email.trim(), full_name: fullName.trim(), specializations };
        const res = await adminService.createAgent(payload);
        if (res?.temp_password) {
          setTempPassword(res.temp_password);
          setMailWarning(res.mail_warning || null);
          toast.success('Agent créé');
          onSaved && onSaved();
          // Do not close; show the password
        } else {
          toast.success('Agent créé, invitation envoyée');
          onSaved && onSaved();
          onClose();
        }
      } else {
        const payload = { full_name: fullName.trim(), specializations };
        await adminService.updateAgent(initialAgent.id, payload);
        toast.success('Agent mis à jour');
        onSaved && onSaved();
        onClose();
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Erreur lors de l\'enregistrement.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={submitting ? undefined : onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
            {mode === 'create' ? 'Nouvel agent' : 'Modifier l\'agent'}
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {tempPassword ? (
          <div className="p-5 space-y-4">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p className="font-semibold">Transmettez ce mot de passe à l'agent — il ne sera plus affiché.</p>
              </div>
              {mailWarning && (
                <p className="text-xs text-amber-800">{mailWarning}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Mot de passe temporaire</label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={tempPassword}
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono text-sm"
                />
                <button
                  onClick={copyPassword}
                  className="px-3 py-2 rounded-lg bg-primary text-white flex items-center gap-2 text-sm font-semibold hover:bg-primary/90"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copié' : 'Copier'}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Email{mode === 'create' && ' *'}</label>
              <input
                type="email"
                value={email}
                disabled={mode === 'edit'}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="agent@mairie.fr"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Nom complet *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
                placeholder="Jean Dupont"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Spécialisations *</label>
              {categories.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Aucune catégorie disponible.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={specializations.includes(cat.id)}
                        onChange={() => toggleSpec(cat.id)}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      {cat.color && (
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                      )}
                      <span className="text-sm text-slate-700 dark:text-slate-200">{cat.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
              >
                {submitting ? 'Enregistrement…' : (mode === 'create' ? 'Créer' : 'Enregistrer')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AgentFormModal;
