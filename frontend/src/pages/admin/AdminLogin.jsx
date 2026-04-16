import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common';
import { Mail, Lock, AlertCircle, Map } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Page de connexion administrateur
 * Email + mot de passe
 */
const AdminLogin = () => {
  const navigate = useNavigate();
  const { loginAdmin, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Si déjà authentifié, rediriger
  if (isAuthenticated) {
    navigate('/admin/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginAdmin(formData.email, formData.password);
      toast.success('Connexion réussie!');
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Erreur connexion:', err);
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect');
      toast.error('Échec de la connexion');
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
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="bg-white rounded-[12px] shadow-card w-full max-w-md p-8">

        {/* En-tête */}
        <div className="text-center mb-8">
          <span className="bg-[#1E3A5F] text-white px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
            Administration
          </span>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Map className="h-10 w-10 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">Muno</span>
          </div>
          <p className="text-gray-600 text-sm">
            Accès administrateur
          </p>
        </div>

        {/* Formulaire de connexion */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Adresse email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Bouton de connexion */}
          <Button variant="primary" fullWidth type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>

        {/* Aide */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Comptes de test disponibles:
            </h3>
            <div className="space-y-1 text-xs text-blue-800">
              <p>Super Admin: superadmin@lome.tg (pas de mot de passe - connexion par téléphone: +22890000001)</p>
              <p>Admin: admin@lome.tg (pas de mot de passe - connexion par téléphone: +22890000002)</p>
            </div>
            <p className="mt-3 text-xs text-blue-700">
              Note: Pour l'instant, utilisez la connexion par téléphone depuis la page citoyenne.
            </p>
          </div>
        </div>

        {/* Lien vers connexion citoyenne */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Vous êtes un citoyen?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
              Connexion citoyenne
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
