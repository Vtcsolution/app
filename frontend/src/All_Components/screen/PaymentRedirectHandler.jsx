import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function PaymentRedirectHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for different possible parameter names
    const paymentId = searchParams.get('id') || 
                     searchParams.get('payment_id') || 
                     searchParams.get('payment_intent') || 
                     searchParams.get('session_id');
    
    console.log('PaymentRedirectHandler: paymentId=', paymentId); // Debug log
    
    if (paymentId) {
      // Store the payment ID for later use
      localStorage.setItem('lastPaymentId', paymentId);
      
      // Navigate to the result page with the payment ID
      navigate(`/payment/result?id=${paymentId}`);
    } else {
      console.warn('PaymentRedirectHandler: No paymentId found in search params');
      
      // Check if there's a stored payment ID as fallback
      const storedPaymentId = localStorage.getItem('lastPaymentId');
      if (storedPaymentId) {
        console.log('Using stored paymentId:', storedPaymentId);
        navigate(`/payment/result?id=${storedPaymentId}`);
      } else {
        // No payment ID found, go to result page without ID
        navigate('/payment/result');
      }
    }
  }, [searchParams, navigate]);

  return null;
}