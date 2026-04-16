import React from 'react';

const StatusBadge = ({ status, size = 'md' }) => {
  const statusConfig = {
    pending: {
      label: 'Nouveau',
      color: 'bg-blue-50 text-primary-700 border-primary-200',
    },
    confirmed: {
      label: 'Confirmé',
      color: 'bg-primary-50 text-primary-800 border-primary-300',
    },
    in_progress: {
      label: 'En cours',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    resolved: {
      label: 'Résolu',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    rejected: {
      label: 'Rejeté',
      color: 'bg-red-50 text-red-700 border-red-200',
    },
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${config.color} ${sizes[size]}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
