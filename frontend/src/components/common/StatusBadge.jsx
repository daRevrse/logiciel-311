import React from 'react';

/**
 * Composant StatusBadge pour afficher le statut d'un signalement
 */
const StatusBadge = ({ status, size = 'md' }) => {
  const statusConfig = {
    pending: {
      label: 'En attente',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    },
    confirmed: {
      label: 'Confirmé',
      color: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    in_progress: {
      label: 'En cours',
      color: 'bg-purple-100 text-purple-800 border-purple-300'
    },
    resolved: {
      label: 'Résolu',
      color: 'bg-green-100 text-green-800 border-green-300'
    },
    rejected: {
      label: 'Rejeté',
      color: 'bg-red-100 text-red-800 border-red-300'
    }
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.color} ${sizes[size]}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
