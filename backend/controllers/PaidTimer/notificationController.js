const Notification = require('../../models/Paidtimer/Notification');
const User = require('../../models/User');
const Psychic = require('../../models/HumanChat/Psychic');

// Helper function to send notification via socket
const sendSocketNotification = (io, notificationData, recipientId, recipientModel) => {
  if (!io) return;
  
  const roomName = recipientModel === 'Psychic' 
    ? `psychic_${recipientId}` 
    : `user_${recipientId}`;
  
  io.to(roomName).emit('new_notification', {
    notification: notificationData,
    type: notificationData.type,
    unreadCount: 1
  });
  
  console.log(`📢 Socket notification sent to ${roomName}: ${notificationData.type}`);
};

// Get user notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role || 'user';
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = {
      recipient: userId,
      recipientModel: userRole === 'psychic' ? 'Psychic' : 'User'
    };

    if (unreadOnly === 'true') {
      query.isRead = false; // Changed from isRead to read
    }

    const skip = (page - 1) * limit;

    const notifications = await Notification.find(query)
      .populate('sender', 'name firstName lastName email image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false // Changed from isRead to read
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role || 'user';

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId,
      recipientModel: userRole === 'psychic' ? 'Psychic' : 'User'
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.isRead = true; // Changed from isRead to read
    notification.readAt = new Date();
    await notification.save();


    
   // In acceptChatRequest function - ADD AFTER saving notification
if (req.io) {
    // Emit to user room
    req.io.to(`user_${chatRequest.user._id}`).emit('chat_request_accepted', {
        requestId: chatRequest._id,
        chatRequest: chatRequest,
        psychicName: psychic.name,
        psychicImage: psychic.image,
        psychicId: psychic._id
    });
    
    // Also emit as notification
    req.io.to(`user_${chatRequest.user._id}`).emit('new_notification', {
        notification: {
            _id: notification._id,
            type: 'chat_accepted',
            title: notification.title,
            message: notification.message,
            data: notification.data,
            createdAt: notification.createdAt,
            isRead: notification.isRead
        }
    });
    
    console.log(`📢 Socket event emitted: chat_request_accepted to user_${chatRequest.user._id}`);
}

// In rejectChatRequest function - ADD similar code
if (req.io) {
    req.io.to(`user_${chatRequest.user}`).emit('chat_request_rejected', {
        requestId: chatRequest._id,
        psychicName: psychic.name,
        message: 'Your chat request has been rejected'
    });
}

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role || 'user';

    await Notification.updateMany(
      {
        recipient: userId,
        recipientModel: userRole === 'psychic' ? 'Psychic' : 'User',
        isRead: false // Changed from isRead to read
      },
      {
        $set: {
          isRead: true, // Changed from isRead to read
          readAt: new Date()
        }
      }
    );

    // Emit via socket
    if (req.io) {
      const roomName = userRole === 'psychic' 
        ? `psychic_${userId}` 
        : `user_${userId}`;
      
      req.io.to(roomName).emit('all_notifications_read');
    }

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role || 'user';

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
      recipientModel: userRole === 'psychic' ? 'Psychic' : 'User'
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Emit deletion via socket
    if (req.io) {
      const roomName = userRole === 'psychic' 
        ? `psychic_${userId}` 
        : `user_${userId}`;
      
      req.io.to(roomName).emit('notification_deleted', {
        notificationId: notification._id
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};