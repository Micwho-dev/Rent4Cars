import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Gauge, Zap, Info, Heart } from 'lucide-react';
import { Car, WishlistService } from '../services/dataService';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface CarSpecModalProps {
  car: Car;
  user?: any;
  onClose: () => void;
  onRent: () => void;
}

export default function CarSpecModal({ car, user, onClose, onRent }: CarSpecModalProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (user) {
      checkWishlistStatus();
    }
  }, [user, car.id]);

  const checkWishlistStatus = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/wishlist/check?userId=${user.id}&carId=${car.id}`);
      if (!response.ok) throw new Error("Failed to check wishlist status via local server");
      const { exists } = await response.json();
      setIsWishlisted(exists);
    } catch (err: any) {
      console.error('Wishlist check error (local proxy):', err);
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      alert("Please log in to save vehicles to your wishlist.");
      return;
    }

    setIsToggling(true);
    const prevStatus = isWishlisted;
    setIsWishlisted(!prevStatus); // Optimistic UI

    try {
      // 1. Database persistence via Local Server Proxy
      try {
        const method = prevStatus ? 'DELETE' : 'POST';
        const response = await fetch('/api/wishlist', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, carId: car.id })
        });
        
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `Proxy ${method} failed`);
        }
      } catch (dbErr: any) {
        console.error("Local Proxy Operation Error:", dbErr);
        
        if (dbErr.message?.includes('violates row-level security policy')) {
           throw new Error("SECURITY_RLS: Your Supabase RLS is blocking the write. Run 'ALTER TABLE wishlists DISABLE ROW LEVEL SECURITY;' in your Supabase SQL Editor.");
        }
        
        throw dbErr;
      }
      
      // 2. Log Activity (Local server already handles logs)
      try {
        await WishlistService.logActivity(user.id, car.id, car.name, prevStatus ? 'removed' : 'added');
      } catch (logErr: any) {
        console.warn("Log activity failed, but database update succeeded.");
      }

    } catch (err: any) {
      console.error('Wishlist toggle error:', err);
      setIsWishlisted(prevStatus); // Revert on error
      
      let errorMsg = "Failed to update wishlist. Please try again.";
      if (err.message && err.message.includes('SECURITY_RLS')) {
         errorMsg = "Security Error: Your database policy (RLS) is blocking this write.\n\nTo fix this, run this in your Supabase SQL Editor:\nALTER TABLE wishlists DISABLE ROW LEVEL SECURITY;";
      }
      
      alert(errorMsg);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
        className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl relative z-10"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors z-[30]"
        >
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative h-64 md:h-full group">
            <img 
              src={car.image} 
              alt={car.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent" />
            
            {/* Floating Wishlist Heart */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleWishlist}
              disabled={isToggling}
              className="absolute top-6 left-6 p-3 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg z-20 text-gray-400"
            >
              <motion.div
                animate={{ 
                  scale: isWishlisted ? [1, 1.4, 1] : 1,
                  color: isWishlisted ? "#dc2626" : "#9ca3af" // primary crimson red
                }}
              >
                <Heart 
                  size={24} 
                  fill={isWishlisted ? "currentColor" : "none"} 
                  strokeWidth={2}
                />
              </motion.div>
            </motion.button>

            <div className="absolute bottom-6 left-6 text-white">
              <span className="bg-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 inline-block">
                {car.type}
              </span>
              <h2 className="text-3xl font-display font-bold">{car.name}</h2>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Info size={14} className="text-primary" />
                Technical Specifications
              </h3>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">Engine & Performance</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{car.specifications?.engine || 'Standard high-performance engine'}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">Safety Systems</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{car.specifications?.safety || 'Advanced SRS & ABS protection'}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                    <Gauge size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">Fuel Efficiency</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{car.specifications?.fuelEconomy || 'Economical range for Davao transit'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-xs text-gray-400 text-gray-500 uppercase font-bold tracking-widest mb-1">Rental Cost</p>
                  <p className="text-3xl font-display font-bold text-gray-900 dark:text-white">₱{Number(car.price).toLocaleString()}<span className="text-sm text-gray-400 dark:text-gray-500 font-sans">/day</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-green-500 font-bold uppercase mb-1">In Stock</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Premium Logistics Ready</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={onRent}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all transform hover:-translate-y-1 active:scale-95"
                >
                  Rent This Vehicle
                </button>
                
                <button 
                  onClick={toggleWishlist}
                  disabled={isToggling}
                  className={`w-full py-4 rounded-2xl font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                    isWishlisted 
                    ? 'border-primary text-primary bg-primary/5 dark:bg-primary/10' 
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
                  {isWishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
