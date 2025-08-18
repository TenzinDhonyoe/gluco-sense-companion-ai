import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, Activity } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        if (error) throw error;
        
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in."
        });
        navigate("/dashboard");
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords don't match.",
            variant: "destructive"
          });
          return;
        }

        if (!formData.name.trim()) {
          toast({
            title: "Error",
            description: "Please enter your name.",
            variant: "destructive"
          });
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });

        if (error) throw error;

        // Create profile with the user's name
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                name: formData.name.trim()
              }
            ]);

          if (profileError) {
            console.error('Profile creation error:', profileError);
            toast({
              title: "Account created!",
              description: "Please check your email to verify your account. You may need to update your profile later."
            });
          } else {
            toast({
              title: "Account created!",
              description: "Please check your email to verify your account."
            });
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 flex flex-col relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-green-200/30 rounded-full animate-pulse"></div>
        <div className="absolute top-60 right-8 w-24 h-24 bg-blue-200/40 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute bottom-40 left-6 w-20 h-20 bg-green-300/20 rounded-full animate-pulse delay-500"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-8 relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Activity className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full"></div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Gluco<span className="text-green-600">Track</span>
          </h1>
          <p className="text-gray-600 text-lg">Your health companion</p>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-md">
          <Card className="bg-white/90 backdrop-blur-md border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  {isLogin ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="text-gray-500 text-sm">
                  {isLogin ? "Sign in to continue your health journey" : "Join us to start tracking your health"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700 font-medium">Full Name</Label>
                    <div className="relative">
                      <User className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2 z-10" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="pl-12 h-14 bg-gray-50/80 border-gray-200 text-base rounded-2xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                        placeholder="Enter your full name"
                        style={{ fontSize: '16px' }}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2 z-10" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-12 h-14 bg-gray-50/80 border-gray-200 text-base rounded-2xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                      placeholder="Enter your email"
                      style={{ fontSize: '16px' }}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2 z-10" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-12 pr-12 h-14 bg-gray-50/80 border-gray-200 text-base rounded-2xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                      placeholder="Enter your password"
                      style={{ fontSize: '16px' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors z-10"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2 z-10" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="pl-12 h-14 bg-gray-50/80 border-gray-200 text-base rounded-2xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                        placeholder="Confirm your password"
                        style={{ fontSize: '16px' }}
                        required
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold text-lg rounded-2xl shadow-lg transform hover:scale-[1.02] transition-all duration-200 mt-8"
                  style={{ fontSize: '16px' }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    isLogin ? "Sign In" : "Create Account"
                  )}
                </Button>
              </form>

              {/* Toggle Login/Signup */}
              <div className="mt-8 text-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">
                      {isLogin ? "New to GlucoTrack?" : "Already have an account?"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="mt-4 text-green-600 font-semibold text-base hover:text-green-700 transition-colors duration-200"
                >
                  {isLogin ? "Create an account" : "Sign in instead"}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6 px-4 leading-relaxed">
            By continuing, you agree to our{" "}
            <span className="text-green-600 font-medium">Terms of Service</span> and{" "}
            <span className="text-green-600 font-medium">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;