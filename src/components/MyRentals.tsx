import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Loader2, Calendar, MapPin, CreditCard, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CarTracker from './CarTracker';

interface MyRentalsProps {
  user: any;
  onClose: () => void;
}

export default function MyRentals({ user, onClose }: MyRentalsProps) {
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trackingRental, setTrackingRental] = useState<any>(null);

  useEffect(() => {
    fetchRentals();
  }, [user?.id]);

  const fetchRentals = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch(`/api/my-rentals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, _token: token })
      });
      
      if (!response.ok) {
        let errorMsg = `Server error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          // If not JSON, it's likely a 520 HTML or similar
          if (response.status === 431) errorMsg = "Header too large (431). Please check Supabase service role key setup.";
          else if (response.status === 520) errorMsg = "Supabase Infrastructure Error (520).";
          else errorMsg = `HTTP Error ${response.status}`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setRentals(data || []);
      
      if (!data || data.length === 0) {
        setError(`No rental records found for your account.`);
      }
    } catch (err: any) {
      console.error("Fetch Exception:", err);
      // Don't show technical HTML in UI
      const cleanMsg = err.message.includes('<!DOCTYPE') ? "Database connection error (Supabase 520)." : err.message;
      setError(`Database Error: ${cleanMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
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
        className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[80vh]"
      >
        <div className="p-8 pb-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">My Rentals</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track your past and pending rent bookings.</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchRentals}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
              title="Refresh"
            >
              <Loader2 size={20} className={loading ? "animate-spin" : ""} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50/50 dark:bg-gray-800/10">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm animate-pulse">
                  <div className="flex justify-between items-start mb-4 border-b border-gray-50 dark:border-gray-700 pb-4">
                    <div>
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-32 mb-2" />
                      <div className="flex gap-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-16" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-20" />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-24 mb-1 ms-auto" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-12 ms-auto" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex gap-2">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0" />
                      <div className="space-y-1">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-16" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-24" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0" />
                      <div className="space-y-1">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-16" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-24" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
               <Calendar size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
               <p className="text-gray-500 dark:text-gray-400 font-medium">{error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rentals.map((rental) => (
                <div key={rental.id || rental.created_at} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4 border-b border-gray-50 dark:border-gray-700 pb-4">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{rental.car_name || 'Vehicle'}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                          {rental.status === 'approved' ? 'READY' : rental.status === 'out' ? 'OUT OF COMPANY' : rental.status === 'completed' ? 'CAR IS ON YOUR HAND' : rental.status || 'Pending'}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                           {rental.created_at ? new Date(rental.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-display font-bold text-primary">₱{(rental.price || rental.total_price || 0).toLocaleString()}</p>
                      <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">{rental.days || 1} Day(s)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                       <MapPin size={16} className="text-gray-400 dark:text-gray-500 mt-0.5" />
                       <div>
                         <p className="font-bold text-gray-700 dark:text-gray-300">Fulfillment</p>
                         <p className="text-gray-500 dark:text-gray-400 text-xs capitalize">{rental.fulfillment || 'Pickup'} - {rental.address || 'Hub'}</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-2">
                       <CreditCard size={16} className="text-gray-400 dark:text-gray-500 mt-0.5" />
                       <div>
                         <p className="font-bold text-gray-700 dark:text-gray-300">Payment</p>
                         <p className="text-gray-500 dark:text-gray-400 text-xs capitalize">
                           {rental.payment_method === 'online' || rental.payment_method === 'now' ? 'Online' : 'In Person'}
                           {rental.online_provider && ` (${rental.online_provider.toUpperCase()})`}
                         </p>
                       </div>
                    </div>
                  </div>
                  
                  {(rental.status === 'out' || rental.status === 'completed' || rental.status === 'approved') && (
                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                      <button 
                        onClick={() => setTrackingRental(rental)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 rounded-xl font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 shadow-md shadow-gray-900/10 dark:shadow-none"
                      >
                        <Navigation size={14} className="text-blue-400 dark:text-primary" />
                        Track Vehicle
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {trackingRental && (
          <CarTracker rental={trackingRental} onClose={() => setTrackingRental(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
