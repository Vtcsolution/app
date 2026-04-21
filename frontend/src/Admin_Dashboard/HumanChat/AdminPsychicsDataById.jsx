import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users, DollarSign, MessageSquare, Clock, Star, Calendar,
  TrendingUp, BarChart3, User, Activity, Shield, CheckCircle,
  XCircle, Loader2, ArrowLeft, RefreshCw, Eye,
  PhoneCall, Headphones
} from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard_Navbar from "../Admin_Navbar";
import Doctor_Side_Bar from "../SideBar";
import axios from 'axios';

const AdminPsychicsDataById = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const [side, setSide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [psychicDetails, setPsychicDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) fetchPsychicDetails();
  }, [id]);

  const fetchPsychicDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/admindata/chats/psychics/${id}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setPsychicDetails(response.data.data);
        toast({ title: "Success", description: `Loaded details for ${response.data.data.profile.name}` });
      } else {
        toast({ title: "Error", description: response.data.message || "Failed to load psychic details", variant: "destructive" });
        navigate('/admin/dashboard/humancoach');
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      toast({ title: "Error", description: "Failed to load psychic details", variant: "destructive" });
      navigate('/admin/dashboard/humancoach');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  const formatDate = (date) => date ? new Date(date).toLocaleString() : "N/A";
  const formatDuration = (minutes) => {
    if (!minutes) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Dashboard_Navbar side={side} setSide={setSide} />
        <div className="flex">
          <Doctor_Side_Bar side={side} setSide={setSide} />
          <main className="flex-1 p-6 ml-0 lg:ml-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading psychic details...</span>
          </main>
        </div>
      </div>
    );
  }

  if (!psychicDetails) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Dashboard_Navbar side={side} setSide={setSide} />
        <div className="flex">
          <Doctor_Side_Bar side={side} setSide={setSide} />
          <main className="flex-1 p-6 ml-0 lg:ml-64 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Psychic Not Found</h2>
            <Button onClick={() => navigate('/admin/dashboard/humancoach')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          </main>
        </div>
      </div>
    );
  }

  const { profile, statistics, financials, recentActivity, userInteractions, timeline } = psychicDetails;
  const totals = statistics?.totals || {};
  const current = statistics?.current || {};
  const performance = statistics?.performance || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard_Navbar side={side} setSide={setSide} />
      <div className="flex">
        <Doctor_Side_Bar side={side} setSide={setSide} />
        <main className="flex-1 p-6 ml-0 lg:ml-64">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/dashboard/humancoach')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{profile.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={profile.isVerified ? "bg-green-500/10 text-green-700" : "bg-yellow-500/10 text-yellow-700"}>
                    {profile.isVerified ? 'Verified' : 'Pending'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Joined: {formatDate(profile.joinDate)}</span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchPsychicDetails}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>

          {/* Profile Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Profile Info */}
            <Card>
              <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col items-center text-center mb-6">
                  <Avatar className="h-24 w-24 mb-4">
                    {profile.image ? <AvatarImage src={profile.image} /> :
                      <AvatarFallback className="bg-purple-100 text-purple-600 text-2xl">
                        {profile.name?.[0]?.toUpperCase() || 'P'}
                      </AvatarFallback>
                    }
                  </Avatar>
                  <h2 className="text-xl font-bold">{profile.name}</h2>
                  <p className="text-muted-foreground">{profile.email}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span>{profile.averageRating?.toFixed(1) || '0.0'}</span>
                    <span className="text-sm text-muted-foreground">({profile.totalRatings || 0})</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Chat Rate:</span>
                    <span className="font-medium">{formatCurrency(profile.ratePerMin)}/min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Call Rate:</span>
                    <span className="font-medium">$1.00/min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Last Active:</span>
                    <span className="text-sm font-medium">{formatDate(timeline?.lastActive)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Online Time:</span>
                    <span className="text-sm font-medium">{timeline?.totalOnlineTime || 0} hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Total Earnings', value: formatCurrency(totals.earnings), icon: DollarSign, color: 'green' },
                  { label: 'Total Sessions', value: (totals.chatSessions || 0) + (totals.callSessions || 0), icon: MessageSquare, color: 'blue' },
                  { label: 'Completion', value: `${performance.completionRate || 0}%`, icon: CheckCircle, color: 'teal' }
                ].map((stat, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                          <p className="text-xl font-bold">{stat.value}</p>
                          {stat.label === 'Total Earnings' && (
                            <div className="text-xs mt-1">
                              <span className="text-green-600">Chat: {formatCurrency(totals.chatEarnings)}</span><br />
                              <span className="text-blue-600">Call: {formatCurrency(totals.callEarnings)}</span>
                            </div>
                          )}
                          {stat.label === 'Total Sessions' && (
                            <div className="text-xs mt-1">
                              <span className="text-green-600">Chats: {totals.chatSessions || 0}</span> | 
                              <span className="text-blue-600"> Calls: {totals.callSessions || 0}</span>
                            </div>
                          )}
                        </div>
                        <div className={`h-10 w-10 rounded-full bg-${stat.color}-100 flex items-center justify-center`}>
                          <stat.icon className={`h-5 w-5 text-${stat.color}-600`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Status Cards */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Active Chats', value: current.activeChats || 0, icon: MessageSquare, color: 'blue' },
                  { label: 'Active Calls', value: current.activeCalls || 0, icon: PhoneCall, color: 'green' },
                  { label: 'Pending', value: current.pendingRequests || 0, icon: Activity, color: 'orange' }
                ].map((stat, i) => (
                  <Card key={i}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full bg-${stat.color}-100 flex items-center justify-center`}>
                        <stat.icon className={`h-4 w-4 text-${stat.color}-600`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="text-lg font-bold">{stat.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full max-w-md mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
              <TabsTrigger value="users">Top Users</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <Card>
                <CardHeader><CardTitle>Performance Overview</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-3">Sessions</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total:</span><span className="font-medium">{totals.sessions}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-muted-foreground">Paid Timers:</span><span className="font-medium">{totals.paidTimers}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-muted-foreground">Avg Duration:</span><span className="font-medium">{current.avgSessionDuration}m</span></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-3">Financial</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total:</span><span className="font-medium">{formatCurrency(totals.earnings)}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-muted-foreground">Chat:</span><span className="font-medium">{formatCurrency(totals.chatEarnings)}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-muted-foreground">Call:</span><span className="font-medium">{formatCurrency(totals.callEarnings)}</span></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                <CardContent>
                  <Tabs defaultValue="chats">
                    <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
                      <TabsTrigger value="chats">Chats</TabsTrigger>
                      <TabsTrigger value="timers">Paid Timers</TabsTrigger>
                      <TabsTrigger value="calls">Calls</TabsTrigger>
                    </TabsList>

                    {/* Chat Sessions */}
                    <TabsContent value="chats">
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Status</TableHead><TableHead>Duration</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {recentActivity.chatSessions?.slice(0, 5).map((s, i) => (
                              <TableRow key={s._id || i}>
                                <TableCell>{s.user || 'Unknown'}</TableCell>
                                <TableCell><Badge variant="outline">{s.status}</Badge></TableCell>
                                <TableCell>{formatDuration(s.duration)}</TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/dashboard/chat-details/${s._id}`)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    {/* Call Sessions */}
                    <TabsContent value="calls">
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Revenue</TableHead><TableHead>Duration</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {recentActivity.callSessions?.slice(0, 5).map((c, i) => (
                              <TableRow key={c._id || i}>
                                <TableCell>{c.user || 'Unknown'}</TableCell>
                                <TableCell>{formatCurrency(c.revenue || 0)}</TableCell>
                                <TableCell>{formatDuration(c.duration)}</TableCell>
                                <TableCell><Badge variant="outline">{c.status}</Badge></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    {/* Paid Timers */}
                    <TabsContent value="timers">
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Amount</TableHead><TableHead>Duration</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {recentActivity.paidTimers?.slice(0, 5).map((t, i) => (
                              <TableRow key={t._id || i}>
                                <TableCell>{t.user || 'Unknown'}</TableCell>
                                <TableCell>{formatCurrency(t.amount)}</TableCell>
                                <TableCell>{formatDuration(t.duration)}</TableCell>
                                <TableCell><Badge variant="outline">{t.status}</Badge></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Earnings Tab */}
            <TabsContent value="earnings">
              <Card>
                <CardHeader><CardTitle>Monthly Earnings</CardTitle></CardHeader>
                <CardContent>
                  <div className="rounded-md border mb-4">
                    <Table>
                      <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Earnings</TableHead><TableHead>Sessions</TableHead><TableHead>Minutes</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {financials.monthlyBreakdown?.slice(0, 6).map((m, i) => (
                          <TableRow key={i}>
                            <TableCell>{m.period}</TableCell>
                            <TableCell>{formatCurrency(m.totalEarnings)}</TableCell>
                            <TableCell>{m.sessionCount}</TableCell>
                            <TableCell>{Math.round(m.totalMinutes)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold text-green-600">{formatCurrency(financials.totalEarnings)}</p></CardContent></Card>
                    <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Monthly Avg</p><p className="text-xl font-bold text-blue-600">{formatCurrency(financials.avgEarningsPerMonth)}</p></CardContent></Card>
                    <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Est. Monthly</p><p className="text-xl font-bold text-purple-600">{formatCurrency(financials.estimatedMonthlyEarnings)}</p></CardContent></Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader><CardTitle>Top Users</CardTitle></CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Sessions</TableHead><TableHead>Spent</TableHead><TableHead>Last</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {userInteractions?.slice(0, 5).map((u, i) => (
                          <TableRow key={u.userId || i}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6"><AvatarFallback className="bg-purple-100 text-purple-600 text-xs">{u.username?.[0] || 'U'}</AvatarFallback></Avatar>
                                <span className="text-sm">{u.username}</span>
                              </div>
                            </TableCell>
                            <TableCell>{u.totalSessions}</TableCell>
                            <TableCell>{formatCurrency(u.totalSpent)}</TableCell>
                            <TableCell>{formatDate(u.lastSession)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <Card><CardContent className="p-3 flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400" /><span className="text-xs">Created: {formatDate(profile.createdAt)}</span></CardContent></Card>
            <Card><CardContent className="p-3 flex items-center gap-2"><RefreshCw className="h-4 w-4 text-gray-400" /><span className="text-xs">Updated: {formatDate(profile.updatedAt)}</span></CardContent></Card>
            <Card><CardContent className="p-3 flex items-center gap-2">{profile.isVerified ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-yellow-500" />}<span className="text-xs">{profile.isVerified ? 'Verified' : 'Pending'}</span></CardContent></Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPsychicsDataById;