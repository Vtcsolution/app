// src/pages/BlogDetail.jsx - Updated with psychic/spiritual theme and French language
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import DOMPurify from 'dompurify';
import {
  Clock, User, Calendar, Eye, ArrowLeft, Share2, Bookmark,
  Facebook, Twitter, Linkedin, MessageCircle, Tag,
  ChevronRight, Sparkles, TrendingUp, Star, BookOpen,
  Menu, Hash, Reply, X, Heart, Moon, Sun, Gem
} from 'lucide-react';
import CommentModal from './CommentModal';
import { motion } from 'framer-motion';

const BlogDetail = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [toc, setToc] = useState([]);
  const [showToc, setShowToc] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

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

  // Compteur total de commentaires
  const countTotalComments = (comments) => {
    return comments.reduce((total, comment) => {
      const replyCount = comment.replies ? countTotalComments(comment.replies) : 0;
      return total + 1 + replyCount;
    }, 0);
  };

  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        setLoading(true);
        setError(null);
        const blogResponse = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/blogs/${id}`);
        const fetchedBlog = blogResponse.data.data;

        // Déterminer le contenu
        let blogContent = fetchedBlog.content || fetchedBlog.fullContent || '';
        
        // Traiter le contenu
        let processedContent = blogContent.replace(/\n+/g, '\n').trim();
        
        fetchedBlog.fullContent = processedContent;
        setBlog(fetchedBlog);

        // Extraire la table des matières
        const headingRegex = /<h([2-3])(?:[^>]*)>(.*?)<\/h\1>/gi;
        const newToc = [];
        let match;
        const contentToParse = fetchedBlog.content || fetchedBlog.fullContent || '';
        while ((match = headingRegex.exec(contentToParse)) !== null) {
          const headingText = match[2].replace(/<[^>]*>/g, '').trim();
          const id = headingText.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
          newToc.push({ level: parseInt(match[1]), text: headingText, id });
        }
        setToc(newToc);

        // Récupérer les articles similaires
        const allBlogsResponse = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/blogs`);
        const related = allBlogsResponse.data.data
          .filter(b => b._id !== id && b.category === fetchedBlog.category)
          .slice(0, 3);
        setRelatedBlogs(related);

        await fetchComments();
      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError(err.response?.status === 404 ? 'Article non trouvé.' : 'Échec du chargement de l\'article.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBlogData();
  }, [id]);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/comments/${id}/comments`);
      const fetchedComments = response.data.data || [];
      setComments(fetchedComments);
      setCommentCount(countTotalComments(fetchedComments));
    } catch (err) {
      console.error('Erreur lors du chargement des commentaires:', err);
      setComments([]);
      setCommentCount(0);
    }
  };

  const handleCommentAdded = () => {
    fetchComments();
    setReplyingTo(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const formatCommentDate = (dateString) => {
    if (!dateString) return 'N/A';
    const commentDate = new Date(dateString);
    const diffTime = Math.abs(new Date() - commentDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.ceil(diffDays / 7)} semaines`;
    return commentDate.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
  };

  const shareBlog = (platform) => {
    const url = window.location.href;
    const title = blog?.title;
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    };
    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

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

  const renderContent = () => {
    const blogContent = blog?.content || blog?.fullContent || '';
    if (!blogContent) return { __html: '<p>Aucun contenu disponible</p>' };
    
    const sanitized = DOMPurify.sanitize(blogContent, {
      ADD_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'p', 'strong', 'em', 'br', 'a', 'details', 'summary', 'div', 'span', 'blockquote'],
      ADD_ATTR: ['target', 'rel', 'href', 'id', 'class', 'style']
    });
    return { __html: sanitized };
  };

  const renderCommentThread = (comment, level = 0) => {
    const isReply = level > 0;
    const indentClass = level > 0 ? 'ml-2 sm:ml-12 pl-2 sm:pl-6 border-l-2' : '';
    const bgClass = isReply ? 'bg-amber-50/30' : 'bg-white';

    return (
      <article
        key={comment._id}
        className={`p-4 sm:p-5 rounded-2xl shadow-sm transition-all ${bgClass} ${indentClass}`}
        style={{ border: `1px solid ${colors.lightGold}` }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br ${getAuthorAvatar(
                comment.name || comment.username
              )} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md`}
            >
              {(comment.name || comment.username)?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold" style={{ color: colors.deepPurple }}>{comment.name || comment.username}</p>
              <p className="text-xs" style={{ color: colors.textLight }}>{formatCommentDate(comment.createdAt)}</p>
              <p className="mt-2 leading-relaxed" style={{ color: colors.textDark }}>{comment.comment}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                setReplyingTo(comment);
                setIsCommentModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all text-xs sm:text-sm font-medium hover:bg-amber-50"
              style={{ color: colors.antiqueGold }}
            >
              <Reply className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Répondre</span>
            </button>
          </div>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-6 space-y-5 sm:space-y-6">
            {comment.replies.map((reply) => renderCommentThread(reply, level + 1))}
          </div>
        )}
      </article>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.softIvory }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
               style={{ borderColor: colors.antiqueGold, borderTopColor: 'transparent' }} />
          <p style={{ color: colors.textLight }}>Chargement de l'article...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.softIvory }}>
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-xl" style={{ border: `1px solid ${colors.lightGold}` }}>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <Sparkles className="h-10 w-10" style={{ color: colors.antiqueGold }} />
            </div>
            <h2 className="text-2xl font-serif font-bold mb-3" style={{ color: colors.deepPurple }}>Article non trouvé</h2>
            <p className="mb-6" style={{ color: colors.textLight }}>{error || 'L\'article que vous recherchez n\'existe pas.'}</p>
            <Link
              to="/blogs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:shadow-lg"
              style={{ backgroundColor: colors.antiqueGold, color: colors.deepPurple }}
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux articles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.softIvory }}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm" style={{ borderBottom: `1px solid ${colors.lightGold}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/blogs" className="flex items-center gap-2 sm:gap-3 transition-all group">
              <div className="p-2 rounded-lg transition-all group-hover:bg-amber-50" style={{ backgroundColor: colors.softIvory }}>
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: colors.antiqueGold }} />
              </div>
              <span className="font-medium text-sm sm:text-base hidden sm:inline" style={{ color: colors.deepPurple }}>Retour aux articles</span>
            </Link>
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`p-2.5 rounded-lg transition-all border ${
                isBookmarked
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
              }`}
            >
              <Bookmark className="w-5 h-5" fill={isBookmarked ? colors.antiqueGold : 'none'} style={{ color: isBookmarked ? colors.antiqueGold : colors.textLight }} />
            </button>
          </div>
        </div>
      </nav>

      <article className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Contenu principal */}
          <main className="lg:col-span-3 space-y-8">
            {/* En-tête */}
            <header className="text-center mb-10 sm:mb-12">
              <div className="inline-flex flex-wrap items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold mb-6 shadow-sm"
                   style={{ backgroundColor: colors.lightGold + '30', color: colors.antiqueGold }}>
                <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {blog.category}
                {blog.featured && (
                  <>
                    <span className="mx-1">•</span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                      À la une
                    </span>
                  </>
                )}
                {blog.trending && (
                  <>
                    <span className="mx-1">•</span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      Tendance
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-5 sm:mb-6 leading-tight"
                  style={{ color: colors.deepPurple }}>
                {blog.title}
              </h1>
              <p className="text-lg sm:text-xl max-w-4xl mx-auto leading-relaxed mb-8 sm:mb-10"
                 style={{ color: colors.textLight }}>
                {blog.excerpt}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-center">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" style={{ color: colors.antiqueGold }} />
                    <span style={{ color: colors.textLight }}>{formatDate(blog.date || blog.createdAt)}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" style={{ color: colors.antiqueGold }} />
                    <span style={{ color: colors.textLight }}>{blog.readTime}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" style={{ color: colors.antiqueGold }} />
                    <span style={{ color: colors.textLight }}>{blog.views || 0} vues</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4" style={{ color: colors.antiqueGold }} />
                    <span style={{ color: colors.textLight }}>{commentCount} commentaires</span>
                  </span>
                </div>
              </div>
            </header>

            {/* Image principale */}
            <div className="rounded-2xl overflow-hidden shadow-xl" style={{ border: `1px solid ${colors.lightGold}` }}>
              <img
                src={blog.image ? `${import.meta.env.VITE_BASE_URL}${blog.image}` : 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=1200&h=500&fit=crop'}
                alt={blog.title}
                className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=1200&h=500&fit=crop';
                }}
              />
            </div>

            {/* Table des matières */}
            {toc.length > 0 && (
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm sticky top-20 lg:top-24 z-10"
                   style={{ border: `1px solid ${colors.lightGold}` }}>
                <button
                  onClick={() => setShowToc(!showToc)}
                  className="flex items-center gap-2 font-medium mb-4 hover:opacity-80 transition-colors w-full text-left text-sm sm:text-base"
                  style={{ color: colors.antiqueGold }}
                >
                  <Menu className="w-4 h-4" />
                  <span>Table des matières</span>
                  <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${showToc ? 'rotate-90' : ''}`} />
                </button>
                {showToc && (
                  <nav className="space-y-2">
                    {toc.map((item, index) => (
                      <a
                        key={index}
                        href={`#${item.id}`}
                        className={`flex items-center gap-2 text-xs sm:text-sm font-medium transition-colors block py-1 px-2 rounded ${
                          item.level === 2 ? 'pl-0' : 'pl-4'
                        } hover:bg-amber-50`}
                        style={{ color: colors.textDark }}
                      >
                        <Hash className="w-3 h-3 flex-shrink-0" style={{ color: colors.antiqueGold }} />
                        <span>{item.text}</span>
                      </a>
                    ))}
                  </nav>
                )}
              </div>
            )}

            {/* Contenu de l'article */}
            <section className="prose prose-lg max-w-none mx-auto">
              <div
                className="bg-white rounded-2xl p-6 sm:p-8 md:p-12 shadow-sm"
                style={{ border: `1px solid ${colors.lightGold}` }}
              >
                <div
                  dangerouslySetInnerHTML={renderContent()}
                  className="blog-content"
                  style={{ lineHeight: '1.8', fontFamily: 'Inter, sans-serif', fontSize: '1.1rem' }}
                />
              </div>
            </section>

            {/* Liens connexes */}
            {blog.backlinks && blog.backlinks.length > 0 && (
              <section>
                <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-2" style={{ color: colors.deepPurple }}>
                  <BookOpen className="w-6 h-6" style={{ color: colors.antiqueGold }} />
                  Lectures complémentaires
                </h2>
                <div className="space-y-4">
                  {blog.backlinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-5 rounded-xl transition-all duration-300 flex items-center justify-between group"
                      style={{ backgroundColor: colors.lightGold + '20', border: `1px solid ${colors.lightGold}` }}
                    >
                      <div className="flex-1">
                        <p className="font-semibold group-hover:underline transition-colors" style={{ color: colors.deepPurple }}>{link.text}</p>
                        <p className="text-sm mt-1" style={{ color: colors.textLight }}>Visiter la source</p>
                      </div>
                      <ChevronRight className="w-5 h-5 transition-all transform group-hover:translate-x-1" style={{ color: colors.antiqueGold }} />
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Barre d'actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 p-5 sm:p-6 bg-white rounded-2xl"
                 style={{ border: `1px solid ${colors.lightGold}` }}>
              <div className="flex items-center gap-3 flex-1">
                <span className="font-medium" style={{ color: colors.deepPurple }}>Partager :</span>
                <div className="flex gap-2">
                  <button onClick={() => shareBlog('twitter')} className="p-2 rounded-lg transition-all hover:bg-gray-100">
                    <Twitter className="w-5 h-5" style={{ color: colors.textLight }} />
                  </button>
                  <button onClick={() => shareBlog('facebook')} className="p-2 rounded-lg transition-all hover:bg-gray-100">
                    <Facebook className="w-5 h-5" style={{ color: colors.textLight }} />
                  </button>
                  <button onClick={() => shareBlog('linkedin')} className="p-2 rounded-lg transition-all hover:bg-gray-100">
                    <Linkedin className="w-5 h-5" style={{ color: colors.textLight }} />
                  </button>
                </div>
              </div>
              <button
                onClick={() => setIsCommentModalOpen(true)}
                className="flex items-center gap-3 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
                style={{ backgroundColor: colors.antiqueGold, color: colors.deepPurple }}
              >
                <MessageCircle className="w-5 h-5" />
                <span>Ajouter un commentaire ({commentCount})</span>
              </button>
            </div>

            {/* Commentaires */}
            {comments.length > 0 && (
              <section>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-8">
                  <div className="w-1 h-10 sm:h-12 rounded-full" style={{ backgroundColor: colors.antiqueGold }} />
                  <div>
                    <h3 className="text-xl sm:text-2xl font-serif font-bold" style={{ color: colors.deepPurple }}>Commentaires des lecteurs</h3>
                    <p className="text-sm" style={{ color: colors.textLight }}>Participez à la conversation</p>
                  </div>
                  <span className="px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold ml-auto"
                        style={{ backgroundColor: colors.lightGold + '50', color: colors.antiqueGold }}>
                    {commentCount} {commentCount === 1 ? 'commentaire' : 'commentaires'} (incl. réponses)
                  </span>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {comments.slice(0, 3).map((comment) => renderCommentThread(comment, 0))}

                  {comments.length > 3 && (
                    <div className="text-center pt-6">
                      <button
                        onClick={() => setIsCommentModalOpen(true)}
                        className="font-medium flex items-center gap-2 mx-auto transition-all text-sm sm:text-base hover:underline"
                        style={{ color: colors.antiqueGold }}
                      >
                        Voir tous les {commentCount} commentaires
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Appel à l'action */}
            <section className="text-center p-8 sm:p-10 rounded-3xl"
                     style={{ background: `linear-gradient(135deg, ${colors.lightGold}20, ${colors.softIvory})`, border: `1px solid ${colors.lightGold}` }}>
              <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4" style={{ color: colors.antiqueGold }} />
              <h3 className="text-xl sm:text-2xl font-serif font-bold mb-3" style={{ color: colors.deepPurple }}>
                {commentCount === 0 ? 'Soyez le premier à commenter !' : 'Continuez la discussion'}
              </h3>
              <p className="mb-6 max-w-md mx-auto leading-relaxed text-sm sm:text-base" style={{ color: colors.textLight }}>
                {commentCount === 0
                  ? 'Vos idées pourraient inspirer une belle conversation. Partagez votre avis !'
                  : 'Qu\'en pensez-vous ? Ajoutez votre commentaire ci-dessous.'}
              </p>
              <button
                onClick={() => setIsCommentModalOpen(true)}
                className="px-6 sm:px-8 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
                style={{ backgroundColor: colors.antiqueGold, color: colors.deepPurple }}
              >
                Écrire un commentaire
              </button>
            </section>
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-1 lg:sticky lg:top-24 h-fit space-y-6 sm:space-y-8">
            {/* Carte auteur */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm text-center"
                 style={{ border: `1px solid ${colors.lightGold}` }}>
              {blog.authorImage ? (
                <img
                  src={`${import.meta.env.VITE_BASE_URL}${blog.authorImage}`}
                  alt={blog.author}
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-4 shadow-lg ring-2 ring-amber-200"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(blog.author)}&background=C9A24D&color=fff&size=80`;
                  }}
                />
              ) : (
                <div className={`w-20 h-20 bg-gradient-to-br ${getAuthorAvatar(blog.author)} rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg`}>
                  {blog.author?.charAt(0).toUpperCase() || 'A'}
                </div>
              )}
              <h4 className="font-serif font-bold text-lg mb-1" style={{ color: colors.deepPurple }}>{blog.author}</h4>
              <p className="text-xs font-medium mb-3" style={{ color: colors.antiqueGold }}>Guide Spirituel & Mentor</p>
              {blog.authorBio && (
                <p className="text-xs italic text-center" style={{ color: colors.textLight }}>{blog.authorBio}</p>
              )}
            </div>

            {/* Articles similaires */}
            {relatedBlogs.length > 0 && (
              <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm"
                   style={{ border: `1px solid ${colors.lightGold}` }}>
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="w-5 h-5" style={{ color: colors.antiqueGold }} />
                  <h4 className="font-serif font-bold text-sm sm:text-base" style={{ color: colors.deepPurple }}>Articles similaires</h4>
                </div>
                <div className="space-y-4">
                  {relatedBlogs.map(related => (
                    <Link
                      key={related._id}
                      to={`/blog/${related._id}`}
                      className="block group p-3 rounded-xl transition-all hover:bg-amber-50"
                    >
                      <div className="flex gap-3">
                        <img
                          src={related.image ? `${import.meta.env.VITE_BASE_URL}${related.image}` : 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=64&h=64&fit=crop'}
                          alt={related.title}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0 shadow-md"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=64&h=64&fit=crop';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm line-clamp-2 group-hover:text-amber-600 transition-colors"
                              style={{ color: colors.deepPurple }}>
                            {related.title}
                          </h5>
                          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: colors.textLight }}>
                            {formatDate(related.date || related.createdAt)} • {related.readTime}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </article>

      {/* Modal de commentaire */}
      <CommentModal
        blogId={id}
        isOpen={isCommentModalOpen}
        onClose={() => {
          setIsCommentModalOpen(false);
          setReplyingTo(null);
        }}
        onCommentAdded={handleCommentAdded}
        replyingTo={replyingTo}
      />
    </div>
  );
};

export default BlogDetail;