import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'How do I book a rental car?',
    answer: 'You can easily browse our fleet on the website, select your desired vehicle, choose the dates, and click "Rent Now". Follow the prompts to securely complete your booking.',
  },
  {
    question: 'What documents are required to rent a car?',
    answer: 'You will need a valid driver\'s license and a government-issued ID. For some premium vehicles, additional verification might be required.',
  },
  {
    question: 'Can I cancel or modify my reservation?',
    answer: 'Yes, you can cancel or modify your reservation up to 24 hours before your scheduled pick-up time without any penalty. Modifying dates is subject to vehicle availability.',
  },
  {
    question: 'Do you offer delivery to my location?',
    answer: 'Yes, we offer vehicle delivery within Davao City and surrounding areas. This option can be selected during the fulfillment step of your booking.',
  },
  {
    question: 'What is your fuel policy?',
    answer: 'We provide the car with a full tank of fuel. We kindly ask that you return the vehicle with a full tank to avoid any refueling charges.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-left">
      <div className="text-center mb-12 space-y-4">
        <h2 className="text-4xl font-display font-bold text-gray-900 dark:text-white leading-tight">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div 
              key={index} 
              className={`rounded-2xl border ${isOpen ? 'border-primary/30 bg-primary/5 dark:bg-primary/5' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'} transition-colors overflow-hidden`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
              >
                <span className="font-bold text-gray-900 dark:text-white pr-8">{faq.question}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${isOpen ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>
              
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="px-6 pb-5 pt-0 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
