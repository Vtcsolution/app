import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard_Navbar from './Admin_Navbar';
import Doctor_Side_Bar from './SideBar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Clock, User, Reply, Trash2, Home, Send, CheckCircle2, Clock as ClockIcon, Sparkles, MessageSquare, Users } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Color scheme matching psychic dashboard
const colors = {
  primary: "#2B1B3F",      // Deep purple
  secondary: "#C9A24D",    // Antique gold
  accent: "#9B7EDE",       // Light purple
  bgLight: "#3A2B4F",      // Lighter purple
  textLight: "#E8D9B0",    // Light gold text
  success: "#10B981",      // Green
  warning: "#F59E0B",      // Yellow
  danger: "#EF4444",       // Red
  background: "#F5F3EB",   // Soft ivory
};

const Send_Mail = () => {
  const [side, setSide] = useState(false);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [emailStats, setEmailStats] = useState({ totalMessages: 0, newMessages: 0, repliedMessages: 0 });
  const [loading, setLoading] = useState(true);
  const [messagePage, setMessagePage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [messagePagination, setMessagePagination] = useState({ totalPages: 1 });
  const [userPagination, setUserPagination] = useState({ totalPages: 1 });
  const [replyData, setReplyData] = useState({ subject: '', message: '', toEmail: '' });
  const [userEmailData, setUserEmailData] = useState({ subject: '', message: '', userId: '' });
  const [currentMessage, setCurrentMessage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [sendingReply, setSendingReply] = useState(false);
  const [sendingUserEmail, setSendingUserEmail] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [quickSendData, setQuickSendData] = useState({ toEmail: '', subject: '', message: '' });
  const [sendingQuickEmail, setSendingQuickEmail] = useState(false);

  const navigate = useNavigate();
  const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || 'https://www.spiritueelchatten.nl';
  const ITEMS_PER_PAGE = 10;

  const user = {
    name: "User",
    email: "user@gmail.com",
    profile: "https://avatars.mds.yandex.net/i?id=93f523ab7f890b9175f222cd947dc36ccbd81bf7-9652646-images-thumbs&n=13"
  };

  // Handle homepage redirect
  const handleHomepageRedirect = () => {
    window.open(WEBSITE_URL, '_blank');
  };

  // Fetch all messages with pagination
  const fetchMessages = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/messages`, {
        params: { page, limit: ITEMS_PER_PAGE }
      });
      setMessages(response.data.data || []);
      setMessagePagination(response.data.pagination || { totalPages: 1 });
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users with pagination
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/users`, {
        params: { page, limit: ITEMS_PER_PAGE }
      });
      setUsers(response.data.data || []);
      setUserPagination(response.data.pagination || { totalPages: 1 });
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch email statistics
  const fetchEmailStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/users/stats`);
      setEmailStats(response.data.data || { totalMessages: 0, newMessages: 0, repliedMessages: 0 });
    } catch (error) {
      console.error('Error fetching email stats:', error);
      toast.error('Failed to fetch email stats');
    }
  };

  useEffect(() => {
    fetchMessages(messagePage);
    fetchUsers(userPage);
    fetchEmailStats();
  }, [messagePage, userPage]);

  // Get reply status for a message
  const getReplyStatus = (message) => {
    if (!message || !message.hasReplied) {
      return { replied: false, repliedAt: null, replyContent: null };
    }
    return { replied: true, repliedAt: message.repliedAt, replyContent: message.replyContent };
  };

  // Format reply status display for messages
  const renderReplyStatus = (message) => {
    const status = getReplyStatus(message);
    if (!status.replied) {
      return (
        <div className="flex items-center gap-1 text-xs" style={{ color: colors.warning }}>
          <ClockIcon className="h-3 w-3" />
          <span>Pending Reply</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-xs" style={{ color: colors.success }}>
        <CheckCircle2 className="h-3 w-3" />
        <span>Replied</span>
        <span className="ml-1" style={{ color: colors.primary + '70' }}>
          {format(new Date(status.repliedAt), 'MMM dd')}
        </span>
      </div>
    );
  };

  // Format reply status for users
  const renderUserReplyStatus = (user) => {
    if (user.repliedMessages > 0) {
      return (
        <Badge 
          className="border"
          style={{
            backgroundColor: colors.success + '10',
            color: colors.success,
            borderColor: colors.success + '30',
          }}
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Replied
        </Badge>
      );
    }
    return (
      <Badge 
        className="border"
        style={{
          backgroundColor: colors.primary + '10',
          color: colors.primary + '70',
          borderColor: colors.primary + '20',
        }}
      >
        <ClockIcon className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  // Handle reply
  const handleReply = async () => {
    if (!replyData.message.trim()) {
      toast.error('Please enter a reply message');
      return;
    }
    try {
      setSendingReply(true);
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/messages/reply`, {
        toEmail: replyData.toEmail,
        subject: replyData.subject,
        message: replyData.message,
        messageId: currentMessage._id
      });
      if (response.data.success) {
        toast.success('Reply sent successfully!');
        setReplyData({ subject: '', message: '', toEmail: '' });
        setCurrentMessage(null);
        setIsEditing(false);
        fetchMessages(messagePage);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/messages/${messageId}`);
      toast.success('Message deleted successfully');
      fetchMessages(messagePage);
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  // Open reply dialog
  const openReplyDialog = (message) => {
    setCurrentMessage(message);
    setIsEditing(false);
    setReplyData({
      toEmail: message.email,
      subject: `Re: ${message.name}'s Message`,
      message: ''
    });
  };

  // Handle quick send email
  const handleQuickSend = async (e) => {
    e.preventDefault();
    const { toEmail, subject, message } = quickSendData;
    if (!toEmail.trim() || !subject.trim() || !message.trim()) {
      toast.error('All fields are required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    try {
      setSendingQuickEmail(true);
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/messages/quick-send`, {
        toEmail,
        subject,
        message
      });
      if (response.data.success) {
        toast.success('Email sent successfully!');
        setQuickSendData({ toEmail: '', subject: '', message: '' });
      }
    } catch (error) {
      console.error('Error sending quick email:', error);
      toast.error(error.response?.data?.error || 'Failed to send email');
    } finally {
      setSendingQuickEmail(false);
    }
  };

  // Handle send email to user
  const handleSendUserEmail = async () => {
    if (!userEmailData.message.trim() || !userEmailData.subject.trim()) {
      toast.error('Subject and message are required');
      return;
    }
    try {
      setSendingUserEmail(true);
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/users/send-email`, {
        userId: currentUser._id,
        subject: userEmailData.subject,
        message: userEmailData.message
      });
      if (response.data.success) {
        toast.success('Email sent successfully!');
        setUserEmailData({ subject: '', message: '', userId: '' });
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Error sending user email:', error);
      toast.error('Failed to send email');
    } finally {
      setSendingUserEmail(false);
    }
  };

  // Open user email dialog
  const openUserEmailDialog = (user) => {
    setCurrentUser(user);
    setUserEmailData({
      userId: user._id,
      subject: `Message for ${user.name}`,
      message: ''
    });
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: colors.background }}>
        <Dashboard_Navbar side={side} setSide={setSide} user={user}/>
        <div className="flex pt-16">
          <Doctor_Side_Bar side={side} setSide={setSide} user={user}/>
          <div className="flex-1 min-h-screen p-4 md:p-6 lg:p-8 ml-0 lg:ml-64 flex items-center justify-center">
            <div className="text-center">
              <div 
                className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4"
                style={{ 
                  borderColor: colors.secondary,
                  borderTopColor: 'transparent',
                }}
              ></div>
              <p style={{ color: colors.primary + '70' }}>Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: colors.background }}>
      <Dashboard_Navbar side={side} setSide={setSide} user={user} />
      <div className="flex pt-16">
        <Doctor_Side_Bar side={side} setSide={setSide} user={user} />
        <div className="flex-1 min-h-screen p-4 md:p-6 lg:p-8 ml-0 lg:ml-64">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-6 w-6" style={{ color: colors.secondary }} />
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.primary }}>
                Email Management
              </h1>
            </div>
            <p className="" style={{ color: colors.primary + '80' }}>
              Manage messages and send emails to users
            </p>
          </div>

          <div className="mx-2 md:mx-4 mt-6">
            <Tabs defaultValue="messages" className="w-full">
              {/* Messages Tab */}
              <TabsContent value="messages">
                {/* Messages Card */}
                <Card 
                  className="border-none shadow-lg mb-6"
                  style={{ 
                    background: `linear-gradient(135deg, white 0%, ${colors.primary}03 100%)`,
                    borderColor: colors.primary + '10',
                  }}
                >
                  <CardHeader className="pb-3" style={{ borderBottomColor: colors.primary + '10' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: colors.accent + '10' }}
                        >
                          <MessageSquare className="h-5 w-5" style={{ color: colors.accent }} />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
                            Inbox Messages
                            <Badge 
                              className="ml-2"
                              style={{
                                backgroundColor: colors.secondary,
                                color: colors.primary,
                              }}
                            >
                              {emailStats.totalMessages}
                            </Badge>
                          </CardTitle>
                          <CardDescription style={{ color: colors.primary + '70' }}>
                            <span className="mr-4" style={{ color: colors.success }}>{emailStats.repliedMessages} replied</span>
                            <span style={{ color: colors.warning }}>{emailStats.newMessages} new</span>
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleHomepageRedirect}
                        style={{
                          borderColor: colors.secondary,
                          color: colors.secondary,
                        }}
                      >
                        <Home className="h-4 w-4 mr-2" />
                        Visit Site
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {messages.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4" style={{ color: colors.primary + '20' }} />
                        <h3 className="text-lg font-medium mb-2" style={{ color: colors.primary }}>No messages yet</h3>
                        <p style={{ color: colors.primary + '70' }}>Messages from users will appear here.</p>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-lg overflow-hidden border" style={{ borderColor: colors.primary + '20' }}>
                          <Table>
                            <TableHeader>
                              <TableRow style={{ backgroundColor: colors.primary + '05' }}>
                                <TableHead style={{ color: colors.primary }}>Sender</TableHead>
                                <TableHead style={{ color: colors.primary }}>Email</TableHead>
                                <TableHead style={{ color: colors.primary }}>Message</TableHead>
                                <TableHead style={{ color: colors.primary }}>Date</TableHead>
                                <TableHead style={{ color: colors.primary, textAlign: 'center' }}>Status</TableHead>
                                <TableHead style={{ color: colors.primary, textAlign: 'right' }}>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {messages.map((message, index) => {
                                const replyStatus = getReplyStatus(message);
                                return (
                                  <TableRow 
                                    key={message._id}
                                    style={{ 
                                      backgroundColor: index % 2 === 0 ? colors.primary + '02' : 'white',
                                    }}
                                  >
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <div 
                                          className="w-10 h-10 rounded-full flex items-center justify-center"
                                          style={{ backgroundColor: colors.accent + '10' }}
                                        >
                                          <User className="h-5 w-5" style={{ color: colors.accent }} />
                                        </div>
                                        <div>
                                          <p className="font-medium" style={{ color: colors.primary }}>{message.name}</p>
                                          <p className="text-sm" style={{ color: colors.primary + '70' }}>From {message.email}</p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-mono text-sm" style={{ color: colors.primary }}>
                                        {message.email}
                                      </div>
                                      <div className="mt-1">{renderReplyStatus(message)}</div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="max-w-md">
                                        <p className="text-sm line-clamp-2" style={{ color: colors.primary }}>
                                          {message.message}
                                        </p>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center text-sm" style={{ color: colors.primary + '70' }}>
                                        <Clock className="h-4 w-4 mr-1" />
                                        {format(new Date(message.createdAt), 'MMM dd, yyyy')}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {replyStatus.replied ? (
                                        <Badge 
                                          className="border"
                                          style={{
                                            backgroundColor: colors.success + '10',
                                            color: colors.success,
                                            borderColor: colors.success + '30',
                                          }}
                                        >
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Replied
                                        </Badge>
                                      ) : (
                                        <Badge 
                                          className="border"
                                          style={{
                                            backgroundColor: colors.warning + '10',
                                            color: colors.warning,
                                            borderColor: colors.warning + '30',
                                          }}
                                        >
                                          <ClockIcon className="h-3 w-3 mr-1" />
                                          Pending
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex gap-2 justify-end">
                                        {/* Reply Dialog */}
                                        <Dialog open={currentMessage?._id === message._id}>
                                          <DialogTrigger asChild>
                                            <Button
                                              size="sm"
                                              onClick={() => openReplyDialog(message)}
                                              style={{
                                                backgroundColor: replyStatus.replied ? colors.accent + '10' : colors.secondary,
                                                color: replyStatus.replied ? colors.accent : colors.primary,
                                                borderColor: replyStatus.replied ? colors.accent + '20' : colors.secondary,
                                              }}
                                            >
                                              <Reply className="h-4 w-4 mr-1" />
                                              {replyStatus.replied ? 'View' : 'Reply'}
                                            </Button>
                                          </DialogTrigger>
                                          {currentMessage?._id === message._id && (
                                            <DialogContent 
                                              className="sm:max-w-[500px] max-h-[90vh] flex flex-col"
                                              style={{ 
                                                backgroundColor: colors.background,
                                                borderColor: colors.primary + '20',
                                              }}
                                            >
                                              <DialogHeader className="flex-shrink-0">
                                                <DialogTitle style={{ color: colors.primary }}>
                                                  Reply to {currentMessage.name}
                                                </DialogTitle>
                                                <DialogDescription style={{ color: colors.primary + '70' }}>
                                                  Replying to: {currentMessage.email}
                                                </DialogDescription>
                                              </DialogHeader>
                                              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                                                {/* Original Message */}
                                                <Card 
                                                  className="border-none"
                                                  style={{ 
                                                    backgroundColor: colors.primary + '05',
                                                    borderColor: colors.primary + '20',
                                                  }}
                                                >
                                                  <CardContent className="pt-4">
                                                    <div className="flex items-start gap-3 mb-3">
                                                      <div 
                                                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                                        style={{ backgroundColor: colors.accent + '10' }}
                                                      >
                                                        <User className="h-4 w-4" style={{ color: colors.accent }} />
                                                      </div>
                                                      <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                          <span className="font-medium text-sm" style={{ color: colors.primary }}>
                                                            {currentMessage.name}
                                                          </span>
                                                          <Badge 
                                                            className="text-xs"
                                                            style={{
                                                              backgroundColor: colors.primary + '10',
                                                              color: colors.primary,
                                                            }}
                                                          >
                                                            Original
                                                          </Badge>
                                                        </div>
                                                        <p className="text-xs mb-2" style={{ color: colors.primary + '70' }}>
                                                          {format(new Date(currentMessage.createdAt), 'MMM dd, yyyy HH:mm')}
                                                        </p>
                                                        <p className="text-sm whitespace-pre-wrap" style={{ color: colors.primary }}>
                                                          {currentMessage.message}
                                                        </p>
                                                      </div>
                                                    </div>
                                                  </CardContent>
                                                </Card>

                                                {/* Previous Reply (if exists) */}
                                                {getReplyStatus(currentMessage)?.replied && !isEditing && (
                                                  <Card 
                                                    className="border-none"
                                                    style={{ 
                                                      backgroundColor: colors.success + '05',
                                                      borderColor: colors.success + '20',
                                                    }}
                                                  >
                                                    <CardContent className="pt-4">
                                                      <div className="flex items-start gap-3 mb-3">
                                                        <div 
                                                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                                          style={{ backgroundColor: colors.success + '10' }}
                                                        >
                                                          <Reply className="h-4 w-4" style={{ color: colors.success }} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                          <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-medium text-sm" style={{ color: colors.primary }}>
                                                              Your Reply
                                                            </span>
                                                            <Badge 
                                                              className="text-xs"
                                                              style={{
                                                                backgroundColor: colors.success + '10',
                                                                color: colors.success,
                                                              }}
                                                            >
                                                              Sent
                                                            </Badge>
                                                          </div>
                                                          <p className="text-xs mb-2" style={{ color: colors.primary + '70' }}>
                                                            {format(new Date(getReplyStatus(currentMessage).repliedAt), 'MMM dd, yyyy HH:mm')}
                                                          </p>
                                                          <p className="text-sm whitespace-pre-wrap" style={{ color: colors.success }}>
                                                            {getReplyStatus(currentMessage).replyContent}
                                                          </p>
                                                        </div>
                                                      </div>
                                                    </CardContent>
                                                  </Card>
                                                )}

                                                {/* Reply Form (if no reply or editing) */}
                                                {(!getReplyStatus(currentMessage)?.replied || isEditing) && (
                                                  <div className="space-y-3">
                                                    <div className="space-y-1">
                                                      <Label htmlFor="replySubject" className="text-sm font-medium" style={{ color: colors.primary }}>
                                                        Subject
                                                      </Label>
                                                      <Input
                                                        id="replySubject"
                                                        type="text"
                                                        value={replyData.subject}
                                                        onChange={(e) => setReplyData({ ...replyData, subject: e.target.value })}
                                                        placeholder="Re: Your message"
                                                        style={{ borderColor: colors.primary + '20' }}
                                                      />
                                                    </div>
                                                    <div className="space-y-1">
                                                      <Label htmlFor="replyMessage" className="text-sm font-medium" style={{ color: colors.primary }}>
                                                        Your Reply
                                                      </Label>
                                                      <Textarea
                                                        id="replyMessage"
                                                        value={replyData.message}
                                                        onChange={(e) => setReplyData({ ...replyData, message: e.target.value })}
                                                        placeholder="Type your reply here..."
                                                        rows={6}
                                                        className="resize-none"
                                                        style={{ borderColor: colors.primary + '20' }}
                                                      />
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                              <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4" style={{ borderColor: colors.primary + '10' }}>
                                                <Button
                                                  variant="outline"
                                                  onClick={() => {
                                                    setCurrentMessage(null);
                                                    setReplyData({ subject: '', message: '', toEmail: '' });
                                                    setIsEditing(false);
                                                  }}
                                                  style={{
                                                    borderColor: colors.primary + '20',
                                                    color: colors.primary,
                                                  }}
                                                >
                                                  {getReplyStatus(currentMessage)?.replied && !isEditing ? 'Close' : 'Cancel'}
                                                </Button>
                                                {(!getReplyStatus(currentMessage)?.replied || isEditing) && (
                                                  <Button
                                                    onClick={handleReply}
                                                    disabled={sendingReply || !replyData.message.trim()}
                                                    style={{
                                                      backgroundColor: colors.secondary,
                                                      color: colors.primary,
                                                    }}
                                                  >
                                                    {sendingReply ? (
                                                      <>
                                                        <div 
                                                          className="w-4 h-4 border-2 rounded-full animate-spin mr-2"
                                                          style={{ 
                                                            borderColor: colors.primary,
                                                            borderTopColor: 'transparent',
                                                          }}
                                                        ></div>
                                                        Sending...
                                                      </>
                                                    ) : (
                                                      isEditing ? 'Update Reply' : 'Send Reply'
                                                    )}
                                                  </Button>
                                                )}
                                              </DialogFooter>
                                            </DialogContent>
                                          )}
                                        </Dialog>

                                        {/* Delete Button */}
                                        <Button
                                          size="sm"
                                          onClick={() => handleDeleteMessage(message._id)}
                                          style={{
                                            backgroundColor: colors.danger + '10',
                                            color: colors.danger,
                                            borderColor: colors.danger + '20',
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-between items-center mt-6 pt-4" style={{ borderTopColor: colors.primary + '10' }}>
                          <Button
                            variant="outline"
                            disabled={messagePage === 1}
                            onClick={() => setMessagePage(prev => prev - 1)}
                            style={{
                              borderColor: colors.secondary,
                              color: messagePage === 1 ? colors.primary + '40' : colors.secondary,
                            }}
                          >
                            Previous
                          </Button>
                          <span className="text-sm px-3 py-1 rounded-md" style={{ 
                            backgroundColor: colors.primary + '05',
                            color: colors.primary,
                          }}>
                            Page {messagePage} of {messagePagination.totalPages}
                          </span>
                          <Button
                            variant="outline"
                            disabled={messagePage === messagePagination.totalPages}
                            onClick={() => setMessagePage(prev => prev + 1)}
                            style={{
                              borderColor: colors.secondary,
                              color: messagePage === messagePagination.totalPages ? colors.primary + '40' : colors.secondary,
                            }}
                          >
                            Next
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Send Email Card */}
                <Card 
                  className="border-none shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, white 0%, ${colors.primary}03 100%)`,
                    borderColor: colors.primary + '10',
                  }}
                >
                  <CardHeader className="pb-3" style={{ borderBottomColor: colors.primary + '10' }}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: colors.success + '10' }}
                      >
                        <Send className="h-5 w-5" style={{ color: colors.success }} />
                      </div>
                      <div>
                        <CardTitle style={{ color: colors.primary }}>Quick Send Email</CardTitle>
                        <CardDescription style={{ color: colors.primary + '70' }}>
                          Send a new email to any user
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form className="space-y-4" onSubmit={handleQuickSend}>
                      <div className="space-y-2">
                        <Label htmlFor="quickEmail" className="font-medium" style={{ color: colors.primary }}>
                          Email Address <span style={{ color: colors.danger }}>*</span>
                        </Label>
                        <Input
                          id="quickEmail"
                          type="email"
                          placeholder="user@example.com"
                          value={quickSendData.toEmail}
                          onChange={(e) => setQuickSendData({ ...quickSendData, toEmail: e.target.value })}
                          style={{ borderColor: colors.primary + '20' }}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quickSubject" className="font-medium" style={{ color: colors.primary }}>
                          Subject <span style={{ color: colors.danger }}>*</span>
                        </Label>
                        <Input
                          id="quickSubject"
                          type="text"
                          placeholder="Enter email subject"
                          value={quickSendData.subject}
                          onChange={(e) => setQuickSendData({ ...quickSendData, subject: e.target.value })}
                          style={{ borderColor: colors.primary + '20' }}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quickMessage" className="font-medium" style={{ color: colors.primary }}>
                          Message <span style={{ color: colors.danger }}>*</span>
                        </Label>
                        <Textarea
                          id="quickMessage"
                          placeholder="Type your message here..."
                          rows={4}
                          value={quickSendData.message}
                          onChange={(e) => setQuickSendData({ ...quickSendData, message: e.target.value })}
                          className="resize-none"
                          style={{ borderColor: colors.primary + '20' }}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full hover:scale-[1.02] transition-transform duration-200"
                        disabled={sendingQuickEmail}
                        style={{
                          backgroundColor: colors.secondary,
                          color: colors.primary,
                        }}
                      >
                        {sendingQuickEmail ? (
                          <>
                            <div 
                              className="w-4 h-4 border-2 rounded-full animate-spin mr-2"
                              style={{ 
                                borderColor: colors.primary,
                                borderTopColor: 'transparent',
                              }}
                            ></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Email
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Send_Mail;