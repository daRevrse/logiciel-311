import React, { useState, useEffect } from 'react';
import { MessageSquare, Lock, Trash2, Send } from 'lucide-react';
import { Button, Textarea, Spinner } from '../common';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

/**
 * Fil de discussion sur un signalement.
 * - Staff (admin/agent) peut voir et écrire commentaires internes (is_internal=true).
 * - Commentaires publics visibles également par le citoyen propriétaire.
 */
export default function ReportCommentsThread({ reportId, currentUserId, currentUserRole }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [posting, setPosting] = useState(false);

  const isStaff = ['admin', 'super_admin', 'agent'].includes(currentUserRole);

  useEffect(() => {
    if (reportId) load();
  }, [reportId]);

  async function load() {
    setLoading(true);
    try {
      const data = await adminService.listComments(reportId);
      setComments(data.data || []);
    } catch (err) {
      toast.error('Impossible de charger les commentaires');
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!body.trim()) return;
    setPosting(true);
    try {
      await adminService.addComment(reportId, body.trim(), isStaff && isInternal);
      setBody('');
      setIsInternal(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setPosting(false);
    }
  }

  async function remove(commentId) {
    if (!window.confirm('Supprimer ce commentaire ?')) return;
    try {
      await adminService.deleteComment(reportId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      toast.error('Suppression impossible');
    }
  }

  function formatDate(d) {
    return new Date(d).toLocaleString('fr-FR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Discussion</h2>
        <span className="text-sm text-gray-500">({comments.length})</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Spinner /></div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">Aucun commentaire pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {comments.map(c => {
            const canDelete = c.author_id === currentUserId
              || ['admin', 'super_admin'].includes(currentUserRole);
            return (
              <div
                key={c.id}
                className={`rounded-lg p-3 border ${c.is_internal ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {c.author?.full_name || `Utilisateur #${c.author_id}`}
                      </span>
                      <span className="text-xs text-gray-500">
                        {c.author?.role && `· ${c.author.role}`}
                      </span>
                      {c.is_internal && (
                        <span className="inline-flex items-center text-xs text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          <Lock className="h-3 w-3 mr-1" />Interne
                        </span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">{formatDate(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.body}</p>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-2 border-t border-gray-200">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Écrire un commentaire..."
          rows={3}
        />
        <div className="flex items-center justify-between mt-2">
          {isStaff ? (
            <label className="inline-flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="mr-2"
              />
              Commentaire interne (non visible par le citoyen)
            </label>
          ) : <span />}
          <Button variant="primary" onClick={submit} disabled={posting || !body.trim()}>
            {posting ? <Spinner size="sm" className="mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
}
