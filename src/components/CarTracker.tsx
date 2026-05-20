import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, Signal, Battery, Car, X, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CarTrackerProps {
  rental: any;
  onClose: () => void;
}

export default function CarTracker({ rental, onClose }: CarTrackerProps) {
  const [loading, setLoading] = useState(true);
  const [vehicleStats, setVehicleStats] = useState({
    speed: 0,
    battery: 100,
    signal: 'Strong'
  });

  useEffect(() => {
    // Simulate connection delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading) return;

    // Simulate vehicle data updates
    const interval = setInterval(() => {
      setVehicleStats(prev => ({
        ...prev,
        speed: Math.floor(Math.random() * 20) + 40, // 40-60 km/h
        battery: Math.max(0, prev.battery - Math.random() * 0.1),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [loading]);

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0A0F1C] border border-gray-800 rounded-[2.5rem] w-full max-w-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col h-[70vh] max-h-[800px]"
      >
        <div className="p-6 pb-4 flex justify-between items-center border-b border-gray-800/60 bg-[#0A0F1C]/80 backdrop-blur-md absolute top-0 w-full z-20">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <Navigation className="text-blue-400 w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold">{rental.car_name || 'Vehicle'} Tracking</h2>
              <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                LIVE GPS LINK ENCRYPTED
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Map / Radar Area */}
        <div className="flex-1 relative bg-[#05080f] overflow-hidden flex items-center justify-center pt-20 pb-24">
          {/* Grid Background */}
          <div className="absolute inset-0 select-none overflow-hidden" 
            style={{ 
              backgroundImage: 'linear-gradient(to right, #111827 1px, transparent 1px), linear-gradient(to bottom, #111827 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              opacity: 0.5
            }}
          />

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center z-10"
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                  <MapPin className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 w-6 h-6 animate-pulse" />
                </div>
                <p className="text-blue-400 font-medium font-mono text-sm tracking-widest uppercase">Establishing connection</p>
                <p className="text-gray-500 text-xs mt-2">Connecting to vehicle telematics cluster...</p>
              </motion.div>
            ) : (
              <motion.div 
                key="tracking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative w-full h-full flex flex-col items-center justify-center z-10"
              >
                {/* Simulated Map Route / Radar */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                  {/* Radar Circles */}
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 rounded-full border border-blue-500/20"
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 4, repeat: Infinity, delay: i * 1.3, ease: "linear" }}
                    />
                  ))}
                  
                  {/* Central Pin */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="relative">
                      <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-md animate-pulse" />
                      <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.8)]">
                         <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                      </div>
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute top-10 right-10 flex items-center gap-2 bg-gray-900/80 backdrop-blur border border-gray-800 rounded-full px-3 py-1.5 text-xs font-mono text-gray-300">
                     <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> GPS LOCK
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats Bottom Bar */}
        <AnimatePresence>
          {!loading && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-0 w-full p-6 border-t border-gray-800 bg-[#0A0F1C]/90 backdrop-blur-xl z-20"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800/80 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                    <Navigation className="w-3.5 h-3.5" /> Speed
                  </div>
                  <div className="text-xl font-mono text-white flex items-baseline gap-1">
                    {vehicleStats.speed} <span className="text-xs text-gray-500">km/h</span>
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800/80 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                    <Battery className="w-3.5 h-3.5" /> {rental.powertrain === 'Electric' ? 'Battery' : 'Fuel'}
                  </div>
                  <div className="w-full flex items-center gap-3">
                    <div className="h-2 flex-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${vehicleStats.battery}%` }} />
                    </div>
                    <span className="text-sm font-mono text-white">{Math.round(vehicleStats.battery)}%</span>
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800/80 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                    <Signal className="w-3.5 h-3.5" /> Signal
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <div className="flex items-end gap-0.5 h-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`w-1 bg-blue-500 rounded-t-sm`} style={{ height: `${i * 25}%` }} />
                      ))}
                    </div>
                     LTG
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800/80 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Status
                  </div>
                  <div className="text-sm font-bold text-green-400 capitalize">
                    {rental.status === 'out' || rental.status === 'completed' ? 'In Transit' : 'Parked / Off'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
