import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, ClipboardList, Camera, X } from 'lucide-react';
import { Button, Input, Textarea, Spinner, PhotoUploader } from '../../components/common';
import { LocationPicker } from '../../components/citizen';
import { useAuth } from '../../contexts/AuthContext';
import reportService from '../../services/reportService';
import { resolveImageUrl } from '../../utils/url';
import toast from 'react-hot-toast';

/**
 * Édition d'un signalement existant (créateur, statut "pending" uniquement).
 * Permet de modifier le texte, la localisation et les photos.
 */
const EditReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    latitude: '',
    longitude: ''
  });
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await reportService.getReportById(id);
        const report = res?.data ?? res;

        // Garde-fous côté client (le backend reste l'autorité)
        if (user && report.citizen_id && report.citizen_id !== user.id) {
          toast.error('Vous ne pouvez modifier que vos propres signalements');
          navigate(`/reports/${id}`);
          return;
        }
        if (report.status && report.status !== 'pending') {
          toast.error('Ce signalement ne peut plus être modifié');
          navigate(`/reports/${id}`);
          return;
        }

        setForm({
          title: report.title || '',
          description: report.description || '',
          address: report.address || '',
          latitude: report.latitude ?? '',
          longitude: report.longitude ?? ''
        });
        setExistingPhotos(report.photos || []);
      } catch (error) {
        console.error('Erreur chargement signalement:', error);
        toast.error('Signalement introuvable');
        navigate('/my-reports');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const totalPhotos = existingPhotos.length + newPhotos.length;

  const validate = () => {
    const e = {};
    if (!form.title || form.title.trim().length < 5) e.title = 'Titre trop court (min 5)';
    if (!form.description || form.description.trim().length < 10) e.description = 'Description trop courte (min 10)';
    if (!form.address) e.address = 'La localisation est obligatoire';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleDeleteExisting = async (photoId) => {
    try {
      await reportService.deletePhoto(id, photoId);
      setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
      toast.success('Photo supprimée');
    } catch (error) {
      console.error('Erreur suppression photo:', error);
      toast.error('Impossible de supprimer la photo');
    }
  };

  const uploadNewPhotos = async () => {
    if (newPhotos.length === 0) return;
    const token = localStorage.getItem('token');
    for (const photo of newPhotos) {
      const fd = new FormData();
      fd.append('photo', photo.file);
      await fetch(`${import.meta.env.VITE_API_URL}/reports/${id}/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
    }
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await reportService.updateReport(id, {
        title: form.title,
        description: form.description,
        address: form.address,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null
      });
      await uploadNewPhotos();
      toast.success('Signalement mis à jour');
      navigate(`/reports/${id}`);
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      toast.error(error.response?.data?.message || 'Échec de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Spinner size="lg" className="text-turquoise" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="bg-navy-deep text-white">
        <div className="max-w-2xl mx-auto px-4 pt-5 pb-8">
          <button
            onClick={() => navigate(`/reports/${id}`)}
            className="flex items-center gap-1 text-white/80 hover:text-white text-sm font-semibold mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-turquoise/10 flex items-center justify-center text-turquoise">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Modifier le signalement</h1>
              <p className="text-white/60 text-sm">Ajustez les informations puis enregistrez.</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 mt-4 space-y-4">
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <Input
            label="Titre"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ex : Lampadaire en panne"
            error={errors.title}
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={5}
            placeholder="Décrivez précisément ce que vous observez..."
            error={errors.description}
          />
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <label className="text-sm font-bold text-gray-700 mb-3 block">Localisation</label>
          <LocationPicker
            address={form.address}
            setAddress={(address) => setForm((prev) => ({ ...prev, address }))}
            latitude={form.latitude}
            setLatitude={(latitude) => setForm((prev) => ({ ...prev, latitude }))}
            longitude={form.longitude}
            setLongitude={(longitude) => setForm((prev) => ({ ...prev, longitude }))}
            error={errors.address}
          />
        </section>

        {/* Photos */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-turquoise/10 flex items-center justify-center text-turquoise">
              <Camera className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-navy-deep">Photos</h2>
          </div>

          {existingPhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {existingPhotos.map((photo) => (
                <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                  <img src={resolveImageUrl(photo.photo_url)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleDeleteExisting(photo.id)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-rose-500 transition-colors"
                    title="Supprimer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <PhotoUploader
            photos={newPhotos}
            onChange={setNewPhotos}
            maxPhotos={Math.max(0, 5 - existingPhotos.length)}
          />
          <p className="text-xs text-gray-400 mt-2">{totalPhotos}/5 photo{totalPhotos > 1 ? 's' : ''}</p>
        </section>

        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate(`/reports/${id}`)} disabled={saving} className="flex-1">
            Annuler
          </Button>
          <Button type="submit" variant="primary" loading={saving} className="flex-1 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditReport;
