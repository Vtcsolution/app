const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = '';
    
    if (file.fieldname === 'authorImage') {
      uploadPath = path.join(__dirname, '../uploads/authors');
    } else if (file.fieldname === 'images') {
      uploadPath = path.join(__dirname, '../uploads/blogs');
    } else {
      uploadPath = path.join(__dirname, '../uploads/blogs');
    }
    
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const fieldName = file.fieldname === 'authorImage' ? 'author' : 'blog';
    cb(null, fieldName + '-' + uniqueSuffix + ext);
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 15 // Maximum number of files
  },
  fileFilter: fileFilter
});

// Export both the upload instance and helper methods
module.exports = upload;