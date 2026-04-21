import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Lock, Shield, Edit, Settings, LogOut } from "lucide-react"
import Dashboard_Navbar from "./Admin_Navbar"
import Doctor_Side_Bar from "./SideBar"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAdminAuth } from "@/context/AdminAuthContext"
import { Link } from "react-router-dom"

export default function AdminProfile() {
  const [showPassword, setShowPassword] = useState(false)
  const [side, setSide] = useState(false)

  const { admin } = useAdminAuth()
  const navigate = useNavigate()

  // ✅ Check if admin is not loaded yet
  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">
        Loading admin profile...
      </div>
    )
  }

  const user = {
    name: admin.name,
    email: admin.email,
    profile: admin.image || "/placeholder.svg",
    role: "Administrator",
    lastLogin: "2 hours ago",
    status: "Active",
    password: "********",
  }

  return (
    <div className="min-h-screen" >
      <Dashboard_Navbar side={side} setSide={setSide} user={user} />
      <div className="flex">
        <Doctor_Side_Bar side={side} setSide={setSide} user={user} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 ml-0 lg:ml-64 transition-all duration-300 mt-20">
          <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'rgb(201, 162, 77)' }}>
                  Admin Profile
                </h1>
                <p className="mt-1" style={{ color: 'rgba(201, 162, 77, 0.7)' }}>
                  Manage your account settings and preferences
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/admin/dashboard/updateprofile">
                  <Button 
                    variant="outline"
                    style={{
                      borderColor: 'rgb(201, 162, 77)',
                      color: 'rgb(201, 162, 77)',
                      backgroundColor: 'transparent'
                    }}
                    className="hover:bg-transparent hover:opacity-80"
                  >
                    <Edit className="h-4 w-4 mr-2" style={{ color: 'rgb(201, 162, 77)' }} />
                    Edit Profile
                  </Button>
                </Link>
                <Button 
                  variant="outline"
                  style={{
                    borderColor: 'rgb(201, 162, 77)',
                    color: 'rgb(201, 162, 77)',
                    backgroundColor: 'transparent'
                  }}
                  className="hover:bg-transparent hover:opacity-80"
                >
                  <Settings className="h-4 w-4" style={{ color: 'rgb(201, 162, 77)' }} />
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card style={{ backgroundColor: 'rgba(201, 162, 77, 0.1)', borderColor: 'rgb(201, 162, 77)', borderWidth: '1px' }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'rgba(201, 162, 77, 0.8)' }}>Role</p>
                      <p className="text-2xl font-bold mt-1" style={{ color: 'rgb(201, 162, 77)' }}>{user.role}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(201, 162, 77, 0.2)' }}>
                      <Shield className="h-6 w-6" style={{ color: 'rgb(201, 162, 77)' }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card style={{ borderColor: 'rgb(201, 162, 77)', borderWidth: '1px' }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'rgba(201, 162, 77, 0.8)' }}>Status</p>
                      <p className="text-2xl font-bold mt-1" style={{ color: 'rgb(201, 162, 77)' }}>{user.status}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(201, 162, 77, 0.2)' }}>
                      <Shield className="h-6 w-6" style={{ color: 'rgb(201, 162, 77)' }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card style={{  borderColor: 'rgb(201, 162, 77)', borderWidth: '1px' }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'rgba(201, 162, 77, 0.8)' }}>Last Login</p>
                      <p className="text-2xl font-bold mt-1" style={{ color: 'rgb(201, 162, 77)' }}>{user.lastLogin}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(201, 162, 77, 0.2)' }}>
                      <User className="h-6 w-6" style={{ color: 'rgb(201, 162, 77)' }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Card */}
            <Card style={{  borderColor: 'rgb(201, 162, 77)', borderWidth: '1px' }}>
              <CardHeader className="relative pb-6 border-b" style={{ borderBottomColor: 'rgb(201, 162, 77)' }}>
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
                  <Avatar className="w-28 h-28 border-4 shadow-lg" style={{ borderColor: 'rgb(201, 162, 77)' }}>
                    <AvatarImage src={user.profile} alt={user.name} />
                    <AvatarFallback className="text-white text-3xl" style={{ backgroundColor: 'rgb(201, 162, 77)' }}>
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 text-center sm:text-left">
                    <CardTitle className="text-2xl font-bold mb-2" style={{ color: 'rgb(201, 162, 77)' }}>{user.name}</CardTitle>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                      <Badge style={{ backgroundColor: 'rgba(201, 162, 77, 0.2)', color: 'rgb(201, 162, 77)' }}>
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role}
                      </Badge>
                      <Badge style={{ backgroundColor: 'rgba(201, 162, 77, 0.2)', color: 'rgb(201, 162, 77)' }}>{user.status}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                {/* Contact Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'rgb(201, 162, 77)' }}>
                    <User className="w-5 h-5" style={{ color: 'rgb(201, 162, 77)' }} />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(201, 162, 77, 0.1)', borderColor: 'rgb(201, 162, 77)', borderWidth: '1px' }}>
                      <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(201, 162, 77, 0.2)' }}>
                        <Mail className="w-5 h-5" style={{ color: 'rgb(201, 162, 77)' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'rgba(201, 162, 77, 0.8)' }}>Email Address</p>
                        <p className="font-medium" style={{ color: 'rgb(201, 162, 77)' }}>{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(201, 162, 77, 0.1)', borderColor: 'rgb(201, 162, 77)', borderWidth: '1px' }}>
                      <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(201, 162, 77, 0.2)' }}>
                        <Lock className="w-5 h-5" style={{ color: 'rgb(201, 162, 77)' }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: 'rgba(201, 162, 77, 0.8)' }}>Password</p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium font-mono" style={{ color: 'rgb(201, 162, 77)' }}>
                            {showPassword ? user.password : "••••••••"}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPassword(!showPassword)}
                            className="h-6 px-2 text-xs"
                            style={{ color: 'rgb(201, 162, 77)' }}
                          >
                            {showPassword ? "Hide" : "Show"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator style={{ backgroundColor: 'rgb(201, 162, 77)' }} />

                {/* Account Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'rgb(201, 162, 77)' }}>
                    <Shield className="w-5 h-5" style={{ color: 'rgb(201, 162, 77)' }} />
                    Account Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border" style={{ backgroundColor: 'rgba(201, 162, 77, 0.1)', borderColor: 'rgb(201, 162, 77)' }}>
                      <p className="text-sm font-medium" style={{ color: 'rgba(201, 162, 77, 0.8)' }}>Role</p>
                      <p className="text-xl font-bold" style={{ color: 'rgb(201, 162, 77)' }}>{user.role}</p>
                    </div>
                    <div className="p-4 rounded-lg border" style={{ backgroundColor: 'rgba(201, 162, 77, 0.1)', borderColor: 'rgb(201, 162, 77)' }}>
                      <p className="text-sm font-medium" style={{ color: 'rgba(201, 162, 77, 0.8)' }}>Status</p>
                      <p className="text-xl font-bold" style={{ color: 'rgb(201, 162, 77)' }}>{user.status}</p>
                    </div>
                    <div className="p-4 rounded-lg border" style={{ backgroundColor: 'rgba(201, 162, 77, 0.1)', borderColor: 'rgb(201, 162, 77)' }}>
                      <p className="text-sm font-medium" style={{ color: 'rgba(201, 162, 77, 0.8)' }}>Last Login</p>
                      <p className="text-xl font-bold" style={{ color: 'rgb(201, 162, 77)' }}>{user.lastLogin}</p>
                    </div>
                  </div>
                </div>

                <Separator style={{ backgroundColor: 'rgb(201, 162, 77)' }} />

                {/* Sign Out Button */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    style={{
                      borderColor: 'rgb(201, 162, 77)',
                      color: 'rgb(201, 162, 77)',
                      backgroundColor: 'transparent'
                    }}
                    onClick={() => {
                      localStorage.removeItem('adminToken');
                      navigate('/admin/login');
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" style={{ color: 'rgb(201, 162, 77)' }} />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}