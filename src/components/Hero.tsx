import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, MapPin, Globe } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
}

const FEEDBACKS = [
  {
    name: 'John Fernand Bajador',
    role: 'CEO, GLOBAL AUTOMOTIVES',
    image: 'https://i.postimg.cc/wT902PQq/Fernan.jpg',
    quote: '"The gold standard for vehicle transport in Davao. Professional, timely, and secure."'
  },
  {
    name: 'Chaby Labasano',
    role: 'FREELANCE DESIGNER',
    image: 'https://i.postimg.cc/J0xPB55d/Chaby-Two.jpg',
    quote: '"Excellent service and a well-maintained fleet. Truly a game changer in car rentals."'
  },
  {
    name: 'Mico Regulada',
    role: 'CREATIVE DIRECTOR',
    image: 'https://i.postimg.cc/dVHpfwd4/Mico-Who.jpg',
    quote: '"Renting a car has never been this seamless and efficient. Highly recommended!"'
  },
  {
    name: 'Rovick Polinar',
    role: 'SOFTWARE ENGINEER',
    image: 'https://i.postimg.cc/qvbSF4nL/Rovick.jpg',
    quote: '"Outstanding customer support and transparent pricing. Will definitely use them again."'
  }
];

export default function Hero({ onGetStarted }: HeroProps) {
  const [currentFeedback, setCurrentFeedback] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeedback((prev) => (prev + 1) % FEEDBACKS.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="w-full px-6 md:px-12 lg:px-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh] pt-28">
      <div className="space-y-8">
        <motion.h1 
          className="text-6xl md:text-8xl font-display font-bold leading-[0.9] tracking-tight text-gray-900 dark:text-white"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Your Journey,<br />
          <span className="text-primary italic">Our</span> Logistics Excellence.
        </motion.h1>

        <motion.p 
          className="text-lg text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Experience the ultimate freedom of choice with Rent4Cars Davao. Professional vehicle transport, regional logistics, and premium automotive care for your Mindanao travels.
        </motion.p>

        <motion.div 
          className="flex flex-wrap gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button 
            onClick={onGetStarted}
            className="bg-primary text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-primary/30 hover:bg-primary-dark transition-all flex items-center gap-2 group"
          >
            Explore Fleet
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="flex gap-4">
             <div className="flex flex-col items-center justify-center border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl p-3 w-20 h-20 shadow-sm">
                <span className="text-xl font-bold text-gray-900 dark:text-white">12K+</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium">Clients</span>
             </div>
             <div className="flex flex-col items-center justify-center border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl p-3 w-20 h-20 shadow-sm">
                <span className="text-xl font-bold text-gray-900 dark:text-white">50+</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium">Hubs</span>
             </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 pt-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center text-primary">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Secure Transit</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">End-to-end insurance</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center text-primary">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Global Hubs</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Real-time GPS tracking</p>
            </div>
          </div>
        </div>
      </div>

      <motion.div 
        className="relative"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute -inset-4 bg-primary/5 dark:bg-primary/10 rounded-3xl -rotate-2 blur-2xl" />
        <img 
          src="https://i.postimg.cc/sXkj43CJ/Geely-Coolray.webp" 
          alt="Premium Fleet Car"
          className="relative rounded-3xl shadow-2xl border-4 border-white dark:border-gray-900 object-cover aspect-[4/3]"
        />
        <div className="absolute -bottom-6 -right-6 glass p-6 rounded-2xl shadow-xl max-w-xs overflow-hidden min-h-[140px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFeedback}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-sm italic font-display text-gray-900 dark:text-white mb-2">{FEEDBACKS[currentFeedback].quote}</p>
              <div className="flex items-center gap-2">
                <img 
                  src={FEEDBACKS[currentFeedback].image} 
                  alt={FEEDBACKS[currentFeedback].name} 
                  className="w-10 h-10 rounded-full object-cover shrink-0" 
                />
                <div>
                  <p className="text-xs font-bold dark:text-gray-100">{FEEDBACKS[currentFeedback].name}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">{FEEDBACKS[currentFeedback].role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
