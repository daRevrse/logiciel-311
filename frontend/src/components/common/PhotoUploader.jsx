import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from './';

/**
 * Composant d'upload de photos avec drag-and-drop
 * Max 5 photos, 5MB par photo, formats: jpg, png, jpeg
 */
const PhotoUploader = ({ photos = [], onChange, maxPhotos = 5, maxSizeInMB = 5 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  const acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png'];

  const validateFile = (file) => {
    // Vérifier le format
    if (!acceptedFormats.includes(file.type)) {
      return `Format non supporté. Utilisez JPG ou PNG.`;
    }

    // Vérifier la taille
    if (file.size > maxSizeInBytes) {
      return `La photo "${file.name}" dépasse ${maxSizeInMB}MB.`;
    }

    return null;
  };

  const handleFiles = (files) => {
    setError('');
    const fileArray = Array.from(files);

    // Vérifier le nombre max
    if (photos.length + fileArray.length > maxPhotos) {
      setError(`Maximum ${maxPhotos} photos autorisées.`);
      return;
    }

    // Valider chaque fichier
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Convertir en preview URLs
    const newPhotos = fileArray.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));

    onChange([...photos, ...newPhotos]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleRemovePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    // Libérer l'URL de preview
    if (photos[index].preview) {
      URL.revokeObjectURL(photos[index].preview);
    }
    onChange(newPhotos);
    setError('');
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      {photos.length < maxPhotos && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }
          `}
        >
          <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`} />
          <p className="text-gray-700 font-medium mb-1">
            Glissez vos photos ici ou cliquez pour parcourir
          </p>
          <p className="text-sm text-gray-500">
            JPG ou PNG, max {maxSizeInMB}MB par photo ({maxPhotos - photos.length} restantes)
          </p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Previews des photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src={photo.preview}
                  alt={photo.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Bouton supprimer */}
              <button
                type="button"
                onClick={() => handleRemovePhoto(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                aria-label="Supprimer"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Info taille */}
              <div className="mt-1 text-xs text-gray-500 text-center truncate">
                {formatFileSize(photo.size)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compteur */}
      {photos.length > 0 && (
        <p className="text-sm text-gray-600 text-center">
          {photos.length} / {maxPhotos} photos
        </p>
      )}
    </div>
  );
};

export default PhotoUploader;
