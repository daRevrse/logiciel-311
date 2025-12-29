import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card } from '../../components/common';
import { Mail, Lock, AlertCircle, Shield } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
              <Shield className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Espace Administrateur
          </h1>
          <p className="mt-2 text-gray-600">
            Connectez-vous pour gérer votre municipalité
          </p>
        </div>

        {/* Formulaire de connexion */}
        <Card className="p-8">
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
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
            >
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
        </Card>

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
