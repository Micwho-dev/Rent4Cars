import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Local Business Owner',
    image: 'https://i.pravatar.cc/150?u=sarah',
    content: 'Rent4Cars provided excellent service when I needed a reliable SUV for a week. The booking process was seamless and the car was in pristine condition.',
    rating: 5,
  },
  {
    name: 'David Chen',
    role: 'Tourist',
    image: 'https://i.pravatar.cc/150?u=david',
    content: 'I was very impressed with their logistics portal and how easy it was to communicate. Pick-up at the Davao hub was completely hassle-free.',
    rating: 5,
  },
  {
    name: 'Maria Santos',
    role: 'Corporate Client',
    image: 'https://i.pravatar.cc/150?u=maria',
    content: 'Our go-to rental service for company delegates visiting the region. Always professional, punctual, and offering a premium fleet.',
    rating: 4,
  },
];

export default function Testimonials() {
  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-12">
      <div className="text-center mb-16 space-y-4 max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white leading-tight">
          Trusted by Our Clients
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          Don't just take our word for it. Read what our satisfied customers have to say about their experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/20 dark:shadow-none relative"
          >
            <Quote className="absolute top-8 right-8 w-10 h-10 text-gray-100 dark:text-gray-800 rotate-180" />
            
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < testimonial.rating ? 'fill-primary text-primary' : 'fill-gray-200 text-gray-200 dark:fill-gray-800 dark:text-gray-800'}
                />
              ))}
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-8 relative z-10 italic">
              "{testimonial.content}"
            </p>
            
            <div className="flex items-center gap-4 mt-auto">
              <img
                src={testimonial.image}
                alt={testimonial.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 dark:border-gray-800"
              />
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">{testimonial.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{testimonial.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
