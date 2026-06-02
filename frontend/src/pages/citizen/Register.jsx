import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, UserRound, Building2, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthShell } from '../../components/common';
import publicMunicipalityService from '../../services/publicMunicipalityService';
import reportService from '../../services/reportService';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const slug = params.get('municipality') || null;
  const { registerByEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [municipalityId, setMunicipalityId] = useState('');
  const [municipalities, setMunicipalities] = useState([]);
  const [municipality, setMunicipality] = useState(null); // mairie résolue par slug
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Slug fourni → on affiche la mairie ciblée. Sinon → liste pour le sélecteur.
  useEffect(() => {
    if (slug) {
      publicMunicipalityService.getMunicipalityPublicPage(slug)
        .then((res) => setMunicipality(res?.data || null))
        .catch(() => { /* ignore */ });
    } else {
      reportService.getPublicMunicipalities()
        .then((res) => {
          const list = res.data || res || [];
          setMunicipalities(list);
          if (list.length > 0) setMunicipalityId(String(list[0].id));
        })
        .catch((err) => console.error('Erreur chargement municipalités:', err));
    }
  }, [slug]);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Mot de passe : 8 caractères minimum.');
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas.');
    if (!slug && !municipalityId) return setError('Veuillez sélectionner votre municipalité.');

    setSubmitting(true);
    try {
      await registerByEmail({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        municipality_slug: slug || undefined,
        municipality_id: slug ? undefined : municipalityId
      });
      toast.success('Compte créé');
      navigate('/home');
    } catch (err) {
      const msg = err?.response?.data?.message
        || err?.response?.data?.errors?.[0]?.msg
        || 'Erreur lors de l\'inscription';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const field = 'w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise/30 focus:border-turquoise';

  return (
    <AuthShell
      headline={<>Rejoignez <span className="text-turquoise italic">Muno.</span></>}
      subtitle="Créez votre compte pour suivre vos signalements et recevoir des mises à jour en temps réel."
    >
      <div className="bg-white rounded-2xl shadow-xl shadow-navy-deep/5 border border-gray-100 p-8">
        <h3 className="text-2xl font-black text-navy-deep tracking-tight">Créer un compte</h3>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          {municipality
            ? <>Pour signaler à <strong className="text-navy-deep">{municipality.name}</strong></>
            : 'Suivez vos signalements et recevez des mises à jour.'}
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Nom complet</label>
            <div className="relative">
              <UserRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={field} placeholder="Jean Dupont" />
            </div>
          </div>

          {/* Sélecteur de municipalité (si pas de slug) */}
          {!slug && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Votre municipalité</label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select value={municipalityId} onChange={(e) => setMunicipalityId(e.target.value)} className={field} required>
                  <option value="" disabled>Sélectionnez votre municipalité</option>
                  {municipalities.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="vous@exemple.com" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} placeholder="8 caractères minimum" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Confirmer</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input required type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={field} />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-turquoise text-navy-deep font-bold text-sm hover:bg-turquoise/90 transition-all disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            S'inscrire
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-turquoise font-bold hover:underline">Se connecter</Link>
        </div>
      </div>
    </AuthShell>
  );
}
