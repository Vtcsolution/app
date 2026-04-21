import { createContext, useState, useContext } from 'react';
import axios from 'axios'; // If needed for handlePayment
import { toast } from 'sonner'; // If needed for notifications
import { useNavigate } from 'react-router-dom'; // If needed for navigation

const PaymentModalContext = createContext();

export function PaymentModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [amount, setAmount] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate(); // Optional, if navigation is needed

  const openModal = () => setIsOpen(true);
  const closeModal = () => {
    setIsOpen(false);
    setSelectedPlan(null);
    setAmount(0);
    setSelectedPaymentMethod(null);
  };

  // Inside your usePaymentModal context
const handlePayment = async () => {
  if (!selectedPaymentMethod || !selectedPlan || isProcessing) return;
  
  setIsProcessing(true);
  
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_BASE_URL}/api/payments/topup`,
      {
        amount: selectedPlan.price,
        planId: selectedPlan.id || 'custom',
        planName: selectedPlan.name,
        credits: selectedPlan.credits,
        paymentMethod: selectedPaymentMethod
      },
      {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      }
    );

    if (response.data.success) {
      // Store payment info
      localStorage.setItem('lastPaymentId', response.data.paymentId);
      
      if (response.data.clientSecret) {
        // Handle card payment with Stripe Elements
        // ... your Stripe Elements handling code
      } else if (response.data.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.url;
      } else if (response.data.sessionId) {
        // Redirect to checkout page
        window.location.href = `/payment/checkout/${response.data.sessionId}`;
      }
    }
  } catch (error) {
    console.error('Payment error:', error);
    toast.error(error.response?.data?.error || 'Payment failed');
  } finally {
    setIsProcessing(false);
  }
};

  return (
    <PaymentModalContext.Provider
      value={{
        isOpen,
        openModal,
        closeModal,
        selectedPlan,
        setSelectedPlan,
        amount,
        setAmount,
        selectedPaymentMethod,
        setSelectedPaymentMethod,
        handlePayment,
        isProcessing,
      }}
    >
      {children}
    </PaymentModalContext.Provider>
  );
}

export const usePaymentModal = () => {
  const context = useContext(PaymentModalContext);
  if (context === undefined) {
    throw new Error('usePaymentModal must be used within a PaymentModalProvider');
  }
  return context;
};