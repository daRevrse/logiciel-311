import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common';
import { Mail, Lock, AlertCircle, ChevronRight, ShieldCheck, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Page de connexion administrateur premium
 */
const AdminLogin = () => {
  const navigate = useNavigate();
  const { loginAdmin, isAuthenticated, isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Si déjà authentifié en tant qu'admin, rediriger vers le dashboard
  useEffect(() => {
    if (isAuthenticated && isAdmin()) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Tentative de connexion admin...', formData.email);
    setError('');
    setLoading(true);

    try {
      const response = await loginAdmin(formData.email, formData.password);
      console.log('Connexion réussie:', response);
      toast.success('Accès autorisé ! Bienvenue dans la console.');
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Erreur connexion admin:', err);
      // Extraire le message d'erreur précis du backend
      const message = err.response?.data?.message || err.message || 'Identifiants invalides';
      setError(message);
      toast.error('Échec de l\'authentification');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-['Manrope']">
      {/* Left Side: Brand Hero Section (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#1E3A5F] overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/admin_login_background.png" 
            alt="Muno Smart City" 
            className="w-full h-full object-cover opacity-40 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#1E3A5F] via-[#1E3A5F]/80 to-transparent"></div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <div>
            <div className="flex items-center gap-4 mb-14 animate-in fade-in slide-in-from-left-4 duration-700">
              <div className="w-20 h-20 rounded-[2.5rem] bg-white flex items-center justify-center border border-white/20 shadow-2xl overflow-hidden p-3 transform transition-transform hover:scale-105">
                <img src="/icone.png" alt="Muno Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tighter leading-none mb-1">Muno</h1>
                <p className="text-[12px] uppercase tracking-[0.4em] text-white/60 font-bold">Gestion Municipale Intelligente</p>
              </div>
            </div>

            <div className="max-w-md space-y-6 animate-in fade-in slide-in-from-left-8 duration-700 delay-100">
              <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
                Gérez votre <br />
                <span className="text-primary-400">cité intelligente</span> <br />
                avec Muno.
              </h2>
              <p className="text-white/70 text-lg leading-relaxed font-medium">
                Plateforme centralisée de monitoring citoyen, de gestion de voirie et d'optimisation des interventions municipales.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className="flex flex-col">
              <span className="text-4xl font-black text-white">98%</span>
              <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Satisfaction</span>
            </div>
            <div className="w-[1px] h-10 bg-white/10"></div>
            <div className="flex flex-col">
              <span className="text-4xl font-black text-white">24/7</span>
              <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Monitoring</span>
            </div>
          </div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-primary-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Right Side: Login Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white dark:bg-slate-950">
        <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
          {/* Mobile Header (Only visible on small screens) */}
          <div className="lg:hidden flex flex-col items-center mb-10 text-center">
            <div className="w-24 h-24 rounded-[3rem] bg-white flex items-center justify-center shadow-2xl shadow-primary/20 mb-6 overflow-hidden border border-slate-100 p-4">
              <img src="/icone.png" alt="Muno Logo" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Muno Admin</h1>
            <p className="text-slate-500 font-medium">Accès confidentiel réservé à la mairie</p>
          </div>

          {/* Form Header */}
          <div className="hidden lg:block mb-10">
            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-[0.2em] mb-2">
              <ShieldCheck className="h-4 w-4" />
              Connexion Sécurisée
            </div>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">
              Bon retour parmi nous.
            </h3>
            <p className="text-slate-500 text-lg font-medium">Entrez vos identifiants pour accéder à la console.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Feedback */}
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
                <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{error}</p>
              </div>
            )}

            <div className="space-y-5">
              <div className="group">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1 group-focus-within:text-primary transition-colors">
                  Adresse de messagerie
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="nom@mairie.tg"
                    className="w-full h-14 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-4 text-slate-900 dark:text-white font-bold text-sm focus:border-primary focus:bg-white dark:focus:bg-slate-900 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="group">
                <div className="flex justify-between items-center mb-2 px-1">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest group-focus-within:text-primary transition-colors">
                    Clé d'authentification
                  </label>
                  <button type="button" className="text-xs font-bold text-primary hover:underline underline-offset-4">
                    Oublié ?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    className="w-full h-14 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-4 text-slate-900 dark:text-white font-bold text-sm focus:border-primary focus:bg-white dark:focus:bg-slate-900 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>

            <Button 
               variant="primary" 
               className="w-full h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group transition-all active:scale-[0.98]"
               disabled={loading}
               type="submit"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   Vérification...
                </div>
              ) : (
                <>
                  Entrer dans la console
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          {/* Mobile Citizen Link */}
          <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-900">
            <div className="relative bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-all hover:shadow-lg overflow-hidden">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all text-primary">
                    <Globe className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Espace public</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Retourner au portail citoyen</p>
                 </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              <Link to="/" className="absolute inset-0 opacity-0 outline-none ring-0">Retour</Link>
            </div>
          </div>

          {/* Test Credentials (Professionalized) */}
          <div className="mt-8 px-2">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 text-center">Environnement de démonstration</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400">SUPER ADMIN</span>
                <code 
                  onClick={() => setFormData({ email: 'superadmin@lome.tg', password: 'Admin123!' })}
                  className="text-[10px] bg-slate-100 dark:bg-slate-900 p-2 rounded-lg text-primary font-bold border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-primary/5 transition-colors text-center"
                >
                  superadmin@lome.tg
                </code>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400">ADMIN LOCAL</span>
                <code 
                  onClick={() => setFormData({ email: 'admin@lome.tg', password: 'Admin123!' })}
                  className="text-[10px] bg-slate-100 dark:bg-slate-900 p-2 rounded-lg text-emerald-600 font-bold border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-emerald-500/5 transition-colors text-center"
                >
                  admin@lome.tg
                </code>
              </div>
            </div>
            <p className="mt-3 text-[10px] text-slate-400 text-center italic">Cliquez sur un identifiant pour remplir les champs.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
