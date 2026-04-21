import React, { useState, useEffect } from 'react';
import { 
  Search, Clock, User, ArrowRight, Filter, ChevronDown, Calendar, Eye, 
  TrendingUp, BookOpen, Star, Sparkles, Heart, MessageCircle, 
  Share2, Tag, Zap, Moon, Sun, Crown, Gem, Hand, Flower2, Feather, Compass, 
  Diamond, Cloud, Infinity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Helmet } from "react-helmet-async";

const BlogsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [visibleArticles, setVisibleArticles] = useState(6);
  const [blogs, setBlogs] = useState([]);
  const [error, setError] = useState(null);

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

  // Catégories spirituelles et psychiques - Doivent correspondre EXACTEMENT aux catégories du backend
  // Les catégories backend sont en anglais, donc nous utilisons les noms anglais pour le filtrage
  const categories = [
    { name: 'Tous', filterValue: null, icon: Sparkles },
    { name: 'Tarot', filterValue: 'Tarot', icon: Star },
    { name: 'Astrologie', filterValue: 'Astrology', icon: Sun },
    { name: 'Numérologie', filterValue: 'Numerology', icon: Gem },
    { name: 'Palmisterie', filterValue: 'Palmistry', icon: Hand },
    { name: 'Relations Amoureuses', filterValue: 'Love & Relationships', icon: Heart },
    { name: 'Guidance Spirituelle', filterValue: 'Spiritual Growth', icon: Moon },
    { name: 'Interprétation des Rêves', filterValue: 'Dream Interpretation', icon: MessageCircle },
    { name: 'Méditation', filterValue: 'Meditation & Mindfulness', icon: Flower2 },
    { name: 'Guérison par les Cristaux', filterValue: 'Crystal Healing', icon: Diamond },
    { name: 'Lecture de l\'Aura', filterValue: 'Aura Reading', icon: Feather },
    { name: 'Régression des Vies Antérieures', filterValue: 'Past Life Regression', icon: Infinity },
    { name: 'Guérison des Chakras', filterValue: 'Chakra Healing', icon: Zap },
    { name: 'Nombres Angéliques', filterValue: 'Angel Numbers', icon: Cloud },
    { name: 'Développement Psychique', filterValue: 'Psychic Development', icon: Crown },
    { name: 'Conseils de Carrière', filterValue: 'Career Guidance', icon: Compass }
  ];

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/blogs`);
        
        if (response.data && response.data.data) {
          console.log('Blogs chargés:', response.data.data); // Debug log
          setBlogs(response.data.data);
        } else {
          setBlogs([]);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des blogs:', err);
        setError('Impossible de charger les articles. Veuillez réessayer.');
        setBlogs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  // Filtrer les blogs par catégorie et recherche
  const filteredBlogs = blogs.filter(blog => {
    // Trouver la catégorie sélectionnée
    const selectedCat = categories.find(c => c.name === selectedCategory);
    const categoryFilterValue = selectedCat?.filterValue;
    
    const matchesCategory = selectedCategory === 'Tous' || blog.category === categoryFilterValue;
    const matchesSearch = blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Debug log pour voir le filtrage
    if (selectedCategory !== 'Tous') {
      console.log(`Filtrage: blog.category="${blog.category}" vs filter="${categoryFilterValue}" => ${matchesCategory}`);
    }
    
    return matchesCategory && matchesSearch;
  });

  // Articles tendance
  const trendingBlogs = blogs.filter(blog => blog.trending).slice(0, 3);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  );

  const BlogCard = ({ blog }) => (
    <motion.div 
      whileHover={{ y: -5 }}
      className="group relative overflow-hidden rounded-2xl bg-white hover:shadow-2xl transition-all duration-500 w-full text-left border"
      style={{ borderColor: colors.lightGold }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#C9A24D]/5 to-[#9B7EDE]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative">
        <div className="relative overflow-hidden h-56">
          <img 
            src={blog.image ? `${import.meta.env.VITE_BASE_URL}${blog.image}` : 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=600&h=400&fit=crop'}
            alt={blog.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=600&h=400&fit=crop';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {blog.trending && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold rounded-full shadow-lg">
                <TrendingUp className="w-3 h-3" />
                Tendance
              </span>
            )}
            {blog.featured && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-semibold rounded-full shadow-lg">
                <Star className="w-3 h-3 fill-current" />
                À la une
              </span>
            )}
          </div>

          {/* Vues */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1 px-2 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm">
            <Eye className="w-3 h-3" />
            {blog.views || 0}
          </div>
        </div>

        <div className="p-6">
          {/* Catégorie */}
          <div className="flex items-center gap-2 mb-3">
            <span 
              className="px-3 py-1 text-xs font-medium rounded-full"
              style={{ 
                backgroundColor: colors.lightGold,
                color: colors.deepPurple
              }}
            >
              {/* Afficher le nom français de la catégorie */}
              {categories.find(c => c.filterValue === blog.category)?.name || blog.category}
            </span>
          </div>

          {/* Titre */}
          <h3 className="font-serif font-bold mb-3 group-hover:text-[#C9A24D] transition-colors duration-300 line-clamp-2 text-xl"
              style={{ color: colors.deepPurple }}>
            {blog.title}
          </h3>

          {/* Extrait */}
          <p className="mb-4 line-clamp-3 leading-relaxed text-sm"
             style={{ color: colors.textLight }}>
            {blog.excerpt}
          </p>

          {/* Métadonnées */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1" style={{ color: colors.textLight }}>
                <User className="w-3 h-3" />
                {blog.author}
              </div>
              <div className="flex items-center gap-1" style={{ color: colors.textLight }}>
                <Calendar className="w-3 h-3" />
                {formatDate(blog.date || blog.createdAt)}
              </div>
              <div className="flex items-center gap-1" style={{ color: colors.textLight }}>
                <Clock className="w-3 h-3" />
                {blog.readTime}
              </div>
            </div>
            <Link 
              to={`/blog/${blog._id}`}
              className="flex items-center gap-1 font-medium transition-colors duration-300 text-sm"
              style={{ color: colors.antiqueGold }}
            >
              Lire la suite
              <ArrowRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.softIvory }}>
      <Helmet>
        <title>Articles Spirituels | Tarot, Astrologie & Guidance | Voyance Magique</title>
        <meta
          name="description"
          content="Découvrez nos articles spirituels sur le tarot, l'astrologie, la numérologie et bien plus encore. Explorez la sagesse ancestrale et trouvez des réponses à vos questions."
        />
        <meta name="keywords" content="tarot, astrologie, numérologie, spiritualité, guidance spirituelle, voyance, développement personnel" />
        <link rel="canonical" href="https://voyancemagique.com/blogs" />
      </Helmet>

      {/* Section Héro */}
      <section className="relative overflow-hidden py-20 lg:py-28"
               style={{ 
                 background: `linear-gradient(135deg, ${colors.deepPurple} 0%, ${colors.darkPurple} 100%)`
               }}>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#C9A24D]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#9B7EDE]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm">
                <Sparkles className="h-8 w-8" style={{ color: colors.antiqueGold }} />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6"
                style={{ color: colors.lightGold }}>
              Sagesse Spirituelle
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed"
               style={{ color: colors.softIvory }}>
              Explorez les mystères de l'univers et découvrez des conseils pour votre cheminement spirituel
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Barre de recherche et filtres */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Recherche */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5"
                     style={{ color: colors.textLight }} />
              <input
                type="text"
                placeholder="Rechercher un article..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 bg-white"
                style={{
                  border: `1px solid ${colors.lightGold}`,
                  color: colors.deepPurple,
                  focusRingColor: colors.antiqueGold
                }}
              />
            </div>

            {/* Filtres par catégorie - Version responsive */}
            <div className="relative w-full lg:w-auto">
              {/* Version desktop - affichage normal */}
              <div className="hidden md:flex flex-wrap gap-2 justify-center">
                {categories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                        selectedCategory === category.name
                          ? 'text-white shadow-lg'
                          : 'bg-white hover:shadow-md'
                      }`}
                      style={{
                        backgroundColor: selectedCategory === category.name ? colors.antiqueGold : colors.white,
                        color: selectedCategory === category.name ? colors.white : colors.deepPurple,
                        border: `1px solid ${colors.lightGold}`
                      }}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="whitespace-nowrap">{category.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Version mobile - sélecteur déroulant */}
              <div className="md:hidden w-full">
                <div className="relative">
                  <button
                    onClick={() => {
                      const dropdown = document.getElementById('categoryDropdown');
                      if (dropdown) dropdown.classList.toggle('hidden');
                    }}
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-white"
                    style={{
                      border: `1px solid ${colors.lightGold}`,
                      color: colors.deepPurple
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {categories.find(c => c.name === selectedCategory)?.icon && 
                        React.createElement(categories.find(c => c.name === selectedCategory).icon, { className: "w-4 h-4" })}
                      <span>{selectedCategory}</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <div 
                    id="categoryDropdown"
                    className="hidden absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border z-20 max-h-64 overflow-y-auto"
                    style={{ borderColor: colors.lightGold }}
                  >
                    {categories.map((category) => {
                      const IconComponent = category.icon;
                      return (
                        <button
                          key={category.name}
                          onClick={() => {
                            setSelectedCategory(category.name);
                            document.getElementById('categoryDropdown')?.classList.add('hidden');
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors ${
                            selectedCategory === category.name
                              ? 'bg-[#C9A24D]/10'
                              : 'hover:bg-gray-50'
                          }`}
                          style={{
                            color: selectedCategory === category.name ? colors.antiqueGold : colors.deepPurple
                          }}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span>{category.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Version tablette - défilement horizontal */}
              <div className="hidden sm:block md:hidden w-full overflow-x-auto pb-2">
                <div className="flex gap-2 min-w-max">
                  {categories.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <button
                        key={category.name}
                        onClick={() => setSelectedCategory(category.name)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                          selectedCategory === category.name
                            ? 'text-white shadow-lg'
                            : 'bg-white hover:shadow-md'
                        }`}
                        style={{
                          backgroundColor: selectedCategory === category.name ? colors.antiqueGold : colors.white,
                          color: selectedCategory === category.name ? colors.white : colors.deepPurple,
                          border: `1px solid ${colors.lightGold}`
                        }}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{category.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Affichage du nombre de résultats */}
          <div className="mt-4 text-sm text-center" style={{ color: colors.textLight }}>
            {!isLoading && (
              <span>
                {filteredBlogs.length} {filteredBlogs.length === 1 ? 'article trouvé' : 'articles trouvés'}
                {selectedCategory !== 'Tous' && ` dans la catégorie "${selectedCategory}"`}
                {searchTerm && ` pour "${searchTerm}"`}
              </span>
            )}
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-8 p-4 rounded-xl text-center"
               style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Articles récents */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-6 h-6" style={{ color: colors.antiqueGold }} />
            <h2 className="text-2xl md:text-3xl font-serif font-bold"
                style={{ color: colors.deepPurple }}>
              Articles Récents {!isLoading && `(${filteredBlogs.length})`}
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r"
                 style={{ background: `linear-gradient(90deg, ${colors.antiqueGold} 0%, transparent 100%)` }} />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <LoadingSkeleton key={i} />
              ))}
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-lg mb-4" style={{ color: colors.textLight }}>
                {blogs.length === 0 ? 'Aucun article disponible pour le moment.' : 'Aucun article ne correspond à votre recherche.'}
              </div>
              {blogs.length === 0 && (
                <div className="text-sm" style={{ color: colors.antiqueGold }}>
                  Revenez bientôt pour découvrir de nouveaux articles spirituels !
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {filteredBlogs.slice(0, visibleArticles).map((blog, index) => (
                  <motion.div
                    key={blog._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <BlogCard blog={blog} />
                  </motion.div>
                ))}
              </div>

              {filteredBlogs.length > visibleArticles && (
                <div className="text-center">
                  <button
                    onClick={() => setVisibleArticles(prev => prev + 6)}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    style={{
                      backgroundColor: colors.antiqueGold,
                      color: colors.deepPurple
                    }}
                  >
                    Charger plus d'articles
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Articles tendance */}
        {trendingBlogs.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="w-6 h-6" style={{ color: colors.antiqueGold }} />
              <h2 className="text-2xl md:text-3xl font-serif font-bold"
                  style={{ color: colors.deepPurple }}>
                Articles Tendances
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r"
                   style={{ background: `linear-gradient(90deg, ${colors.antiqueGold} 0%, transparent 100%)` }} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trendingBlogs.map((blog, index) => (
                <motion.div
                  key={blog._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                >
                  <BlogCard blog={blog} />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};


export default BlogsPage;