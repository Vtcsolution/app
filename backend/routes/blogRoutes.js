const express = require('express');
const {
  addBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  likeBlog,
  toggleFeatured,
  getBlogStats,
  getCategories
} = require('../controllers/blogController');
const {
  addComment,
  getBlogComments,
  likeComment,
  deleteComment
} = require('../controllers/commentController');
const upload = require('../middleware/upload');

const router = express.Router();

// Public routes - all routes are now public (no auth required)
router.get('/', getBlogs);
router.get('/categories', getCategories);
router.get('/categories-list', async (req, res) => {
  try {
    const categoriesList = [
      'Tarot',
      'Astrology',
      'Numerology',
      'Palmistry',
      'Love & Relationships',
      'Career Guidance',
      'Spiritual Growth',
      'Dream Interpretation',
      'Meditation & Mindfulness',
      'Crystal Healing',
      'Aura Reading',
      'Past Life Regression',
      'Chakra Healing',
      'Angel Numbers',
      'Psychic Development'
    ];
    
    res.status(200).json({
      success: true,
      data: categoriesList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});
router.get('/stats', getBlogStats);
router.get('/:id', getBlogById);
router.post('/:id/like', likeBlog);

// Blog comment routes (public)
router.post('/:blogId/comments', addComment);
router.get('/:blogId/comments', getBlogComments);
router.put('/comments/:commentId/like', likeComment);

// Blog CRUD operations - now public (no admin protection)
router.post(
  '/',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 },
    { name: 'authorImage', maxCount: 1 }
  ]),
  addBlog
);

router.put(
  '/:id',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 },
    { name: 'authorImage', maxCount: 1 }
  ]),
  updateBlog
);

router.delete('/:id', deleteBlog);
router.patch('/:id/feature', toggleFeatured);
router.delete('/comments/:commentId', deleteComment);

module.exports = router;