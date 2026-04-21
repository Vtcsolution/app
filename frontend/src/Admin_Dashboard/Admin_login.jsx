import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { toast } from "sonner";
export default function Admin_login() {
  // Color scheme
  const colors = {
    deepPurple: "#2B1B3F",
    antiqueGold: "#C9A24D",
    softIvory: "#F5F3EB",
    lightGold: "#E8D9B0",
    darkPurple: "#1A1129",
    mediumPurple: "#3D2B56",
    successGreen: "#10B981",
    warningOrange: "#F59E0B",
    errorRed: "#EF4444",
  };
  // Input field state
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const { setAdmin } = useAdminAuth(); // custom hook to access context

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/admin/login`,
        credentials,
        { withCredentials: true } // important to send cookies
      );

      if (res.data.success) {
        toast.success("Login successful");
        setAdmin(res.data.admin); // Save admin info in context
        navigate("/admin/dashboard"); // Redirect after login
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Login failed");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: colors.softIvory }}>
      <Card className="w-full max-w-md shadow-lg" style={{ borderColor: colors.lightGold }}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center" style={{ color: colors.deepPurple }}>Sign In</CardTitle>
          <CardDescription className="text-center" style={{ color: colors.deepPurple + "CC" }}>
            Enter your details to sign in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: colors.deepPurple }}>Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="w-full"
                value={credentials.email}
                onChange={handleChange}
                required
                style={{
                  borderColor: colors.antiqueGold + "40",
                  color: colors.deepPurple,
                  backgroundColor: colors.softIvory + "80"
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" style={{ color: colors.deepPurple }}>Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="w-full"
                value={credentials.password}
                onChange={handleChange}
                required
                style={{
                  borderColor: colors.antiqueGold + "40",
                  color: colors.deepPurple,
                  backgroundColor: colors.softIvory + "80"
                }}
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-6"
              size="lg"
              style={{
                backgroundColor: colors.antiqueGold,
                color: colors.deepPurple
              }}
            >
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}