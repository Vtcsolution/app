import { useEffect, useState } from 'react';
import axios from 'axios';
import Dashboard_Navbar from './Admin_Navbar';
import Doctor_Side_Bar from './SideBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Eye, MoreHorizontal, Star, Trash2, MessageSquare, AlertCircle } from 'lucide-react';

const Reviewss = ({ side, setSide, admin }) => {
  const [feedbackData, setFeedbackData] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;

  // Fetch feedback from backend
  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/ratings?page=${currentPage}&limit=${pageSize}`,
          { withCredentials: true }
        );
        
        console.log('Feedback API Response:', response.data);
        
        // Check if response has data and it's an array
        if (response.data && response.data.feedback && Array.isArray(response.data.feedback)) {
          setFeedbackData(response.data.feedback);
          setTotalPages(response.data.totalPages || 1);
        } else {
          // If no feedback data, set empty array
          setFeedbackData([]);
          setTotalPages(1);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setError(err.response?.data?.message || 'Failed to load feedback');
        setFeedbackData([]); // Set empty array on error
        setLoading(false);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchFeedback();
  }, [currentPage]);

  // Delete feedback by ID
  const handleDelete = async (feedbackId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/feedback/${feedbackId}`, {
        withCredentials: true,
      });
      // Filter out the deleted feedback
      setFeedbackData((prev) => {
        const newData = prev.filter((fb) => fb._id !== feedbackId);
        // Recalculate total pages
        setTotalPages(Math.ceil(Math.max(newData.length, 1) / pageSize));
        return newData;
      });
      
      // If current page becomes empty and it's not the first page, go back
      if (feedbackData.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
      setError('Failed to delete feedback');
    }
  };

  // Pagination controls
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not provided";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const renderRating = (rating) => {
    if (rating === undefined || rating === null) return <span className="text-gray-400">No rating</span>;
    
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
        />
      );
    }
    return <div className="flex">{stars}</div>;
  };

  // Check if feedbackData is valid and has items
  const hasFeedback = feedbackData && Array.isArray(feedbackData) && feedbackData.length > 0;

  return (
    <div>
      <Dashboard_Navbar side={side} setSide={setSide} user={admin} />
      <div className="dashboard-wrapper flex pt-16">
        <Doctor_Side_Bar side={side} setSide={setSide} user={admin} />
        <div className="dashboard-side flex-1 min-h-screen p-4 md:p-6 lg:p-8 ml-0 lg:ml-64">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-sans font-extrabold text-center my-6">Reviews</h2>
          <div className="rounded-md border overflow-hidden mx-2 md:mx-4 overflow-x-auto backdrop-blur-md shadow-xl transition-all duration-500 hover:shadow-2xl hover:translate-y-[-5px]">
            <Card
              className={`w-full bg-white/10 border-white/20 backdrop-blur-md shadow-xl transition-all duration-500 hover:shadow-2xl hover:translate-y-[-5px] ${isLoaded ? "animate-slide-in-bottom opacity-100" : "opacity-0"}`}
              style={{ animationDelay: "1.3s" }}
            >
              <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                  <CardTitle>Reviews</CardTitle>
                  <CardDescription>Recently submitted feedback</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center text-gray-500 py-10 flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    Loading feedback...
                  </div>
                ) : error ? (
                  <div className="text-center text-red-500 py-10 flex flex-col items-center gap-3">
                    <AlertCircle className="h-12 w-12" />
                    <p>{error}</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentPage(1)}
                      className="mt-2"
                    >
                      Retry
                    </Button>
                  </div>
                ) : !hasFeedback ? (
                  <div className="text-center py-16 flex flex-col items-center gap-4">
                    <MessageSquare className="h-16 w-16 text-gray-300" />
                    <p className="text-gray-500 text-lg">No reviews found</p>
                    <p className="text-gray-400">There are no reviews available at the moment.</p>
                  </div>
                ) : (
                  <>
                    <Table className="[&_tbody_tr:hover]:bg-white/20">
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Psychic ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {feedbackData.map((feedback, index) => (
                          <TableRow
                            key={feedback._id || index}
                            className={`transition-all duration-300 hover:scale-[1.01] ${isLoaded ? "animate-slide-in-right opacity-100" : "opacity-0"}`}
                            style={{ animationDelay: `${1.4 + index * 0.1}s` }}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <img
                                  src={feedback.profile || "https://via.placeholder.com/40"}
                                  alt="profile"
                                  className="w-10 h-10 rounded-full object-cover"
                                  onError={(e) => {
                                    e.target.src = "https://via.placeholder.com/40";
                                  }}
                                />
                                <span>{feedback.username || 'Anonymous User'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {renderRating(feedback.rating)}
                              <span className="ml-2 text-sm text-gray-500">
                                ({feedback.rating || 0}/5)
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {feedback.psychicId || 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell>{formatDate(feedback.createdAt)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    className="cursor-pointer text-destructive" 
                                    onClick={() => {
                                      if (window.confirm('Are you sure you want to delete this review?')) {
                                        handleDelete(feedback._id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete feedback
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center mt-6 pt-4 border-t">
                        <Button
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                          className="bg-[#3B5EB7] hover:bg-[#2a4b9a]"
                        >
                          Previous
                        </Button>
                        <span className="text-gray-600">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                          className="bg-[#3B5EB7] hover:bg-[#2a4b9a]"
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reviewss;