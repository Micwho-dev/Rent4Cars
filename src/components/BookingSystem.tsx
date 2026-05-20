import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, CreditCard, CheckCircle, Upload, Printer, ArrowRight, ArrowLeft } from 'lucide-react';
import { Car, MessagingService, NotificationService } from '../services/dataService';
import { supabase } from '../lib/supabase';

interface BookingSystemProps {
  car: Car;
  user: any;
  onClose: () => void;
  onSuccess?: (car: Car) => void;
}

type Step = 'fulfillment' | 'duration' | 'identity' | 'payment' | 'confirmation';

export default function BookingSystem({ car, user, onClose, onSuccess }: BookingSystemProps) {
  const [step, setStep] = useState<Step>('fulfillment');
  const [formData, setFormData] = useState({
    fulfillment: 'pickup',
    deliveryCity: 'Davao City',
    address: '',
    startDate: '',
    days: 1,
    idType: 'PhilID',
    idFile: null as File | null,
    paymentMethod: 'later',
    onlineProvider: 'gcash'
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  const getShippingFee = () => {
    if (formData.fulfillment !== 'delivery') return 0;
    const freeCities = ['Davao City', 'Digos City', 'Mati City'];
    if (freeCities.includes(formData.deliveryCity)) return 0;
    
    if (formData.deliveryCity === 'Davao del Sur (Other)') return 500;
    if (formData.deliveryCity === 'Davao del Norte') return 2000;
    if (formData.deliveryCity === 'Davao de Oro') return 2000;
    if (formData.deliveryCity === 'Davao Oriental (Other)') return 1000;
    return 3500; // Other / Outside Region
  };

  const nextStep = () => {
    if (step === 'fulfillment') {
      if (formData.fulfillment === 'delivery' && !formData.address.trim()) {
        setSubmitError("Please enter a delivery address to proceed.");
        return;
      }
      setSubmitError(null);
      setStep('duration');
    }
    else if (step === 'duration') {
      if (!formData.startDate) {
        setSubmitError("Please select a start date to proceed.");
        return;
      }
      setSubmitError(null);
      setStep('identity');
    }
    else if (step === 'identity') {
      if (!formData.idFile) {
        setSubmitError("Please upload your ID to proceed.");
        return;
      }
      setSubmitError(null);
      setStep('payment');
    }
    else if (step === 'payment') {
      if (formData.paymentMethod === 'now' && !formData.onlineProvider) {
        setSubmitError("Please select an online payment provider.");
        return;
      }
      handleFinalize();
    }
  };

  const prevStep = () => {
    if (step === 'duration') setStep('fulfillment');
    else if (step === 'identity') setStep('duration');
    else if (step === 'payment') setStep('identity');
  };

  const handleFinalize = async () => {
    setSubmitError(null);
    
    // Generate XML payload as requested
    const xmlPayload = `
<rental_transaction>
  <user_id>${user?.id || 'anonymous'}</user_id>
  <user_name>${user?.user_metadata?.full_name || 'Guest User'}</user_name>
  <car_id>${car.id}</car_id>
  <car_name>${car.name}</car_name>
  <fulfillment>${formData.fulfillment}</fulfillment>
  <address>${formData.fulfillment === 'delivery' ? `${formData.deliveryCity}: ${formData.address}` : getCarHub()}</address>
  <days>${formData.days}</days>
  <total_price>${(formData.days * Number(car.price)) + getShippingFee()}</total_price>
  <id_type>${formData.idType}</id_type>
  <payment_method>${formData.paymentMethod}</payment_method>
  <timestamp>${new Date().toISOString()}</timestamp>
</rental_transaction>
    `.trim();

    try {
      // 1. Get Session Token safely
      let accessToken = '';
      try {
        const { data: { session } } = await supabase.auth.getSession();
        accessToken = session?.access_token || '';
      } catch (sessionErr) {
        console.warn("Could not retrieve Supabase session:", sessionErr);
      }

      // 2. Save to Supabase via Proxy
      const rentalData = {
        user_id: user?.id,
        user_name: user?.user_metadata?.full_name || user?.email || 'Guest User',
        car_id: car.id,
        car_name: car.name,
        days: formData.days,
        price: (formData.days * Number(car.price)) + getShippingFee(),
        payment_method: formData.paymentMethod === 'now' ? 'online' : 'in-person',
        online_provider: formData.paymentMethod === 'now' ? formData.onlineProvider : null,
        fulfillment: formData.fulfillment,
        deliver_to_location: formData.fulfillment === 'delivery',
        address: formData.fulfillment === 'delivery' ? `${formData.deliveryCity}: ${formData.address}` : getCarHub(),
        status: 'pending',
        _token: accessToken // Pass token in body to avoid 431 header error
      };

      console.log("[BookingSync] Posting to /api/rentals...");
      const response = await fetch('/api/rentals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rentalData),
      });

      if (!response.ok) {
        let errorMsg = `Server error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
          if (errorData.details) {
            errorMsg += " | Details: " + JSON.stringify(errorData.details);
          }
        } catch (e) {
          if (response.status === 431) errorMsg = "Request Header Fields Too Large (431).";
          else if (response.status === 413) errorMsg = "Payload Too Large (413). Server config or data size issue.";
          else if (response.status === 520) errorMsg = "Supabase Infrastructure Error (520).";
          else errorMsg = `Database Error (${response.status})`;
        }
        throw new Error(errorMsg);
      }

      console.log("[BookingSync] Rental record saved. Informing MessagingService...");

      // 3. Send Kafka Notification
      await MessagingService.sendMessage(
        user?.user_metadata?.full_name || 'System',
        'customer' as any,
        `NEW RENTAL LOGGED: ${car.name} for ${formData.days} days. Fulfillment: ${formData.fulfillment}. Total: ₱${(formData.days * Number(car.price)) + getShippingFee()}`,
        user.id
      ).catch(e => console.warn("Messaging notification failed:", e));

      // 4. Trigger Toast/Log Notification
      if (onSuccess) {
        onSuccess(car);
      } else {
        await NotificationService.produce({
          type: 'rental',
          priority: 'high',
          title: 'Booking Logged Successfully',
          message_body: `Your rental for ${car.name} is scheduled. Status: Pending Approval.`,
          read: false,
          userId: user.id
        }).catch(e => console.warn("Log notification failed:", e));
      }

      setStep('confirmation');
    } catch (err: any) {
      console.error('Submission Error:', err);
      // Clean up the error message for the UI
      const cleanMsg = err.message === 'Failed to fetch' 
        ? "Network Error. The backend server might be restarting to apply an update. Please try again in a few moments."
        : err.message.includes('<!DOCTYPE') 
        ? "Network Error (Cloudflare 520). Please try again in 1-2 minutes." 
        : err.message;
      setSubmitError(cleanMsg);
    }
  };

  const getCarHub = () => {
    const name = car.name.toLowerCase();
    if (name.includes('mirage') || name.includes('montero') || name.includes('navara') || name.includes('minivan')) return 'Digos City Hub';
    if (name.includes('corolla cross') || name.includes('ertiga') || name.includes('honda city') || name.includes('hiace')) return 'Mati City Hub';
    return 'Davao City Hub';
  };

  const renderStep = () => {
    switch (step) {
      case 'fulfillment':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="space-y-6"
          >
            <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Fulfillment Choice</h3>
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => setFormData({...formData, fulfillment: 'delivery'})}
                className={`p-6 rounded-3xl border-2 transition-all text-left flex items-start gap-4 ${formData.fulfillment === 'delivery' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-primary border border-gray-100 dark:border-gray-700">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Deliver to My Location</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Delivery within Davao Region.</p>
                </div>
              </button>

              {formData.fulfillment === 'delivery' && (
                <div className="space-y-4">
                  <select 
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-0 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    value={formData.deliveryCity}
                    onChange={(e) => setFormData({...formData, deliveryCity: e.target.value})}
                  >
                    <option value="Davao City">Davao City (Free Delivery)</option>
                    <option value="Digos City">Digos City (Free Delivery)</option>
                    <option value="Mati City">Mati City (Free Delivery)</option>
                    <option value="Davao del Sur (Other)">Davao del Sur - Other Areas (+₱500)</option>
                    <option value="Davao de Oro">Davao de Oro (+₱2,000)</option>
                    <option value="Davao del Norte">Davao del Norte (+₱2,000)</option>
                    <option value="Davao Oriental (Other)">Davao Oriental - Other Areas (+₱1,000)</option>
                    <option value="Other / Provincial">Other Provincial Regions (+₱3,500)</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Enter detailed delivery address..." 
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-0 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              )}

              <button 
                onClick={() => setFormData({...formData, fulfillment: 'pickup'})}
                className={`p-6 rounded-3xl border-2 transition-all text-left flex items-start gap-4 ${formData.fulfillment === 'pickup' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-primary border border-gray-100 dark:border-gray-700">
                  <Calendar size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Pick up at Car Location</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{getCarHub()}</p>
                </div>
              </button>
            </div>
          </motion.div>
        );

      case 'duration':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="space-y-6"
          >
            <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Rental Duration</h3>
            <div className="space-y-4">
              <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-3xl">
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Start Date</label>
                <input 
                  type="date" 
                  className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-2xl border border-gray-100 dark:border-gray-800 focus:ring-2 focus:ring-primary/20 dark:[color-scheme:dark]"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>

              <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-3xl">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Number of Days</label>
                  <span className="text-primary font-bold">{formData.days} Day(s)</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="30" 
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  value={formData.days}
                  onChange={(e) => setFormData({...formData, days: parseInt(e.target.value)})}
                />
                <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-bold uppercase">
                  <span>1 Day</span>
                  <span>30 Days</span>
                </div>
              </div>

              <div className="p-6 bg-primary/5 dark:bg-primary/10 rounded-3xl space-y-2 border border-primary/10 dark:border-primary/20">
                <div className="flex justify-between items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  <span>Base Rate ({formData.days} days x ₱{Number(car.price).toLocaleString()})</span>
                  <span>₱{(formData.days * Number(car.price)).toLocaleString()}</span>
                </div>
                {getShippingFee() > 0 && (
                  <div className="flex justify-between items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    <span>Shipping Fee ({formData.deliveryCity})</span>
                    <span>₱{getShippingFee().toLocaleString()}</span>
                  </div>
                )}
                {getShippingFee() === 0 && formData.fulfillment === 'delivery' && (
                  <div className="flex justify-between items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    <span>Shipping Fee ({formData.deliveryCity})</span>
                    <span>Free</span>
                  </div>
                )}
                <div className="pt-2 border-t border-primary/10 dark:border-primary/20 flex justify-between items-center">
                  <span className="font-bold text-gray-700 dark:text-white">Estimated Total:</span>
                  <span className="text-2xl font-display font-bold text-primary">₱{((formData.days * Number(car.price)) + getShippingFee()).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'identity':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="space-y-6"
          >
            <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Identity Verification</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Select ID Type</label>
                <select 
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-primary/20"
                  value={formData.idType}
                  onChange={(e) => setFormData({...formData, idType: e.target.value})}
                >
                  <option>Philippine ID (PhilID)</option>
                  <option>Passport</option>
                  <option>Driver’s License</option>
                  <option>UMID</option>
                  <option>PRC ID</option>
                </select>
              </div>

              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-12 text-center space-y-4 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer relative overflow-hidden group">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e) => setFormData({...formData, idFile: e.target.files?.[0] || null})}
                />
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400 dark:text-gray-500 mx-auto group-hover:bg-primary/5 group-hover:text-primary transition-all">
                  <Upload size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">{formData.idFile ? formData.idFile.name : 'Click to upload ID'}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">PDF, JPG, or PNG under 5MB</p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'payment':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="space-y-6"
          >
            <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Payment Method</h3>
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => setFormData({...formData, paymentMethod: 'now'})}
                className={`p-6 rounded-3xl border-2 transition-all text-left flex items-start gap-4 ${formData.paymentMethod === 'now' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-primary border border-gray-100 dark:border-gray-700">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Pay Now</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Secure online transaction with partner providers.</p>
                </div>
              </button>

              {formData.paymentMethod === 'now' && (
                <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                  {['gcash', 'maya', 'bank'].map((provider) => (
                    <button
                      key={provider}
                      onClick={() => setFormData({...formData, onlineProvider: provider})}
                      className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${formData.onlineProvider === provider ? 'bg-white dark:bg-gray-900 border-primary text-primary shadow-sm' : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                      {provider === 'gcash' ? 'GCash' : provider === 'maya' ? 'Maya' : 'Bank'}
                    </button>
                  ))}
                </div>
              )}

              <button 
                onClick={() => setFormData({...formData, paymentMethod: 'later'})}
                className={`p-6 rounded-3xl border-2 transition-all text-left flex items-start gap-4 ${formData.paymentMethod === 'later' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-primary border border-gray-100 dark:border-gray-700">
                  <ArrowRight size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Pay in Person</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Settle your balance upon vehicle fulfillment.</p>
                </div>
              </button>
            </div>
          </motion.div>
        );

      case 'confirmation':
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="space-y-8 text-center"
          >
            <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-500/20">
              <CheckCircle size={40} />
            </div>
            
            <div>
              <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Booking Confirmed!</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Your rental voucher has been generated and filed in our XML ledger.</p>
            </div>

            <div id="rental-voucher" className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-[2rem] p-8 text-left space-y-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10 dark:opacity-5">
                 <CheckCircle size={120} />
               </div>
               
               <div className="flex justify-between items-start">
                 <div>
                   <h4 className="text-primary font-bold uppercase tracking-widest text-xs mb-1">Rental Voucher</h4>
                   <p className="font-display font-bold text-xl text-gray-900 dark:text-white">{user?.user_metadata?.full_name || 'Mark Pardillo'}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] text-gray-400 uppercase font-bold">Ref No.</p>
                   <p className="font-mono text-sm font-bold">R4C-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-8 border-y border-gray-50 dark:border-gray-700 py-6">
                 <div>
                   <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Vehicle</p>
                   <p className="font-bold text-gray-900 dark:text-white">{car.name}</p>
                   <p className="text-xs text-gray-500 dark:text-gray-400">{car.type}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Fulfillment</p>
                   <p className="font-bold text-gray-900 dark:text-white capitalize">{formData.fulfillment}</p>
                   <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={formData.fulfillment === 'delivery' ? `${formData.deliveryCity}: ${formData.address}` : getCarHub()}>
                     {formData.fulfillment === 'delivery' ? `${formData.deliveryCity}: ${formData.address}` : getCarHub()}
                   </p>
                 </div>
                 <div>
                   <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Duration</p>
                   <p className="font-bold text-gray-900 dark:text-white">{formData.days} Day(s)</p>
                   <p className="text-xs text-gray-500 dark:text-gray-400">Starts: {formData.startDate || 'TBD'}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Amount Due</p>
                   <p className="font-bold text-primary">₱{((formData.days * Number(car.price)) + getShippingFee()).toLocaleString()}</p>
                   <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{formData.paymentMethod === 'now' ? 'Paid Online' : 'Pay on Arrival'}</p>
                 </div>
               </div>

               <button 
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-transparent dark:border-gray-700"
               >
                 <Printer size={18} />
                 Print Receipt
               </button>
            </div>

            <button 
              onClick={onClose}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl shadow-gray-900/20 hover:opacity-90 transition-all"
            >
              Done
            </button>
          </motion.div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
      >
        <div className="p-8 pb-0 flex justify-between items-center shrink-0">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => {
              const active = (step === 'fulfillment' && i === 1) || 
                             (step === 'duration' && i === 2) || 
                             (step === 'identity' && i === 3) || 
                             (step === 'payment' && i === 4) ||
                             (step === 'confirmation');
              return (
                <div 
                  key={i} 
                  className={`h-1.5 w-12 rounded-full transition-all duration-500 ${active ? 'bg-primary' : 'bg-gray-100 dark:bg-gray-800'}`}
                />
              );
            })}
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar relative">
          <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 pt-8 pb-2 -mx-8 px-8 transition-colors" style={{marginLeft: '-2rem', marginRight: '-2rem'}}>
            {submitError && (
              <div className="mb-4 p-4 bg-primary border-2 border-primary rounded-2xl text-white text-sm font-bold flex justify-between items-center shadow-lg shadow-primary/20">
                <span>{submitError}</span>
                <button onClick={() => setSubmitError(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          {renderStep()}
        </div>

        {step !== 'confirmation' && (
          <div className="p-8 pt-0 flex gap-3 shrink-0">
            {step !== 'fulfillment' && (
              <button 
                onClick={prevStep}
                className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-transparent dark:border-gray-700"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <button 
              onClick={nextStep}
              className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2 group"
            >
              {step === 'payment' ? 'Complete Booking' : 'Next Step'}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
