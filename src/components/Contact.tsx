import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { motion } from 'motion/react';

export default function Contact() {
  return (
    <div className="max-w-6xl mx-auto px-12 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-12"
        >
          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-display font-bold leading-tight text-gray-900 dark:text-white">Contact Our<br />Logistics Experts</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed max-w-md">
              Have questions about cross-border permits or international fleet transport? 
              Our team is ready to assist you.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
               <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-gray-100 dark:border-gray-700">
                  <Mail size={20} />
               </div>
               <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Email Inquiries</p>
                  <p className="text-gray-500 dark:text-gray-400">support@davao.rent4cars.ph</p>
               </div>
            </div>
            <div className="flex gap-4">
               <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-gray-100 dark:border-gray-700">
                  <Phone size={20} />
               </div>
               <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Global Hotline</p>
                  <p className="text-gray-500 dark:text-gray-400">+63 (082) 297 8888</p>
               </div>
            </div>
            <div className="flex gap-4">
               <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-gray-100 dark:border-gray-700">
                  <MapPin size={20} />
               </div>
               <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Headquarters</p>
                  <p className="text-gray-500 dark:text-gray-400">JP Laurel Ave, Bajada, Davao City</p>
               </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass rounded-[2.5rem] p-10 shadow-2xl"
        >
          <h3 className="text-2xl font-display font-bold mb-8 dark:text-white">Send a Message</h3>
          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Full Name</label>
                 <input type="text" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Email Address</label>
                 <input type="email" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
               </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Inquiry Type</label>
              <select className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
                <option>Cross-Border Transport</option>
                <option>Customs & Clearance</option>
                <option>Service & Maintenance</option>
                <option>Fleet Partnership</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Your Message</label>
              <textarea rows={4} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"></textarea>
            </div>
            <button className="w-full py-5 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2">
              Deliver Message
              <Send size={18} />
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
