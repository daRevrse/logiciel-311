import React, { useEffect, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Button, Spinner } from '../common';
import reportService from '../../services/reportService';
import toast from 'react-hot-toast';

/**
 * Section commentaires lecture/écriture pour citoyen propriétaire du report.
 * Les commentaires internes ne sont pas retournés par l'API.
 */
export default function CommentsSection({ reportId, canPost }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (reportId) load();
  }, [reportId]);

  async function load() {
    setLoading(true);
    try {
      const data = await reportService.listComments(reportId);
      setComments(data.data || []);
    } catch (err) {
      // 403 = pas autorisé (citoyen non propriétaire) → on ne montre rien
      setComments([]);
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!body.trim()) return;
    setPosting(true);
    try {
      await reportService.addComment(reportId, body.trim());
      setBody('');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setPosting(false);
    }
  }

  function formatDate(d) {
    return new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Discussion</h2>
        <span className="text-sm text-gray-500">({comments.length})</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Spinner /></div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun message pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {comments.map(c => (
            <div key={c.id} className="rounded-lg p-3 bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-gray-900">
                  {c.author?.full_name || `Utilisateur #${c.author_id}`}
                  {c.author_role && c.author_role !== 'citizen' && (
                    <span className="ml-2 text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Mairie</span>
                  )}
                </span>
                <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
        </div>
      )}

      {canPost && (
        <div className="mt-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Votre message..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex justify-end mt-2">
            <Button variant="primary" onClick={submit} disabled={posting || !body.trim()}>
              {posting ? <Spinner size="sm" className="mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Envoyer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
