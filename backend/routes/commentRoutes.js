const express = require('express');
const { 
  addComment, 
  getBlogComments, 
  likeComment, 
  deleteComment 
} = require('../controllers/commentController');

const router = express.Router();

// POST /api/comments/:blogId/comments
router.post('/:blogId/comments', addComment);

// GET /api/comments/:blogId/comments
router.get('/:blogId/comments', getBlogComments);

// PUT /api/comments/:commentId/like
router.put('/:commentId/like', likeComment);

// DELETE /api/comments/:commentId
router.delete('/:commentId', deleteComment);

module.exports = router;