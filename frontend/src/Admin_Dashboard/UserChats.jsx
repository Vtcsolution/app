import { useEffect, useState } from 'react';
import Dashboard_Navbar from './Admin_Navbar';
import Doctor_Side_Bar from './SideBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';

import { ChevronDown, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { toast } from 'sonner';

const UserChats = () => {
  const [side, setSide] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [chats, setChats] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalChats: 0,
    limit: 10,
  });
  const { admin } = useAdminAuth();

  const format = (date) => {
    if (!date) return "Not provided";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const fetchChats = async (page = 1, limit = 10) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/chat/admin/all-chats?page=${page}&limit=${limit}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setChats(data.chats);
        setPagination(data.pagination);
      } else {
        toast.error("Failed to load chats");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading chat data");
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (!window.confirm("Are you sure you want to delete this chat?")) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/chat/admin/chat/${chatId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setChats(chats.filter(chat => chat.id !== chatId));
        toast.success("Chat deleted successfully");
        // Refetch chats to update pagination if needed
        fetchChats(pagination.currentPage, pagination.limit);
      } else {
        toast.error(data.message || "Failed to delete chat");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting chat");
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchChats(newPage, pagination.limit);
    }
  };

  useEffect(() => {
    fetchChats();
    setIsLoaded(true);
  }, []);

  return (
    <div>
      <Dashboard_Navbar side={side} setSide={setSide} user={admin} />

      <div className="dashboard-wrapper">
        <Doctor_Side_Bar side={side} setSide={setSide} user={admin} />

        <div className="dashboard-side min-h-screen">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-sans font-extrabold text-center my-6">
            Users Chat
          </h2>

          <div className="rounded-md border overflow-hidden mx-2 md:mx-4 overflow-x-auto backdrop-blur-md shadow-xl transition-all duration-500 hover:shadow-2xl hover:translate-y-[-5px]">
            <Card
              className={`w-full bg-white/10 border-white/20 backdrop-blur-md shadow-xl transition-all duration-500 hover:shadow-2xl hover:translate-y-[-5px] ${
                isLoaded ? "animate-slide-in-bottom opacity-100" : "opacity-0"
              }`}
              style={{ animationDelay: "1.3s" }}
            >
              <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                  <CardTitle>Users Chat data</CardTitle>
                  <CardDescription>
                    Recently Added user chats data to the platform
                  </CardDescription>
                </div>
               
              </CardHeader>

              <CardContent>
                <Table className="[&_tbody_tr:hover]:bg-white/20">
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Advisor</TableHead>
                      <TableHead>Credits Used</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {chats.map((chat, index) => (
                      <TableRow
                        key={index}
                        className={`transition-all duration-300 hover:scale-[1.01] ${
                          isLoaded ? "animate-slide-in-right opacity-100" : "opacity-0"
                        }`}
                      >
                        <TableCell className="font-medium">
                          {chat.user?.username || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {chat.advisor?.name || "Unknown"}
                        </TableCell>
                        <TableCell>{chat.credits}</TableCell>
                        <TableCell>{format(chat.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link to={`/admin/dashboard/user-chat-detail/${chat.id}`}>
                              <Button variant="brand">Chat</Button>
                            </Link>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteChat(chat.id)}
                              title="Delete Chat"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-4">
                  <div>
                    Showing {chats.length} of {pagination.totalChats} chats
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="self-center">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserChats;