// src/components/CommentModal.jsx - Updated with spiritual theme and French language (no email required)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Send, User, Calendar, MessageCircle, Loader2, AlertCircle, Reply, ChevronRight, Sparkles } from 'lucide-react';

const CommentModal = ({ blogId, isOpen, onClose, onCommentAdded }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    comment: ''
  });

  const colors = {
    deepPurple: "#2B1B3F",
    darkPurple: "#1F1530",
    antiqueGold: "#C9A24D",
    lightGold: "#E8D9B0",
    softIvory: "#F5F3EB",
    white: "#FFFFFF",
    textDark: "#2B1B3F",
    textLight: "#6B7280"
  };

  // Compteur total de commentaires incluant les réponses
  const countTotalComments = (comments) => {
    return comments.reduce((total, comment) => {
      const replyCount = comment.replies ? countTotalComments(comment.replies) : 0;
      return total + 1 + replyCount;
    }, 0);
  };

  useEffect(() => {
    if (isOpen && blogId) {
      fetchComments();
      const savedName = localStorage.getItem('commentName');
      if (savedName) {
        setFormData(prev => ({ ...prev, name: savedName }));
      }
    }
  }, [isOpen, blogId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/comments/${blogId}/comments`);
      setComments(response.data.data || []);
    } catch (err) {
      setError('Impossible de charger les commentaires');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.comment.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: formData.name.trim(),
        comment: formData.comment.trim()
      };
      if (replyingTo) {
        payload.parentComment = replyingTo._id;
      }
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/comments/${blogId}/comments`, payload);
      localStorage.setItem('commentName', formData.name.trim());
      setSuccess(replyingTo ? 'Réponse ajoutée avec succès !' : 'Commentaire ajouté avec succès !');
      setFormData({ name: formData.name, comment: '' });
      setReplyingTo(null);
      fetchComments();
      if (onCommentAdded) {
        onCommentAdded();
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Échec de l\'ajout du commentaire');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    setFormData(prev => ({ ...prev, comment: '' }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.ceil(diffDays / 7)} semaines`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Couleurs d'avatar
  const getAuthorAvatar = (name) => {
    const gradients = [
      'from-amber-500 to-orange-500',
      'from-purple-500 to-pink-500',
      'from-emerald-500 to-teal-500',
      'from-blue-500 to-indigo-500',
      'from-rose-500 to-red-500'
    ];
    return gradients[name?.length % gradients.length] || gradients[0];
  };

  // Rendu récursif des commentaires et réponses
  const renderComments = (comments, level = 0) => (
    <div className={`space-y-4 sm:space-y-5 ${level > 0 ? 'ml-4 sm:ml-10 pl-3 sm:pl-5 border-l-2' : ''}`}
         style={{ borderLeftColor: level > 0 ? colors.lightGold : 'transparent' }}>
      {comments.map((comment) => (
        <div 
          key={comment._id} 
          className="rounded-xl p-4 sm:p-5 transition-all hover:shadow-md"
          style={{ 
            backgroundColor: level > 0 ? colors.softIvory : colors.white,
            border: `1px solid ${colors.lightGold}`
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${getAuthorAvatar(comment.name)} rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0 shadow-md`}>
                {comment.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: colors.deepPurple }}>{comment.name}</p>
                <p className="text-xs" style={{ color: colors.textLight }}>{formatDate(comment.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleReply(comment)}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg transition text-xs sm:text-sm font-medium hover:bg-amber-50"
                style={{ color: colors.antiqueGold }}
                aria-label={`Répondre à ${comment.name}`}
              >
                <Reply className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Répondre</span>
              </button>
            </div>
          </div>
          <p className="text-sm leading-relaxed ml-11 sm:ml-13" style={{ color: colors.textDark }}>{comment.comment}</p>
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 ml-11 sm:ml-13 text-xs flex items-center gap-1">
              <ChevronRight className="w-3 h-3" style={{ color: colors.antiqueGold }} />
              <span style={{ color: colors.textLight }}>
                {comment.replies.length} {comment.replies.length === 1 ? 'réponse' : 'réponses'}
              </span>
            </div>
          )}
          {comment.replies && comment.replies.length > 0 && renderComments(comment.replies, level + 1)}
        </div>
      ))}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        style={{ backgroundColor: colors.white, border: `1px solid ${colors.lightGold}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6"
             style={{ borderBottom: `1px solid ${colors.lightGold}` }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full" style={{ backgroundColor: colors.lightGold + '30' }}>
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: colors.antiqueGold }} />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold" style={{ color: colors.deepPurple }}>
              Commentaires
            </h2>
            <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-semibold"
                  style={{ backgroundColor: colors.lightGold + '50', color: colors.antiqueGold }}>
              {countTotalComments(comments)} total
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all hover:bg-gray-100"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" style={{ color: colors.textLight }} />
          </button>
        </div>

        <div className="flex flex-col h-[calc(90vh-140px)]">
          {/* Liste des commentaires */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.antiqueGold }} />
              </div>
            ) : error && comments.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textLight }} />
                <p style={{ color: colors.textLight }}>{error}</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                     style={{ backgroundColor: colors.lightGold + '30' }}>
                  <Sparkles className="w-10 h-10" style={{ color: colors.antiqueGold }} />
                </div>
                <p className="text-lg font-serif font-medium mb-2" style={{ color: colors.deepPurple }}>
                  Aucun commentaire pour l'instant
                </p>
                <p className="text-sm" style={{ color: colors.textLight }}>
                  Soyez le premier à partager votre pensée !
                </p>
              </div>
            ) : (
              renderComments(comments)
            )}
          </div>

          {/* Formulaire d'ajout de commentaire */}
          <div className="p-5 sm:p-6" style={{ borderTop: `1px solid ${colors.lightGold}`, backgroundColor: colors.softIvory }}>
            {success && (
              <div className="mb-4 p-3 rounded-lg text-sm font-medium"
                   style={{ backgroundColor: '#10B98120', border: `1px solid #10B98140`, color: '#065F46' }}>
                {success}
              </div>
            )}
            {error && !success && (
              <div className="mb-4 p-3 rounded-lg text-sm font-medium"
                   style={{ backgroundColor: '#FEE2E2', border: `1px solid #FECACA`, color: '#DC2626' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {replyingTo && (
                <div className="p-3 rounded-lg flex items-center gap-2"
                     style={{ backgroundColor: colors.lightGold + '20', border: `1px solid ${colors.lightGold}` }}>
                  <Reply className="w-4 h-4" style={{ color: colors.antiqueGold }} />
                  <p className="text-sm" style={{ color: colors.deepPurple }}>
                    Réponse à <strong>{replyingTo.name}</strong>
                  </p>
                </div>
              )}
              <div>
                <input
                  type="text"
                  placeholder="Votre nom *"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{
                    backgroundColor: colors.white,
                    border: `1px solid ${colors.lightGold}`,
                    color: colors.deepPurple,
                    ringColor: colors.antiqueGold
                  }}
                  maxLength={50}
                  required
                />
              </div>
              <div>
                <textarea
                  placeholder={replyingTo ? "Écrivez votre réponse..." : "Écrivez votre commentaire... *"}
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  rows="4"
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition resize-none"
                  style={{
                    backgroundColor: colors.white,
                    border: `1px solid ${colors.lightGold}`,
                    color: colors.deepPurple,
                    ringColor: colors.antiqueGold
                  }}
                  maxLength={1000}
                  required
                />
                <div className="text-right text-xs mt-1" style={{ color: colors.textLight }}>
                  {formData.comment.length}/1000 caractères
                </div>
              </div>
              <div className="flex gap-3">
                {replyingTo && (
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium transition"
                    style={{
                      backgroundColor: colors.white,
                      border: `1px solid ${colors.lightGold}`,
                      color: colors.textLight
                    }}
                  >
                    Annuler la réponse
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting || !formData.name.trim() || !formData.comment.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  style={{
                    backgroundColor: colors.antiqueGold,
                    color: colors.deepPurple
                  }}
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {submitting ? 'Envoi...' : (replyingTo ? 'Publier la réponse' : 'Publier le commentaire')}
                </button>
              </div>
            </form>
            <p className="text-xs text-center mt-3" style={{ color: colors.textLight }}>
              En publiant votre commentaire, vous acceptez notre politique de confidentialité.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;