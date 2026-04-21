import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./All_Components/Navbar";
import Dashboard from "./All_Components/Dashboard";
import Account from "./All_Components/Account";
import Appointments from "./All_Components/Appointments";
import My_Consultations from "./All_Components/My_Consultations";
import Reviews from "./All_Components/Reviews";
import Transactions from "./All_Components/Transactions";
import Vouchers from "./All_Components/Vouchers";
import Favourites from "./All_Components/Favourites";
import Home from "./All_Components/Home";
import UpdateProfile from "./All_Components/UpdateProfile";
import { Toaster } from "./components/ui/sonner";
import NotificationsPage from "./All_Components/Short_COmponents/All_Notifications";

import AOS from 'aos';
import 'aos/dist/aos.css';

import Admin_Dashboard from "./Admin_Dashboard/Admin_Dashboard";
import Transactionss from "./Admin_Dashboard/Transactions"
import Reviewss from "./Admin_Dashboard/Reviews"
import Add_Advisor from "./Admin_Dashboard/Add_Advisor"
import Send_Mail from "./Admin_Dashboard/SendMail";
import ModernFooter from "./All_Components/Footer"

import TermsAndConditions from "./All_Components/Terms_and_Conditions"
import AboutPage from "./All_Components/About"
import ContactPage from "./All_Components/Contact"
import AllUsers from "./Admin_Dashboard/AllUsers"
import AllAdvisors from "./Admin_Dashboard/AllAdvisors"
import AI_Inputs_Data from "./Admin_Dashboard/AI_Inputs_data"
import AllNotifications from "./Admin_Dashboard/AllNotification"
import Update_Terms_Confitions from "./Admin_Dashboard/Update_TermConditions"
import Update_About from "./Admin_Dashboard/Update_About"
import UserChats from "./Admin_Dashboard/UserChats"
import UserChatDetail from "./Admin_Dashboard/UserChatDetail"
import AdminUpdateProfile from "./Admin_Dashboard/AdminUpdateProfile"
import AdminProfile from "./Admin_Dashboard/Admin_Profile"
import Admin_login from "./Admin_Dashboard/Admin_login"
import User_Details from "./Admin_Dashboard/User_Details"
import VisitorStats from "./Admin_Dashboard/VisitorStats"

import Scroll from "./All_Components/Scroll";
import AI_Talk_Form from "./All_Components/AI_Talk_Form";
import { InputOTPDemo } from "./All_Components/Otp_Verification";
import Signup from "./All_Components/screen/Signup";
import Signin from "./All_Components/screen/Signin";
import Forgot_Password from "./All_Components/screen/Forgot_Password";
import Reset_Password from "./All_Components/screen/Reset_Password";
import { useEffect, useState } from "react";
import ProtectedRoute from "./All_Components/screen/ProtectedRoute";
import PageNotFound from "./All_Components/screen/PageNotFound";
import PaymentResult from "./All_Components/screen/PaymentResult";
import PaymentRedirectHandler from "./All_Components/screen/PaymentRedirectHandler";
import VideoThumbnailUpdater from "./Admin_Dashboard/VideoThumbnailUpdater";
import PsychicDashboard from "./Psychic_Dashboard/PsychicDashboard";
import PsychicLogin from "./Psychic_Dashboard/PsychicLogin";
import PsychicRegister from "./Psychic_Dashboard/PsychicRegister";
import PsychicProtectedRoute from "./context/PsychicProtectedRoute";
import ChatInterface from "./Chatbot/ChatInterface";
import PsychicChats from "./Psychic_Dashboard/PsychicChats";
import PsychicEarnings from "./Psychic_Dashboard/PsychicEarnings";
import PsychicReviews from "./Psychic_Dashboard/PsychicReviews";
import PsychicSettings from "./Psychic_Dashboard/PsychicSettings";
import PsychicNavbar from "./Psychic_Dashboard/PsychicNavbar";
import PsychicSidebar from "./Psychic_Dashboard/PsychicSidebar";
import HumanPsychicProfile from './Psychic_Dashboard/HumanPsychicProfile'
import AdminProtectedRoute from "./context/AdminProtectedRoute";
import AdminReviews from "./Admin_Dashboard/HumanChat/AdminReviews";

import AdminHumanChatDashboard from "./Admin_Dashboard/HumanChat/AdminHumanChatDashboard";
import ChatDetails from "./Admin_Dashboard/HumanChat/ChatDetails";
import UserChatSessions from "./Admin_Dashboard/HumanChat/UserChatSessions";
import AdminPsychicData from "./Admin_Dashboard/HumanChat/AdminPsychicData";
import AdminPsychicsDataById from "./Admin_Dashboard/HumanChat/AdminPsychicsDataById";
import HumanCoachList from "./Admin_Dashboard/HumanChat/HumanCoachList";
import AddPsychic from "./Admin_Dashboard/HumanChat/AddPsychic";
import Golive from "./Psychic_Dashboard/Golive";
import PsychicProfile from "./All_Components/PsychicProfile";
import Psychics from "./All_Components/Psychics";
import AudioCallPage from "./Audio/AudioCallPage";
import { useAuth } from "./All_Components/screen/AuthContext";
import { usePsychicAuth } from "./context/PsychicAuthContext";
import { SocketProvider } from "./context/SocketContext";
import PsychicCallHistoryPage from "./Psychic_Dashboard/PsychicCallHistoryPage";

import { PsychicAuthProvider } from "./context/PsychicAuthContext";
import PsychicActiveCallPage from "./Psychic_Dashboard/PsychicActiveCallPage";
import ChatSessions from "./All_Components/ChatSessions";
import MyWallet from "./All_Components/Mywallet";
import PsychicForgotPassword from "./Psychic_Dashboard/PsychicForgotPassword";
import PsychicResetPassword from "./Psychic_Dashboard/PsychicResetPassword";
import PsychicEarningsPayment from "./Admin_Dashboard/HumanChat/PsychicEarningsPayment";
import BlogsList from "./Admin_Dashboard/HumanChat/BlogsList";
import AddBlog from "./Admin_Dashboard/HumanChat/AddBlog";
import EditBlog from "./Admin_Dashboard/HumanChat/EditBlog";
import BlogsPage from "./All_Components/BlogsPage";
import BlogDetail from "./All_Components/BlogDetail";
import AdminComments from "./Admin_Dashboard/AdminComments";
import AdminHome from "./Admin_Dashboard/Pages/AdminHome";
import AdminAbout from "./Admin_Dashboard/Pages/AdminAbout";
import AdminContact from "./Admin_Dashboard/Pages/AdminContact";
import AdminTerms from "./Admin_Dashboard/Pages/AdminTerms";
import AdminFooter from "./Admin_Dashboard/Pages/AdminFooter";
import AdminPayments from "./Admin_Dashboard/Pages/AdminPayments";
import './App.css';
import AdminPsychicsPage from "./Admin_Dashboard/Pages/AdminPsychicsPage";

// Redirect component for old routes to new French routes
const RedirectToFrench = ({ to }) => {
  return <Navigate to={to} replace />;
};

const App = () => {
  const [side, setSide] = useState(false);
  const location = useLocation();
  const [openPaymentModal, setOpenPaymentModal] = useState(null);
  const { user } = useAuth();
  
  // Routes that should hide navbar and footer
  const hideNavbarAndFooterRoutes = [
    // Admin routes
    "/admin/login",
    "/admin/dashboard",
    "/admin/dashboard/transactions",
    "/admin/dashboard/reviews",
    "/admin/dashboard/human-chat",
    "/admin/dashboard/chat-details/:id",
    "/admin/dashboard/add-advisor",
    "/admin/dashboard/humancoach",
    "/admin/dashboard/sendmail",
    "/admin/dashboard/allusers",
    "/admin/dashboard/visitors",
    "/admin/dashboard/alladvisors",
    "/admin/dashboard/inputs-data",
    "/admin/dashboard/all-notifications",
    "/admin/dashboard/update-conditions",
    "/admin/dashboard/update-about",
    "/admin/dashboard/user-details/:userId",
    "/admin/dashboard/users-chat",
    "/admin/dashboard/user-chat-detail",
    "/admin/dashboard/updateprofile",
    "/admin/dashboard/human-reviews",
    "/admin/dashboard/profile",
    "/admin/dashboard/chats/:psychicid",
    "/admin/dashboard/add-humancoach",
    "/admin/dashboard/newcoach",
    "/admin/dashboard/chat-details/:chatSessionId",
    
    // Psychic auth routes
    "/medium/connexion",
    "/medium/inscription",
    "/medium/mot-de-passe-oublie",
    "/medium/reinitialiser-mot-de-passe/:resetToken",
    
    // Chat interface routes
    "/message/:psychic_id",
    
    // Audio call routes
    "/appel-audio/:callSessionId",
    "/historique-appels",
    
    // Psychic call routes
    "/medium/appel/:callRequestId",
    "/medium/tableau-de-bord/historique-appels",
  ];

  const dynamicRoutePatterns = [
    /^\/admin-dashboard-doctor\/.+$/,
    /^\/reinitialiser-mot-de-passe\/.+$/,
    /^\/message\/.+$/,
    /^\/chat\/.+$/,
    /^\/medium\/tableau-de-bord\/.+$/,
    /^\/appel-audio\/.+$/,
    /^\/medium\/appel\/.+$/,
  ];

  const shouldShowNavbar = !(
    hideNavbarAndFooterRoutes.includes(location.pathname) ||
    dynamicRoutePatterns.some((pattern) => pattern.test(location.pathname)) ||
    location.pathname.startsWith('/medium/tableau-de-bord') ||
    location.pathname === '/medium/connexion' ||
    location.pathname === '/medium/inscription' ||
    location.pathname.startsWith('/message/') ||
    location.pathname.startsWith('/chat/') ||
    location.pathname.startsWith('/appel-audio/') ||
    location.pathname === '/historique-appels' ||
    location.pathname.startsWith('/medium/appel/')
  );

  const isPsychicRoute = location.pathname.startsWith('/medium/tableau-de-bord') || 
                         location.pathname === '/medium/connexion' || 
                         location.pathname === '/medium/inscription' ||
                         location.pathname.startsWith('/medium/appel/') ||
                         location.pathname === '/medium/tableau-de-bord/historique-appels';

  const isChatInterfaceRoute = location.pathname.startsWith('/message/') || 
                               location.pathname.startsWith('/chat/') ||
                               location.pathname.startsWith('/appel-audio/') ||
                               location.pathname === '/historique-appels' ||
                               location.pathname.startsWith('/medium/appel/') ||
                               location.pathname === '/medium/tableau-de-bord/historique-appels';

  useEffect(() => {
    AOS.init({ duration: 800 });
  }, []);

  const getSocketUserInfo = () => {
    if (location.pathname.startsWith('/medium')) {
      const psychicToken = localStorage.getItem('psychicToken');
      const psychicId = localStorage.getItem('psychicId');
      
      if (psychicToken && psychicId) {
        return {
          userType: 'psychic',
          userId: psychicId,
          token: psychicToken
        };
      }
    } else if (user) {
      const userToken = localStorage.getItem('token');
      return {
        userType: 'user',
        userId: user._id,
        token: userToken
      };
    }
    return null;
  };

  const socketUserInfo = getSocketUserInfo();

  return (
    <div className="min-h-screen flex flex-col">
      <SocketProvider
        userType={socketUserInfo?.userType}
        userId={socketUserInfo?.userId}
        token={socketUserInfo?.token}
      >
        <PsychicAuthProvider>
          <Scroll />
          
          {isPsychicRoute && location.pathname !== '/medium/connexion' && location.pathname !== '/medium/inscription' ? (
            <PsychicNavbar side={side} setSide={setSide} />
          ) : shouldShowNavbar && (
            <Navbar onOpenPaymentModal={(fn) => setOpenPaymentModal(() => fn)} />
          )}
          
          <div className="flex flex-1">
            {isPsychicRoute && location.pathname !== '/medium/connexion' && location.pathname !== '/medium/inscription' && !location.pathname.startsWith('/medium/appel/') && (
              <PsychicSidebar side={side} />
            )}
            
            <main className={`flex-1 ${isPsychicRoute && !location.pathname.startsWith('/medium/appel/') ? 'ml-0 lg:ml-64' : ''} ${isPsychicRoute && location.pathname !== '/medium/connexion' && location.pathname !== '/medium/inscription' ? 'mt-16' : ''}`}>
              <Routes>
                {/* French Routes - Main */}
                <Route path="/accueil" element={<Home />} />
                <Route path="/a-propos" element={<AboutPage />} />
                <Route path="/nos-mediums" element={<Psychics />} />
                <Route path="/articles" element={<BlogsPage />} />
                <Route path="/article/:id" element={<BlogDetail />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/conditions-generales" element={<TermsAndConditions />} />
                
                {/* User Auth Routes (French) */}
                <Route path="/connexion" element={<Signin />} />
                <Route path="/inscription" element={<Signup />} />
                <Route path="/mot-de-passe-oublie" element={<Forgot_Password />} />
                <Route path="/reinitialiser-mot-de-passe/:token" element={<Reset_Password />} />
                <Route path="/verification-otp" element={<InputOTPDemo />} />
                
                {/* User Dashboard Routes (French) */}
                <Route path="/tableau-de-bord" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/compte" element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                } />
                
                <Route path="/rendez-vous" element={
                  <ProtectedRoute>
                    <Appointments />
                  </ProtectedRoute>
                } />
                
                <Route path="/mes-consultations" element={
                  <ProtectedRoute>
                    <My_Consultations />
                  </ProtectedRoute>
                } />
                
                <Route path="/avis" element={<Reviews />} />
                
                <Route path="/transactions" element={
                  <ProtectedRoute>
                    <Transactions />
                  </ProtectedRoute>
                } />
                
                <Route path="/portefeuille" element={
                  <ProtectedRoute>
                    <MyWallet />
                  </ProtectedRoute>
                } />
                
                <Route path="/sessions-chat" element={
                  <ProtectedRoute>
                    <ChatSessions />
                  </ProtectedRoute>
                } />
                
                <Route path="/favoris" element={
                  <ProtectedRoute>
                    <Favourites />
                  </ProtectedRoute>
                } />
                
                <Route path="/modifier-profil" element={
                  <ProtectedRoute>
                    <UpdateProfile />
                  </ProtectedRoute>
                } />
                
                <Route path="/historique" element={
                  <ProtectedRoute>
                    <Appointments />
                  </ProtectedRoute>
                } />
                
                <Route path="/notifications" element={<NotificationsPage />} />
                
                {/* Psychic Profile Route */}
                <Route path="/medium/:psychicId" element={<PsychicProfile />} />
                
                {/* Chat Interface Route */}
                <Route path="/message/:psychic_id" element={
                  <ProtectedRoute>
                    <ChatInterface />
                  </ProtectedRoute>
                } />
                
                {/* Audio Call Routes */}
                <Route path="/appel-audio/:callSessionId" element={
                  <ProtectedRoute>
                    <AudioCallPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/historique-appels" element={
                  <ProtectedRoute>
                    <Appointments />
                  </ProtectedRoute>
                } />
                
                {/* Payment Routes */}
                <Route path="/paiement/resultat" element={<PaymentResult />} />
                <Route path="/paiement/resultat/:id" element={<PaymentResult />} />
                <Route path="/paiement/redirection" element={<PaymentRedirectHandler />} />
                
                {/* Form Routes */}
                <Route path="/formulaire-ia" element={<AI_Talk_Form />} />
                
                {/* Admin Routes (French) */}
                <Route path="/admin/connexion" element={<Admin_login />} />
                <Route path="/admin/tableau-de-bord" element={
                  <AdminProtectedRoute><Admin_Dashboard /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/transactions" element={
                  <AdminProtectedRoute><Transactionss /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/avis" element={
                  <AdminProtectedRoute><Reviewss /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/ajouter-medium" element={
                  <AdminProtectedRoute><Add_Advisor /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/envoyer-email" element={
                  <AdminProtectedRoute><Send_Mail /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/avis-mediums" element={
                  <AdminProtectedRoute><AdminReviews /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/visiteurs" element={
                  <AdminProtectedRoute><VisitorStats side={side} setSide={setSide} /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/utilisateurs" element={
                  <AdminProtectedRoute><AllUsers /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/gains-mediums" element={
                  <AdminProtectedRoute><PsychicEarningsPayment /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/articles" element={
                  <AdminProtectedRoute><BlogsList /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/articles/ajouter" element={
                  <AdminProtectedRoute><AddBlog /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/articles/modifier/:id" element={
                  <AdminProtectedRoute><EditBlog /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/commentaires" element={
                  <AdminProtectedRoute><AdminComments /></AdminProtectedRoute>
                } />
                
                {/* Admin Pages Routes */}
                <Route path="/admin/tableau-de-bord/pages/accueil" element={
                  <AdminProtectedRoute><AdminHome /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/pages/a-propos" element={
                  <AdminProtectedRoute><AdminAbout /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/pages/contact" element={
                  <AdminProtectedRoute><AdminContact /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/pages/conditions" element={
                  <AdminProtectedRoute><AdminTerms /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/pages/pied-page" element={
                  <AdminProtectedRoute><AdminFooter /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/pages/mediums" element={
                  <AdminProtectedRoute><AdminPsychicsPage /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/pages/forfaits" element={
                  <AdminProtectedRoute><AdminPayments /></AdminProtectedRoute>
                } />
                
                <Route path="/admin/tableau-de-bord/tous-mediums" element={
                  <AdminProtectedRoute><AllAdvisors /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/donnees-ia" element={
                  <AdminProtectedRoute><AI_Inputs_Data /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/coachs-humains" element={
                  <AdminProtectedRoute><HumanCoachList /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/ajouter-coach-humain" element={
                  <AdminProtectedRoute><AddPsychic /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/toutes-notifications" element={
                  <AdminProtectedRoute><AllNotifications /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/mettre-jour-conditions" element={
                  <AdminProtectedRoute><Update_Terms_Confitions /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/details-utilisateur/:userId" element={
                  <AdminProtectedRoute><User_Details /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/mettre-jour-a-propos" element={
                  <AdminProtectedRoute><Update_About /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/chats-utilisateurs" element={
                  <AdminProtectedRoute><UserChats /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/details-chat/:chatId" element={
                  <AdminProtectedRoute><UserChatDetail /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/mettre-jour-profil" element={
                  <AdminProtectedRoute><AdminUpdateProfile /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/profil" element={
                  <AdminProtectedRoute><AdminProfile /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/chat-humain" element={
                  <AdminProtectedRoute><AdminHumanChatDashboard /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/details-conversation/:id" element={
                  <AdminProtectedRoute><ChatDetails /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/utilisateurs/:userId/chats" element={
                  <AdminProtectedRoute><UserChatSessions /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/donnees-mediums" element={
                  <AdminProtectedRoute><AdminPsychicData /></AdminProtectedRoute>
                } />
                <Route path="/admin/tableau-de-bord/mediums/:id" element={
                  <AdminProtectedRoute><AdminPsychicsDataById /></AdminProtectedRoute>
                } />
                
                {/* Psychic Routes (French) */}
                <Route path="/medium/connexion" element={<PsychicLogin />} />
                <Route path="/medium/inscription" element={<PsychicRegister />} />
                <Route path="/medium/mot-de-passe-oublie" element={<PsychicForgotPassword />} />
                <Route path="/medium/reinitialiser-mot-de-passe/:resetToken" element={<PsychicResetPassword />} />

                {/* Psychic Dashboard Routes (French) */}
                <Route path="/medium/tableau-de-bord" element={
                  <PsychicProtectedRoute>
                    <PsychicDashboard />
                  </PsychicProtectedRoute>
                } />
                
                <Route path="/medium/tableau-de-bord/chats" element={
                  <PsychicProtectedRoute>
                    <PsychicChats />
                  </PsychicProtectedRoute>
                } />
                
                <Route path="/medium/tableau-de-bord/en-ligne" element={
                  <PsychicProtectedRoute>
                    <Golive />
                  </PsychicProtectedRoute>
                } />
                
                <Route path="/medium/tableau-de-bord/profil" element={
                  <PsychicProtectedRoute>
                    <HumanPsychicProfile />
                  </PsychicProtectedRoute>
                } />
             
                <Route path="/medium/tableau-de-bord/gains" element={
                  <PsychicProtectedRoute>
                    <PsychicEarnings />
                  </PsychicProtectedRoute>
                } />

                <Route path="/medium/appel/:callRequestId" element={
                  <PsychicProtectedRoute>
                    <PsychicActiveCallPage />
                  </PsychicProtectedRoute>
                } />
                
                <Route path="/medium/tableau-de-bord/avis" element={
                  <PsychicProtectedRoute>
                    <PsychicReviews />
                  </PsychicProtectedRoute>
                } />
                
                <Route path="/medium/tableau-de-bord/parametres" element={
                  <PsychicProtectedRoute>
                    <PsychicSettings />
                  </PsychicProtectedRoute>
                } />
                
                <Route path="/medium/tableau-de-bord/historique-appels" element={
                  <PsychicProtectedRoute>
                    <PsychicCallHistoryPage />
                  </PsychicProtectedRoute>
                } />
                
                {/* Redirect old English routes to French routes */}
                <Route path="/" element={<Navigate to="/accueil" replace />} />
                <Route path="/home" element={<Navigate to="/accueil" replace />} />
                <Route path="/about" element={<Navigate to="/a-propos" replace />} />
                <Route path="/our-psychics" element={<Navigate to="/nos-mediums" replace />} />
                <Route path="/psychics" element={<Navigate to="/nos-mediums" replace />} />
                <Route path="/blogs" element={<Navigate to="/articles" replace />} />
                <Route path="/terms-&-conditions" element={<Navigate to="/conditions-generales" replace />} />
                <Route path="/login" element={<Navigate to="/connexion" replace />} />
                <Route path="/register" element={<Navigate to="/inscription" replace />} />
                <Route path="/forgot-password" element={<Navigate to="/mot-de-passe-oublie" replace />} />
                <Route path="/reset-password/:token" element={<Navigate to="/reinitialiser-mot-de-passe/:token" replace />} />
                <Route path="/otp-verification" element={<Navigate to="/verification-otp" replace />} />
                <Route path="/dashboard" element={<Navigate to="/tableau-de-bord" replace />} />
                <Route path="/account" element={<Navigate to="/compte" replace />} />
                <Route path="/appointments" element={<Navigate to="/rendez-vous" replace />} />
                <Route path="/consultations" element={<Navigate to="/mes-consultations" replace />} />
                <Route path="/wallet" element={<Navigate to="/portefeuille" replace />} />
                <Route path="/chat-sessions" element={<Navigate to="/sessions-chat" replace />} />
                <Route path="/favourites" element={<Navigate to="/favoris" replace />} />
                <Route path="/update-profile" element={<Navigate to="/modifier-profil" replace />} />
                <Route path="/history" element={<Navigate to="/historique" replace />} />
                <Route path="/all-notifications" element={<Navigate to="/notifications" replace />} />
                <Route path="/form-fill" element={<Navigate to="/formulaire-ia" replace />} />
                <Route path="/payment/result" element={<Navigate to="/paiement/resultat" replace />} />
                <Route path="/payment/result-temp" element={<Navigate to="/paiement/redirection" replace />} />
                <Route path="/audio-call/:callSessionId" element={<Navigate to="/appel-audio/:callSessionId" replace />} />
                <Route path="/call-history" element={<Navigate to="/historique-appels" replace />} />
                
                {/* Psychic route redirects */}
                <Route path="/psychic/login" element={<Navigate to="/medium/connexion" replace />} />
                <Route path="/psychic/register" element={<Navigate to="/medium/inscription" replace />} />
                <Route path="/psychic/forgot-password" element={<Navigate to="/medium/mot-de-passe-oublie" replace />} />
                <Route path="/psychic/reset-password/:resetToken" element={<Navigate to="/medium/reinitialiser-mot-de-passe/:resetToken" replace />} />
                <Route path="/psychic/dashboard" element={<Navigate to="/medium/tableau-de-bord" replace />} />
                <Route path="/psychic/dashboard/chats" element={<Navigate to="/medium/tableau-de-bord/chats" replace />} />
                <Route path="/psychic/dashboard/golive" element={<Navigate to="/medium/tableau-de-bord/en-ligne" replace />} />
                <Route path="/psychic/dashboard/profile" element={<Navigate to="/medium/tableau-de-bord/profil" replace />} />
                <Route path="/psychic/dashboard/earning" element={<Navigate to="/medium/tableau-de-bord/gains" replace />} />
                <Route path="/psychic/call/:callRequestId" element={<Navigate to="/medium/appel/:callRequestId" replace />} />
                <Route path="/psychic/dashboard/reviews" element={<Navigate to="/medium/tableau-de-bord/avis" replace />} />
                <Route path="/psychic/dashboard/settings" element={<Navigate to="/medium/tableau-de-bord/parametres" replace />} />
                <Route path="/psychic/dashboard/call-history" element={<Navigate to="/medium/tableau-de-bord/historique-appels" replace />} />
                
                {/* Admin route redirects */}
                <Route path="/admin/login" element={<Navigate to="/admin/connexion" replace />} />
                <Route path="/admin/dashboard" element={<Navigate to="/admin/tableau-de-bord" replace />} />
                <Route path="/admin/dashboard/transactions" element={<Navigate to="/admin/tableau-de-bord/transactions" replace />} />
                <Route path="/admin/dashboard/reviews" element={<Navigate to="/admin/tableau-de-bord/avis" replace />} />
                <Route path="/admin/dashboard/add-advisor" element={<Navigate to="/admin/tableau-de-bord/ajouter-medium" replace />} />
                <Route path="/admin/dashboard/sendmail" element={<Navigate to="/admin/tableau-de-bord/envoyer-email" replace />} />
                <Route path="/admin/dashboard/human-reviews" element={<Navigate to="/admin/tableau-de-bord/avis-mediums" replace />} />
                <Route path="/admin/dashboard/visitors" element={<Navigate to="/admin/tableau-de-bord/visiteurs" replace />} />
                <Route path="/admin/dashboard/allusers" element={<Navigate to="/admin/tableau-de-bord/utilisateurs" replace />} />
                <Route path="/admin/dashboard/psychic-earnings" element={<Navigate to="/admin/tableau-de-bord/gains-mediums" replace />} />
                <Route path="/admin/dashboard/blogs" element={<Navigate to="/admin/tableau-de-bord/articles" replace />} />
                <Route path="/admin/dashboard/blogs/add" element={<Navigate to="/admin/tableau-de-bord/articles/ajouter" replace />} />
                <Route path="/admin/dashboard/blogs/edit/:id" element={<Navigate to="/admin/tableau-de-bord/articles/modifier/:id" replace />} />
                <Route path="/admin/dashboard/comments" element={<Navigate to="/admin/tableau-de-bord/commentaires" replace />} />
                <Route path="/admin/dashboard/pages/home" element={<Navigate to="/admin/tableau-de-bord/pages/accueil" replace />} />
                <Route path="/admin/dashboard/pages/about" element={<Navigate to="/admin/tableau-de-bord/pages/a-propos" replace />} />
                <Route path="/admin/dashboard/pages/contact" element={<Navigate to="/admin/tableau-de-bord/pages/contact" replace />} />
                <Route path="/admin/dashboard/pages/terms" element={<Navigate to="/admin/tableau-de-bord/pages/conditions" replace />} />
                <Route path="/admin/dashboard/pages/footer" element={<Navigate to="/admin/tableau-de-bord/pages/pied-page" replace />} />
                <Route path="/admin/dashboard/pages/psychics" element={<Navigate to="/admin/tableau-de-bord/pages/mediums" replace />} />
                <Route path="/admin/dashboard/pages/packages" element={<Navigate to="/admin/tableau-de-bord/pages/forfaits" replace />} />
                <Route path="/admin/dashboard/alladvisors" element={<Navigate to="/admin/tableau-de-bord/tous-mediums" replace />} />
                <Route path="/admin/dashboard/inputs-data" element={<Navigate to="/admin/tableau-de-bord/donnees-ia" replace />} />
                <Route path="/admin/dashboard/newcoach" element={<Navigate to="/admin/tableau-de-bord/coachs-humains" replace />} />
                <Route path="/admin/dashboard/add-humancoach" element={<Navigate to="/admin/tableau-de-bord/ajouter-coach-humain" replace />} />
                <Route path="/admin/dashboard/all-notifications" element={<Navigate to="/admin/tableau-de-bord/toutes-notifications" replace />} />
                <Route path="/admin/dashboard/update-conditions" element={<Navigate to="/admin/tableau-de-bord/mettre-jour-conditions" replace />} />
                <Route path="/admin/dashboard/user-details/:userId" element={<Navigate to="/admin/tableau-de-bord/details-utilisateur/:userId" replace />} />
                <Route path="/admin/dashboard/update-about" element={<Navigate to="/admin/tableau-de-bord/mettre-jour-a-propos" replace />} />
                <Route path="/admin/dashboard/users-chat" element={<Navigate to="/admin/tableau-de-bord/chats-utilisateurs" replace />} />
                <Route path="/admin/dashboard/user-chat-detail/:chatId" element={<Navigate to="/admin/tableau-de-bord/details-chat/:chatId" replace />} />
                <Route path="/admin/dashboard/updateprofile" element={<Navigate to="/admin/tableau-de-bord/mettre-jour-profil" replace />} />
                <Route path="/admin/dashboard/profile" element={<Navigate to="/admin/tableau-de-bord/profil" replace />} />
                <Route path="/admin/dashboard/human-chat" element={<Navigate to="/admin/tableau-de-bord/chat-humain" replace />} />
                <Route path="/admin/dashboard/chat-details/:id" element={<Navigate to="/admin/tableau-de-bord/details-conversation/:id" replace />} />
                <Route path="/admin/dashboard/users/:userId/chats" element={<Navigate to="/admin/tableau-de-bord/utilisateurs/:userId/chats" replace />} />
                <Route path="/admin/dashboard/humancoach" element={<Navigate to="/admin/tableau-de-bord/donnees-mediums" replace />} />
                <Route path="/admin/dashboard/psychics/:id" element={<Navigate to="/admin/tableau-de-bord/mediums/:id" replace />} />
                
                {/* 404 Page */}
                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </main>
          </div>
          
          {shouldShowNavbar && !isChatInterfaceRoute && <ModernFooter />}
          
          <Toaster />
        </PsychicAuthProvider>
      </SocketProvider>
    </div>
  );
};

export default App;