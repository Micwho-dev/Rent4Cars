import { motion } from 'motion/react';
import { Search, CalendarCheck, MapPin, Key } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Choose a Vehicle',
    description: 'Browse our diverse fleet of well-maintained cars and find the perfect match for your needs.',
  },
  {
    icon: CalendarCheck,
    title: 'Book & Confirm',
    description: 'Select your preferred dates and finalize your reservation with our secure online system.',
  },
  {
    icon: MapPin,
    title: 'Select Location',
    description: 'Choose to pick up your vehicle from our hub or opt for our convenient delivery service.',
  },
  {
    icon: Key,
    title: 'Hit the Road',
    description: 'Receive your keys and enjoy a smooth, safe, and comfortable journey.',
  },
];

export default function Process() {
  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-12">
      <div className="text-center mb-16 space-y-4 max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white leading-tight">
          Simple & Transparent Process
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          We've streamlined our rental process to get you on the road faster, with zero hidden fees and full clarity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
        {/* Connecting line for desktop */}
        <div className="hidden lg:block absolute top-[45px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 z-0" />

        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="relative z-10 flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/20 dark:shadow-none flex items-center justify-center mb-6 relative group transition-transform hover:-translate-y-1">
                <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <Icon size={32} className="text-gray-900 dark:text-white group-hover:text-primary transition-colors" />
                
                {/* Step number badge */}
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold ring-4 ring-white dark:ring-gray-950">
                  {index + 1}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[250px]">
                {step.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
