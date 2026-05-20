import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Loader2, Calendar, MapPin, CreditCard, Bell } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminRentalsProps {
  onClose: () => void;
}

export default function AdminRentals({ onClose }: AdminRentalsProps) {
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/admin/rentals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setRentals(data || []);
      
      if (!data || data.length === 0) {
        setError(`No rental records found.`);
      }
    } catch (err: any) {
      console.error("Fetch Exception:", err);
      setError(`Database Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (rentalId: string, newStatus: string, userId: string, carName: string) => {
    setUpdating(rentalId);
    try {
      const response = await fetch('/api/admin/rentals/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rental_id: rentalId, status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');

      // Send Notification to user (using matching format in server.ts)
      const messageBody = newStatus === 'approved' 
        ? `Your rental request for ${carName} has been approved. The car is Ready.` 
        : newStatus === 'out' 
        ? `Your rented ${carName} is currently Out of Company.`
        : newStatus === 'completed'
        ? `Your rental for ${carName} is now marked as Completed (Car is On Your Hand).`
        : `Your rental request for ${carName} has been updated to ${newStatus}.`;

      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // See priority parsing in server.ts
        body: JSON.stringify({
          userId: userId,
          type: 'rental_update',
          priority: 'high',
          title: 'Rental Status Updated',
          message_body: messageBody
        })
      });

      // Update local state
      setRentals(rentals.map(r => r.id === rentalId ? { ...r, status: newStatus } : r));
    } catch (err) {
      console.error("Update Error:", err);
      alert("Failed to update status");
    } finally {
      setUpdating(null);
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
        className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[85vh]"
      >
        <div className="p-8 pb-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Admin Dashboard: Rentals</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage all user rentals and update statuses.</p>
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
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50/50 dark:bg-gray-800/10">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 size={32} className="animate-spin text-primary" />
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">User ID: {rental.user_id}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Current Status:</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                          {rental.status === 'approved' ? 'READY' : rental.status === 'out' ? 'OUT OF COMPANY' : rental.status === 'completed' ? 'CAR IS ON YOUR HAND' : rental.status || 'Pending'}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                           {rental.created_at ? new Date(rental.created_at).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-display font-bold text-primary">₱{(rental.price || rental.total_price || 0).toLocaleString()}</p>
                      <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">{rental.days || 1} Day(s)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="flex items-start gap-2">
                       <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                       <div>
                         <p className="font-bold text-gray-700 dark:text-gray-300">Fulfillment</p>
                         <p className="text-gray-500 dark:text-gray-400 text-xs capitalize">{rental.fulfillment || 'Pickup'} - {rental.address || 'Hub'}</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-2">
                       <CreditCard size={16} className="text-gray-400 mt-0.5 shrink-0" />
                       <div>
                         <p className="font-bold text-gray-700 dark:text-gray-300">Payment</p>
                         <p className="text-gray-500 dark:text-gray-400 text-xs capitalize">
                           {rental.payment_method === 'online' || rental.payment_method === 'now' ? 'Online' : 'In Person'}
                           {rental.online_provider && ` (${rental.online_provider.toUpperCase()})`}
                         </p>
                       </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-50 dark:border-gray-700">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Update Status & Notify User</p>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => updateStatus(rental.id, 'pending', rental.user_id, rental.car_name)}
                        disabled={updating === rental.id || rental.status === 'pending'}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                      >
                        Pending
                      </button>
                      <button 
                        onClick={() => updateStatus(rental.id, 'approved', rental.user_id, rental.car_name)}
                        disabled={updating === rental.id || rental.status === 'approved'}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                      >
                        Ready
                      </button>
                      <button 
                        onClick={() => updateStatus(rental.id, 'out', rental.user_id, rental.car_name)}
                        disabled={updating === rental.id || rental.status === 'out'}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                      >
                        Out of Company
                      </button>
                      <button 
                        onClick={() => updateStatus(rental.id, 'completed', rental.user_id, rental.car_name)}
                        disabled={updating === rental.id || rental.status === 'completed'}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                      >
                        Car Is On Your Hand
                        {updating === rental.id && <Loader2 size={12} className="animate-spin" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
