import { useState, useEffect, useMemo } from 'react';
import { MessagingService, Car } from '../services/dataService';
import { AnimatePresence, motion } from 'motion/react';
import CarCard from './CarCard';
import CarSpecModal from './CarSpecModal';
import BookingSystem from './BookingSystem';
import { Search, Filter, SlidersHorizontal, X } from 'lucide-react';

interface FleetProps {
  user: any;
  onInquire: (car: Car) => void;
  onRent: (car: Car) => void;
}

export default function Fleet({ user, onInquire, onRent }: FleetProps) {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedPowertrain, setSelectedPowertrain] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortOrder, setSortOrder] = useState('none');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    MessagingService.getFleet().then(data => {
      setCars(data);
      setLoading(false);
    });
  }, []);

  // Extract unique types and powertrains for filters
  const uniqueTypes = useMemo(() => ['All', ...Array.from(new Set(cars.map(c => c.type)))], [cars]);
  const uniquePowertrains = useMemo(() => ['All', ...Array.from(new Set(cars.map(c => c.powertrain)))], [cars]);
  const uniqueStatuses = useMemo(() => {
    const statuses = Array.from(new Set(cars.map(c => c.status))).filter(Boolean);
    return ['All', ...statuses.map(s => s.charAt(0).toUpperCase() + s.slice(1))];
  }, [cars]);

  const filteredAndSortedCars = useMemo(() => {
    let result = cars;

    // Filter by search query (name, type, or powertrain)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        car => 
          car.name.toLowerCase().includes(query) || 
          car.type.toLowerCase().includes(query) ||
          car.powertrain.toLowerCase().includes(query)
      );
    }

    // Filter by Type
    if (selectedType !== 'All') {
      result = result.filter(car => car.type === selectedType);
    }

    // Filter by Powertrain
    if (selectedPowertrain !== 'All') {
      result = result.filter(car => car.powertrain === selectedPowertrain);
    }
    
    // Filter by Status
    if (selectedStatus !== 'All') {
      result = result.filter(car => car.status && car.status.toLowerCase() === selectedStatus.toLowerCase());
    }

    // Sort by Price
    if (sortOrder === 'price-asc') {
      result = [...result].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortOrder === 'price-desc') {
      result = [...result].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    }

    return result;
  }, [cars, searchQuery, selectedType, selectedPowertrain, selectedStatus, sortOrder]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('All');
    setSelectedPowertrain('All');
    setSelectedStatus('All');
    setSortOrder('none');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12 space-y-4 max-w-2xl mx-auto">
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg w-2/3 mx-auto animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-lg w-3/4 mx-auto animate-pulse" />
        </div>
        
        <div className="max-w-xl mx-auto mb-10">
          <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-full w-full animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-[0_4px_20px_rgb(0,0,0,0.04)] h-full min-h-[400px] flex flex-col p-4 animate-pulse">
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl mb-4" />
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/3 mb-6" />
              
              <div className="grid grid-cols-4 gap-2 mb-6">
                 <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                 <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                 <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                 <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl" />
              </div>
              
              <div className="mt-auto flex gap-2">
                 <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl w-1/3" />
                 <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl flex-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-12 space-y-4 max-w-2xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white">Davao's Favorite Choice</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Reliable, fuel-efficient, and perfectly suited for Davao's roads. 
          Parsed directly from our secure XML inventory system.
        </p>
      </div>

      {/* Advanced Search & Filtering - Minimal & Professional look */}
      <div className="max-w-xl mx-auto mb-10 relative z-30">
        <div className="flex bg-white dark:bg-gray-900 rounded-full p-1 shadow-[0_4px_20px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-gray-100 dark:border-gray-800/60 transition-all items-center">
          
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search by model or brand..."
              className="w-full bg-transparent border-none py-2 pl-9 pr-8 text-gray-900 dark:text-white focus:ring-0 outline-none placeholder:text-gray-400 font-medium text-[13px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-100 dark:bg-gray-800 p-1 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
          
          <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-800 mx-1 hidden sm:block"></div>

          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`hidden sm:flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${
              showFilters || selectedType !== 'All' || selectedPowertrain !== 'All' || selectedStatus !== 'All' || sortOrder !== 'none'
              ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {(selectedType !== 'All' || selectedPowertrain !== 'All' || selectedStatus !== 'All' || sortOrder !== 'none') && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
            )}
          </button>
        </div>
        
        {/* Mobile Filter Button */}
        <div className="mt-4 sm:hidden flex justify-center">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-5 py-2 rounded-full text-[13px] font-medium transition-all ${
              showFilters || selectedType !== 'All' || selectedPowertrain !== 'All' || selectedStatus !== 'All' || sortOrder !== 'none'
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 shadow-sm'
              : 'bg-white/50 dark:bg-gray-900/50 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-100 dark:border-gray-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {(selectedType !== 'All' || selectedPowertrain !== 'All' || selectedStatus !== 'All' || sortOrder !== 'none') && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
            )}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0, y: -5 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -5 }}
              className="overflow-hidden absolute w-full top-full left-0 mt-2 z-20"
            >
              <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-3xl rounded-2xl p-4 sm:p-5 shadow-2xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Type Filter */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">Body Type</label>
                  <div className="relative">
                    <select 
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full appearance-none bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-800 rounded-xl py-2 pl-3 pr-8 text-[13px] text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-primary/50 font-medium cursor-pointer"
                    >
                      {uniqueTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Powertrain Filter */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">Powertrain</label>
                  <div className="relative">
                    <select 
                      value={selectedPowertrain}
                      onChange={(e) => setSelectedPowertrain(e.target.value)}
                      className="w-full appearance-none bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-800 rounded-xl py-2 pl-3 pr-8 text-[13px] text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-primary/50 font-medium cursor-pointer"
                    >
                      {uniquePowertrains.map(pt => (
                        <option key={pt} value={pt}>{pt}</option>
                      ))}
                    </select>
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">Status</label>
                  <div className="relative">
                    <select 
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full appearance-none bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-800 rounded-xl py-2 pl-3 pr-8 text-[13px] text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-primary/50 font-medium cursor-pointer"
                    >
                      {uniqueStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Sort Option */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">Sort By</label>
                  <div className="relative">
                    <select 
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full appearance-none bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-800 rounded-xl py-2 pl-3 pr-8 text-[13px] text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-primary/50 font-medium cursor-pointer"
                    >
                      <option value="none">Recommended</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                    </select>
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              
              <div className="mt-2 flex justify-end">
                <button 
                  onClick={resetFilters}
                  className="px-4 py-1 text-[12px] font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-800/80 backdrop-blur-md shadow-sm"
                >
                  Reset all filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Count */}
      <div className="mb-6 flex min-h-6 items-center justify-between px-2">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Showing {filteredAndSortedCars.length} {filteredAndSortedCars.length === 1 ? 'vehicle' : 'vehicles'}
        </p>
      </div>

      {filteredAndSortedCars.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedCars.map((car, index) => (
              <motion.div
                key={car.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <CarCard 
                  car={car}
                  index={index}
                  onInquire={onInquire}
                  onRent={onRent}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700"
        >
          <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No vehicles found</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            We couldn't find any cars matching your current filters. Try adjusting your search criteria.
          </p>
          <button 
            onClick={resetFilters}
            className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Clear Filters
          </button>
        </motion.div>
      )}
    </div>
  );
}
