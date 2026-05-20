import { useState, useEffect } from 'react';
import { MessagingService, ServiceHub } from '../services/dataService';
import { motion } from 'motion/react';
import { MapPin, Phone, Clock, Navigation } from 'lucide-react';

export default function Locations() {
  const [hubs, setHubs] = useState<ServiceHub[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHub, setSelectedHub] = useState<ServiceHub | null>(null);

  useEffect(() => {
    MessagingService.getLocations().then(data => {
      setHubs(data);
      if (data.length > 0) setSelectedHub(data[0]);
      setLoading(false);
    });
  }, []);

  const handleGetDirections = (hub: ServiceHub) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hub.lat},${hub.lng}`;
    window.open(url, '_blank');
  };

  if (loading) {
     return <div className="p-20 text-center">Loading Locations...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-12 py-12">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-4xl md:text-5xl font-display font-bold">Regional Service Hubs</h2>
        <p className="text-gray-500 max-w-2xl mx-auto">
          We maintain strategic service points across the region to ensure your vehicle 
          receives premium care regardless of your destination in Mindanao.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-6">
          {hubs.map((hub, index) => (
            <motion.div
              key={hub.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              onClick={() => setSelectedHub(hub)}
              className={`group relative bg-white rounded-3xl p-6 border transition-all cursor-pointer ${
                selectedHub?.id === hub.id 
                ? 'border-primary shadow-xl shadow-primary/5' 
                : 'border-gray-100 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${
                    selectedHub?.id === hub.id ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-primary border-primary/10'
                  }`}>
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-gray-900">{hub.city}</h3>
                    <p className="text-primary font-bold text-xs uppercase tracking-wider">{hub.type}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-gray-900 text-white rounded-full">
                  {hub.id}
                </span>
              </div>

              <div className="mt-4 space-y-4">
                <p className="text-gray-500 text-sm leading-relaxed">
                  {hub.address}
                </p>

                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} className="text-gray-400" />
                    +63 (982) 297 8888
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} className="text-gray-400" />
                    08:00 - 20:00
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGetDirections(hub);
                    }}
                    className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-primary transition-all flex items-center justify-center gap-2 group"
                  >
                    <Navigation size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    Get Directions
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="lg:sticky lg:top-32">
          <div className="glass rounded-[2.5rem] p-4 shadow-2xl overflow-hidden min-h-[500px] h-[600px] relative border-4 border-white bg-white">
            {selectedHub && (
              <iframe
                title="Google Maps Location"
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: '2rem' }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${selectedHub.lat},${selectedHub.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              ></iframe>
            )}
            <div className="absolute bottom-10 right-10 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={selectedHub?.id}
                className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/20 max-w-[200px]"
              >
                <p className="text-[10px] font-bold uppercase text-primary mb-1">Selected Location</p>
                <p className="text-sm font-bold truncate text-gray-900">{selectedHub?.city}</p>
                <p className="text-[10px] text-gray-500 line-clamp-1">{selectedHub?.address}</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
