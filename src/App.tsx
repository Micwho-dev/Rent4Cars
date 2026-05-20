/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Fleet from './components/Fleet';
import Locations from './components/Locations';
import Process from './components/Process';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import Chat from './components/Chat';
import Auth from './components/Auth';
import UserProfile from './components/UserProfile';
import FloatingChat from './components/FloatingChat';
import CarSpecModal from './components/CarSpecModal';
import BookingSystem from './components/BookingSystem';
import { supabase } from './lib/supabase';
import { Car, Notification, NotificationService } from './services/dataService';
import NotificationToast from './components/NotificationToast';

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [activeMode, setActiveMode] = useState<'inquire' | 'rent' | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationsRef = useRef<Notification[]>([]);
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      
      if (event === 'SIGNED_IN' && newUser) {
        NotificationService.handleUserLogin(newUser);
      }

      setUser(newUser);
      if (!session) {
        setNotifications([]);
        notificationsRef.current = [];
      }
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        // Only trigger if we don't have a user yet to avoid double notification on app mount if already logged in?
        // Actually onAuthStateChange SIGNE_IN usually doesn't trigger on initial mount if session exists?
        // Let's be safe and check if it's a fresh mount with session.
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Polling for notifications
  useEffect(() => {
    if (!user || isLoggingOut) {
      setNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const data = await NotificationService.getLatest(user.id);
        // Deduplicate notifications to stop message accumulation, specially from previous loop bugs
        const uniqueData = data.filter((v, i, a) => a.findIndex(t => (
          t.id === v.id || 
          (t.title === 'Welcome to Rent4Cars!' && v.title === 'Welcome to Rent4Cars!') ||
          (t.title === 'Welcome Back' && v.title === 'Welcome Back')
        )) === i);

        // Check if there's a new one to show as toast
        if (uniqueData.length > 0 && notificationsRef.current.length > 0) {
          const lastOld = notificationsRef.current[0];
          const lastNew = uniqueData[0];
          if (lastNew.id !== lastOld.id && !lastNew.read) {
            setActiveToast(lastNew);
          }
        }
        setNotifications(uniqueData);
        notificationsRef.current = uniqueData;
      } catch (err) {
        console.error("Notif fetch error", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [user?.id]); // Use primitive ID for stability

  const handleLoginBypass = (mockUserData: any) => {
    setUser(mockUserData);
    setShowAuth(false);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    
    try {
      // Clear local state first for immediate UI response
      setUser(null);
      setNotifications([]);
      notificationsRef.current = [];
      setShowProfile(false);
      setActiveToast(null);
      
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();

      // Attempt clean sign out
      await supabase.auth.signOut();
      
      console.log('Logout successful, state cleared.');
      
      // Final reload to ensure all listeners stop
      window.location.replace('/');
    } catch (err) {
      console.error('Logout error:', err);
      window.location.replace('/');
    }
  };

  const handleBookingSuccess = async (car: Car) => {
    // Notify the user via Kafka channel
    setActiveToast({
      id: `TOAST-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'rental',
      priority: 'high',
      title: 'Booking Confirmed',
      message_body: `Your reservation for the ${car.name} has been logged in the secure XML audit trail.`,
      read: false
    });
    
    // Also produce to persistent XML log
    await NotificationService.produce({
      type: 'rental',
      priority: 'high',
      title: 'Booking Confirmed',
      message_body: `Your reservation for the ${car.name} has been logged in the secure XML audit trail.`,
      read: false,
      userId: user.id
    });
  };

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInquire = (car: Car) => {
    setSelectedCar(car);
    setActiveMode('inquire');
  };

  const handleRent = (car: Car) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setSelectedCar(car);
    setActiveMode('rent');
  };

  return (
    <div className="min-h-screen morph-bg overflow-x-hidden selection:bg-primary selection:text-white">
      {/* Morphing Background elements */}
      <motion.div 
        animate={{ 
          x: [0, 100, 0], 
          y: [0, -50, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="morph-blob top-[-100px] left-[-100px]"
      />
      <motion.div 
        animate={{ 
          x: [0, -100, 0], 
          y: [0, 50, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="morph-blob bottom-[-100px] right-[-100px] opacity-40"
      />

      <Navbar 
        activeSection="" 
        setActiveSection={scrollTo} 
        user={user} 
        setUser={setUser}
        onAuthClick={() => setShowAuth(true)}
        onLogout={handleLogout}
        onProfileClick={() => setShowProfile(true)}
        notifications={notifications}
      />

      <main className="relative z-10 translate-y-0">
        <section id="home">
          <Hero onGetStarted={() => scrollTo('cars')} />
        </section>

        <motion.section 
          id="cars"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          className="py-24 scroll-mt-20"
        >
          <Fleet 
            user={user} 
            onInquire={handleInquire}
            onRent={handleRent}
          />
        </motion.section>

        <motion.section 
          id="process"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          className="py-12 bg-gray-50/30 dark:bg-gray-900/10 scroll-mt-20"
        >
          <Process />
        </motion.section>

        <motion.section 
          id="locations"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          className="py-24 scroll-mt-20"
        >
          <Locations />
        </motion.section>

        <motion.section 
          id="testimonials"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          className="py-12 bg-gray-50/50 dark:bg-gray-900/5 scroll-mt-20"
        >
          <Testimonials />
        </motion.section>

        <motion.section 
          id="service"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          className="py-24 scroll-mt-20"
        >
          <div className="text-center mb-16 space-y-4 max-w-3xl mx-auto px-6">
            <h2 className="text-5xl md:text-6xl font-display font-bold text-gray-900 dark:text-white leading-tight">Logistics Support Portal</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
              Connect directly with our Davao-based expert mechanics and logistics coordinators through our enterprise-grade messaging gateway. 
              Built for precision, reliability, and regional excellence.
            </p>


          </div>
          <Chat user={user} openAuth={() => setShowAuth(true)} />
        </motion.section>

        <motion.section 
          id="faq"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          className="scroll-mt-20"
        >
          <FAQ />
        </motion.section>

        <motion.section 
          id="contact"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          className="py-24 bg-gray-50/50 dark:bg-gray-900/20 scroll-mt-20"
        >
          <Contact />
        </motion.section>
      </main>

      <footer className="relative bg-gray-900 text-white py-16 px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => scrollTo('home')}>
              <img 
                src="https://i.postimg.cc/m2R4f9Fv/Rent4Cars.png" 
                alt="Rent4Cars Logo" 
                className="h-8 w-auto object-contain"
              />
              <span className="text-2xl font-display font-bold">Rent4Cars<span className="text-primary">.</span></span>
            </div>
            <p className="text-gray-400 max-w-sm">
              Premium regional vehicle logistics and professional automotive service hub based in Davao City. 
              Efficiency, safety, and excellence in motion.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400">
              <li><button onClick={() => scrollTo('home')} className="hover:text-primary transition-colors cursor-pointer">Home</button></li>
              <li><button onClick={() => scrollTo('process')} className="hover:text-primary transition-colors cursor-pointer">How it Works</button></li>
              <li><button onClick={() => scrollTo('cars')} className="hover:text-primary transition-colors cursor-pointer">Our Fleet</button></li>
              <li><button onClick={() => scrollTo('testimonials')} className="hover:text-primary transition-colors cursor-pointer">Testimonials</button></li>
              <li><button onClick={() => scrollTo('faq')} className="hover:text-primary transition-colors cursor-pointer">FAQ</button></li>
              <li><button onClick={() => scrollTo('service')} className="hover:text-primary transition-colors cursor-pointer">Support</button></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Connect</h3>
            <ul className="space-y-2 text-gray-400">
              <li className="hover:text-primary transition-colors cursor-pointer">Twitter</li>
              <li className="hover:text-primary transition-colors cursor-pointer">LinkedIn</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Instagram</li>
            </ul>
          </div>
        </div>
      </footer>

      <FloatingChat user={user} />
      
      <NotificationToast 
        notification={activeToast} 
        onClose={() => setActiveToast(null)} 
      />

      <AnimatePresence>
        {showProfile && user && (
          <UserProfile 
            user={user} 
            onClose={() => setShowProfile(false)} 
            onUpdate={(updatedUser) => {
                setUser(updatedUser);
            }} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeMode === 'inquire' && selectedCar && (
          <CarSpecModal 
            car={selectedCar} 
            user={user}
            onClose={() => {
              setSelectedCar(null);
              setActiveMode(null);
            }} 
            onRent={() => setActiveMode('rent')}
          />
        )}
        
        {activeMode === 'rent' && selectedCar && (
          <BookingSystem 
            car={selectedCar} 
            user={user}
            onClose={() => {
              setSelectedCar(null);
              setActiveMode(null);
            }} 
            onSuccess={handleBookingSuccess}
          />
        )}
      </AnimatePresence>

      {showAuth && <Auth onClose={() => setShowAuth(false)} onBypass={handleLoginBypass} />}
    </div>
  );
}

