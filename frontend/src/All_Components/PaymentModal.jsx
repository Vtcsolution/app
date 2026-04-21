import { usePaymentModal } from "@/context/PaymentModalContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Check, Loader2, CreditCard, Euro, Award, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export default function PaymentModal() {
  const {
    isOpen,
    closeModal,
    selectedPlan,
    setSelectedPlan,
    amount,
    setAmount,
    customAmount,
    setCustomAmount,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    handlePayment,
    isProcessing,
    creditPlans,
    loadCreditPlans,
    calculateCustomAmount
  } = usePaymentModal();

  const [calculatedCredits, setCalculatedCredits] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Define EURO credit plans - 10min=20€, 30min=50€, 60min=90€
  const eurCreditPlans = [
    { 
      id: '10min', 
      name: 'Forfait 10 Minutes', 
      amount: 20, // 20€
      credits: 20,
      totalCredits: 20,
      bonusCredits: 0,
      pricePerCredit: 1.00,
      pricePerMinute: 2.00,
      minutes: 10,
      description: '10 minutes de consultation pour 20€',
      popular: false,
      icon: '⚡'
    },
    { 
      id: '30min', 
      name: 'Forfait 30 Minutes', 
      amount: 50, // 50€
      credits: 50,
      totalCredits: 50,
      bonusCredits: 0,
      pricePerCredit: 1.00,
      pricePerMinute: 1.67,
      minutes: 30,
      description: '30 minutes de consultation pour 50€',
      popular: true,
      icon: '⭐'
    },
    { 
      id: '60min', 
      name: 'Forfait 60 Minutes', 
      amount: 90, // 90€
      credits: 90,
      totalCredits: 90,
      bonusCredits: 0,
      pricePerCredit: 1.00,
      pricePerMinute: 1.50,
      minutes: 60,
      description: '60 minutes de consultation pour 90€',
      popular: false,
      icon: '💎'
    },
    { 
      id: '100euro', 
      name: 'Forfait 100€', 
      amount: 100, // 100€
      credits: 100,
      totalCredits: 110,
      bonusCredits: 10,
      pricePerCredit: 0.91,
      pricePerMinute: 0.91,
      minutes: 110,
      description: '100€ + 10 crédits bonus = 110 minutes',
      popular: false,
      icon: '🎁'
    },
    { 
      id: '200euro', 
      name: 'Forfait 200€', 
      amount: 200, // 200€
      credits: 200,
      totalCredits: 230,
      bonusCredits: 30,
      pricePerCredit: 0.87,
      pricePerMinute: 0.87,
      minutes: 230,
      description: '200€ + 30 crédits bonus = 230 minutes',
      popular: false,
      icon: '🏆'
    }
  ];

  // Load credit plans on modal open
  useEffect(() => {
    if (isOpen) {
      // Set default plan
      setSelectedPlan(eurCreditPlans[0]);
      setAmount(eurCreditPlans[0].amount);
      setCustomAmount('');
      setCalculatedCredits(null);
    }
  }, [isOpen]);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setAmount(plan.amount);
    setCustomAmount('');
    setCalculatedCredits(null);
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCustomAmount(value);
      setSelectedPlan({ id: 'custom', name: 'Montant Personnalisé' });
      
      // Calculate preview for custom amount
      if (value && parseFloat(value) >= 5) {
        const numAmount = parseFloat(value);
        const baseCredits = Math.floor(numAmount);
        const bonusCredits = calculateBonusCredits(numAmount);
        setCalculatedCredits({
          amount: numAmount,
          baseCredits,
          bonusCredits,
          totalCredits: baseCredits + bonusCredits
        });
      } else {
        setCalculatedCredits(null);
      }
    }
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
  };

  const renderPlanBenefits = (plan) => {
    if (plan.bonusCredits > 0) {
      return (
        <div className="mt-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-yellow-500" />
          <span className="text-xs text-yellow-600 font-medium">
            +{plan.bonusCredits} crédits bonus ({Math.round((plan.bonusCredits/plan.credits)*100)}% bonus)
          </span>
        </div>
      );
    }
    return null;
  };

  const calculateSavings = (plan) => {
    if (plan.bonusCredits > 0) {
      const savings = (plan.bonusCredits * plan.pricePerCredit).toFixed(2);
      return (
        <div className="mt-1 flex items-center gap-1">
          <Zap className="w-3 h-3 text-green-500" />
          <span className="text-xs text-green-600 font-medium">
            Économisez {savings}€ avec le bonus
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="max-w-[95vw] sm:max-w-[450px] max-h-[85vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-500" />
            Acheter des Crédits
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            💰 1 crédit = 1€ • ⏱️ 1 crédit = 1 minute de consultation
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Credit Packages Section */}
          <div className="space-y-3">
            <h3 className="text-base font-medium flex items-center gap-2">
              <Euro className="w-4 h-4" />
              Choisissez un forfait
            </h3>
            <div className="grid gap-3">
              {eurCreditPlans.map((plan) => (
                <motion.div
                  key={plan.id}
                  className={`border rounded-xl p-4 cursor-pointer transition-all relative ${
                    selectedPlan?.id === plan.id 
                      ? "border-purple-500 bg-gradient-to-r from-purple-50 to-white shadow-md ring-2 ring-purple-200" 
                      : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  }`}
                  onClick={() => handlePlanSelect(plan)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {plan.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                        🏆 LE PLUS POPULAIRE
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{plan.icon}</span>
                        <h4 className="font-bold text-base text-gray-900">{plan.name}</h4>
                        {plan.bonusCredits > 0 && (
                          <span className="bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-yellow-200">
                            +{plan.bonusCredits} BONUS
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {plan.minutes || plan.totalCredits} minutes de consultation
                      </p>
                      {renderPlanBenefits(plan)}
                      {calculateSavings(plan)}
                    </div>
                    <div className="text-right min-w-[100px]">
                      <div className="mb-1">
                        <p className="font-extrabold text-lg text-gray-900">{plan.amount}€</p>
                        <p className="text-xs text-gray-500 font-medium">
                          EUR
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-1.5">
                        <p className="text-xs font-semibold text-purple-700">
                          {plan.pricePerMinute?.toFixed(2)}€/min
                        </p>
                      </div>
                    </div>
                  </div>
                  {selectedPlan?.id === plan.id && (
                    <div className="mt-3 pt-3 border-t border-purple-100">
                      <div className="flex items-center justify-center gap-2 text-purple-600 font-medium">
                        <Check className="w-4 h-4" />
                        <span className="text-sm">Sélectionné</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Custom Amount Option */}
              <motion.div
                className={`border rounded-xl p-4 cursor-pointer transition-all ${
                  selectedPlan?.id === 'custom'
                    ? "border-green-500 bg-gradient-to-r from-green-50 to-white shadow-md ring-2 ring-green-200" 
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
                onClick={() => setSelectedPlan({ id: 'custom', name: 'Montant Personnalisé' })}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-2 rounded-xl">
                      <Euro className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-gray-900">Montant Personnalisé</h4>
                      <p className="text-sm text-gray-600">Choisissez votre montant (min 5€)</p>
                    </div>
                  </div>
                  {selectedPlan?.id === 'custom' && (
                    <div className="bg-green-100 p-1 rounded-full">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                </div>
                
                {selectedPlan?.id === 'custom' && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Entrez le montant en EUR (Minimum 5€)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 font-bold">€</span>
                        </div>
                        <input
                          type="text"
                          value={customAmount}
                          onChange={handleCustomAmountChange}
                          placeholder="Ex: 15, 25, 50"
                          className="block w-full pl-7 pr-12 py-3 border border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 font-medium">EUR</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Preview for custom amount */}
                    {customAmount && parseFloat(customAmount) >= 5 && calculatedCredits && (
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-4 animate-in fade-in duration-300">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="space-y-1">
                            <p className="text-gray-600 font-medium">Montant :</p>
                            <p className="font-bold text-lg text-gray-900">
                              {calculatedCredits.amount.toFixed(2)}€
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-gray-600 font-medium">Crédits de base :</p>
                            <p className="font-bold text-lg text-gray-900">
                              {calculatedCredits.baseCredits} crédits
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-gray-600 font-medium">Crédits Bonus :</p>
                            <p className="font-bold text-lg text-green-600">
                              +{calculatedCredits.bonusCredits} crédits
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-gray-600 font-medium">Total Crédits :</p>
                            <p className="font-bold text-lg text-purple-600">
                              {calculatedCredits.totalCredits} crédits
                            </p>
                          </div>
                        </div>
                        
                        {/* Bonus explanation */}
                        {calculatedCredits.bonusCredits > 0 && (
                          <div className="mt-3 pt-3 border-t border-purple-200">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Bonus gagné :</span>
                              <span className="text-xs font-semibold text-green-600">
                                {Math.round((calculatedCredits.bonusCredits/calculatedCredits.baseCredits)*100)}% de crédits en plus
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              💰 Plus vous rechargez, plus vous gagnez de bonus !
                            </div>
                          </div>
                        )}
                        
                        {/* Minutes equivalent */}
                        <div className="mt-3 pt-3 border-t border-purple-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Équivalent en minutes :</span>
                            <span className="text-xs font-semibold text-purple-600">
                              {calculatedCredits.totalCredits} minutes de consultation
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {customAmount && parseFloat(customAmount) < 5 && (
                      <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-600 text-sm font-medium">
                          ⚠️ Le montant minimum est de 5€
                        </p>
                      </div>
                    )}
                    
                    {!customAmount && (
                      <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-gray-600 text-sm">
                          💡 Exemple : 15€ = 15 crédits + 2 crédits bonus = 17 minutes
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="space-y-3">
            <h3 className="text-base font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Mode de Paiement
            </h3>
            <div className="space-y-2">
              <motion.button
                className={`w-full flex justify-between items-center py-3 px-4 border rounded-lg text-base transition-all ${
                  selectedPaymentMethod === "card" 
                    ? "border-purple-500 bg-gradient-to-r from-purple-50 to-white shadow-sm ring-2 ring-purple-200" 
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
                onClick={() => handlePaymentMethodSelect("card")}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-2 rounded-lg">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-gray-900 block">Carte Bancaire</span>
                    <span className="text-xs text-gray-500">Paiement sécurisé avec Visa, Mastercard, Amex</span>
                  </div>
                </div>
                {selectedPaymentMethod === "card" && (
                  <div className="bg-purple-100 p-1 rounded-full">
                    <Check className="w-5 h-5 text-purple-600" />
                  </div>
                )}
              </motion.button>

              {/* Payment Icons */}
              <div className="flex items-center justify-center gap-4 pt-3 px-4">
                <div className="flex items-center gap-2">
                  <img 
                    src="https://js.stripe.com/v3/fingerprinted/img/visa-3659c4f5c0968b2b4c5c8a0e5e8b8c7b.svg" 
                    alt="Visa" 
                    className="h-6"
                  />
                  <img 
                    src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" 
                    alt="Mastercard" 
                    className="h-6"
                  />
                  <img 
                    src="https://js.stripe.com/v3/fingerprinted/img/amex-a8a6aef5a7bd4bdc99b14fcb4f2c5d5d.svg" 
                    alt="American Express" 
                    className="h-6"
                  />
                  <img 
                    src="https://js.stripe.com/v3/fingerprinted/img/discover-7c6c8c0a5d5c6b2b4c5c8a0e5e8b8c7b.svg" 
                    alt="Discover" 
                    className="h-6"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary and Payment Button */}
          <div className="space-y-4 pt-2 border-t">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Forfait sélectionné :</span>
                <span className="font-bold text-gray-900">
                  {selectedPlan?.name || 'Aucun forfait'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Montant :</span>
                <span className="text-xl font-extrabold text-gray-900">
                  {(selectedPlan?.id === 'custom' && customAmount ? parseFloat(customAmount) : amount).toFixed(2)}€ EUR
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Vous recevez :</span>
                <span className="text-xl font-extrabold text-purple-600 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  {selectedPlan?.id === 'custom' && calculatedCredits 
                    ? `${calculatedCredits.totalCredits} crédits`
                    : selectedPlan?.totalCredits 
                      ? `${selectedPlan.totalCredits} crédits` 
                      : '0 crédits'
                  }
                </span>
              </div>
              
              {/* Minutes equivalent */}
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Équivalent en minutes :</span>
                <span className="font-bold text-purple-600">
                  {selectedPlan?.id === 'custom' && calculatedCredits 
                    ? `${calculatedCredits.totalCredits} minutes`
                    : selectedPlan?.minutes || selectedPlan?.totalCredits || 0} minutes
                </span>
              </div>
              
              {selectedPlan?.bonusCredits > 0 && (
                <div className="flex justify-between items-center bg-yellow-50 rounded-lg p-2">
                  <span className="text-gray-700 font-medium">Bonus inclus :</span>
                  <span className="font-bold text-yellow-600">
                    +{selectedPlan.bonusCredits} crédits
                  </span>
                </div>
              )}
            </div>

            <motion.button
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-base font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              disabled={
                isProcessing || 
                !selectedPlan || 
                (selectedPlan?.id === 'custom' && (!customAmount || parseFloat(customAmount) < 5))
              }
              onClick={handlePayment}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="font-semibold">Traitement du paiement...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  <span>
                    {selectedPlan?.id === 'custom'
                      ? `Payer ${parseFloat(customAmount || 0).toFixed(2)}€ EUR`
                      : `Payer ${amount.toFixed(2)}€ EUR`
                    }
                  </span>
                </div>
              )}
            </motion.button>
            
            <div className="text-center space-y-1.5">
              <p className="text-xs text-gray-500">
                🔒 Paiement sécurisé par Stripe
              </p>
              <p className="text-xs text-gray-500">
                💳 Vos informations de paiement sont cryptées et sécurisées
              </p>
              <p className="text-xs font-medium text-purple-600">
                ✨ 1 crédit = 1 minute de consultation
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to calculate bonus credits
function calculateBonusCredits(amount) {
  if (amount >= 200) return 30; // 15% bonus
  if (amount >= 100) return 10; // 10% bonus
  if (amount >= 50) return 0;   // No bonus for 50€
  if (amount >= 25) return 0;   // No bonus for under 100€
  return 0;
}