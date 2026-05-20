import { motion } from 'motion/react';
import { Fuel, Car as CarIcon, Gauge, Info, ArrowRight } from 'lucide-react';
import { Car } from '../services/dataService';

interface CarCardProps {
  car: Car;
  index: number;
  onInquire: (car: Car) => void;
  onRent: (car: Car) => void;
}

export default function CarCard({ car, index, onInquire, onRent }: CarCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group glass p-4 rounded-3xl hover:shadow-2xl hover:shadow-primary/5 transition-all border border-gray-100 flex flex-col"
    >
      <div className="relative overflow-hidden rounded-2xl aspect-[16/10] mb-6">
        <img 
          src={car.image} 
          alt={car.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] text-gray-900 dark:text-gray-100 font-bold uppercase tracking-tight shadow-sm">
            {car.type}
          </span>
          <span className="bg-primary text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight shadow-sm">
            {car.status}
          </span>
        </div>
      </div>

      <div className="space-y-4 px-2 pb-2 flex-1 flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100">{car.name}</h3>
            <p className="text-[10px] text-gray-400 font-medium mt-1 line-clamp-1">{car.features}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase font-bold">Starting at</p>
            <p className="text-2xl font-display font-bold text-primary">₱{Number(car.price).toLocaleString()}<span className="text-xs text-gray-400 font-sans">/day</span></p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 py-4 border-y border-gray-50 dark:border-gray-800">
          <div className="flex flex-col items-center gap-1 text-center">
            <Fuel size={14} className="text-gray-400" />
            <span className="text-[9px] font-bold text-gray-900 dark:text-gray-300 uppercase truncate w-full">{car.powertrain}</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <CarIcon size={14} className="text-gray-400" />
            <span className="text-[9px] font-bold text-gray-900 dark:text-gray-300 uppercase truncate w-full">{car.type}</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <Gauge size={14} className="text-gray-400" />
            <span className="text-[9px] font-bold text-gray-900 dark:text-gray-300 uppercase truncate w-full">Unlimited</span>
          </div>
        </div>

        <div className="flex gap-2 mt-auto pt-2">
          <button 
            onClick={() => onInquire(car)}
            className="flex-1 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
          >
            <Info size={14} />
            Inquire
          </button>
          <button 
            onClick={() => onRent(car)}
            className="flex-[1.5] py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2 group/btn"
          >
            Rent Now
            <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
