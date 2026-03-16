import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, 
  Map as MapIcon, Calendar as CalendarIcon, 
  User as UserIcon, Train, Zap 
} from 'lucide-react';
import { useTrainStore } from '../../store/useTrainStore';

const STEPS = [
  {
    title: "¡Bienvenido a EasyTrain!",
    desc: "Tu compañero definitivo para explorar Europa sobre raíles. Diseñado para ofrecerte la mejor experiencia de viaje.",
    icon: <Train className="text-indigo-400" size={32} />,
    color: "from-indigo-500 to-purple-600"
  },
  {
    title: "Planificador Inteligente",
    desc: "Optimiza tu ruta Interrail usando nuestro motor de búsqueda avanzado. Encuentra las mejores conexiones y ahorra tiempo.",
    icon: <CalendarIcon className="text-amber-400" size={32} />,
    color: "from-amber-400 to-orange-500"
  },
  {
    title: "Mapa Interactivo 3D",
    desc: "Visualiza tus trayectos en tiempo real con nuestro mapa de última generación. Sigue cada tramo de tu aventura.",
    icon: <MapIcon className="text-emerald-400" size={32} />,
    color: "from-emerald-400 to-teal-500"
  },
  {
    title: "Tu Perfil de Viajero",
    desc: "Regístrate para desbloquear reservas directas, guardar tus favoritos y obtener medallas exclusivas por tus logros.",
    icon: <UserIcon className="text-pink-400" size={32} />,
    color: "from-pink-400 to-rose-500"
  },
  {
    title: "Experiencia Premium",
    desc: "¿Listo para empezar? Explora miles de rutas y vive la libertad ferroviaria con EasyTrain.",
    icon: <Zap className="text-indigo-400" size={32} />,
    color: "from-indigo-400 to-blue-600"
  }
];

export const OnboardingTour = () => {
  const { hasSeenOnboarding, completeOnboarding } = useTrainStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!hasSeenOnboarding) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [hasSeenOnboarding]);

  if (!show || hasSeenOnboarding) return null;

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleClose();
    }
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const handleClose = () => {
    setShow(false);
    completeOnboarding();
  };

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm glass-card overflow-hidden relative border-white/10"
      >
        {/* Header decoration */}
        <div className={`h-32 bg-gradient-to-br ${step.color} relative overflow-hidden flex items-center justify-center`}>
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)]" />
          </div>
          <motion.div 
            key={currentStep}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl"
          >
            {step.icon}
          </motion.div>
        </div>

        <div className="p-8 text-center">
          <motion.h2 
            key={`title-${currentStep}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-black text-white mb-3"
          >
            {step.title}
          </motion.h2>
          <motion.p 
            key={`desc-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-sm leading-relaxed mb-8 h-12"
          >
            {step.desc}
          </motion.p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div 
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-indigo-500' : 'w-2 bg-white/10'}`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <button 
                  onClick={prev}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              <button 
                onClick={next}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm text-white flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
              >
                {currentStep === STEPS.length - 1 ? 'Empezar' : 'Siguiente'}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white/60 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </motion.div>
    </div>
  );
};
