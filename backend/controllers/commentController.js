const Comment = require("../models/commentModel");
const Blog = require("../models/blogModel");

// Add comment to blog
const addComment = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { name, comment, parentComment } = req.body; // Removed email

    // Validate required fields
    if (!name || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Nom et commentaire sont requis'
      });
    }

    // Validate blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    const newComment = new Comment({
      blogId,
      name: name.trim(),
      email: `${name.trim().toLowerCase().replace(/\s+/g, '.')}@visitor.com`, // Auto-generate email
      comment: comment.trim(),
      parentComment: parentComment || null
    });

    const savedComment = await newComment.save();

    // If this is a reply, add to parent comment's replies
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, {
        $push: { replies: savedComment._id }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Commentaire ajouté avec succès',
      data: savedComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Get comments for a blog
const getBlogComments = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [comments, total] = await Promise.all([
      Comment.find({ 
        blogId, 
        parentComment: null,
        isApproved: true 
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('replies', 'name comment createdAt likes isApproved')
        .lean(),
      Comment.countDocuments({ blogId, parentComment: null, isApproved: true })
    ]);

    // Filter out unapproved replies
    const filteredComments = comments.map(comment => ({
      ...comment,
      replies: comment.replies?.filter(reply => reply.isApproved) || []
    }));

    res.status(200).json({
      success: true,
      data: filteredComments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Like a comment
const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }

    comment.likes = (comment.likes || 0) + 1;
    await comment.save();

    res.status(200).json({
      success: true,
      message: 'Commentaire aimé avec succès',
      likes: comment.likes
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Delete comment
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }

    // Delete all replies recursively
    const deleteReplies = async (commentId) => {
      const replies = await Comment.find({ parentComment: commentId });
      for (const reply of replies) {
        await deleteReplies(reply._id);
        await Comment.findByIdAndDelete(reply._id);
      }
    };

    await deleteReplies(commentId);
    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({
      success: true,
      message: 'Commentaire et toutes ses réponses supprimés avec succès'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Approve comment (admin only)
const approveComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }

    comment.isApproved = true;
    await comment.save();

    res.status(200).json({
      success: true,
      message: 'Commentaire approuvé avec succès',
      data: comment
    });
  } catch (error) {
    console.error('Error approving comment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Get all comments for admin
const getAllComments = async (req, res) => {
  try {
    const { page = 1, limit = 50, status = 'all' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status === 'pending') {
      query.isApproved = false;
    } else if (status === 'approved') {
      query.isApproved = true;
    }

    const [comments, total] = await Promise.all([
      Comment.find(query)
        .populate('blogId', 'title slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Comment.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching all comments:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

module.exports = {
  addComment,
  getBlogComments,
  likeComment,
  deleteComment,
  approveComment,
  getAllComments
};