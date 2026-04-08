import React, { useState } from 'react';
import { Sparkles, FileText, ShoppingCart, Trash2, Plus, Store, TrendingUp, DollarSign, Package } from 'lucide-react';
import { motion } from 'motion/react';

interface MobileNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

interface NavSection {
  id: string;
  label: string;
  icon: typeof Sparkles;
}

export function MobileNavigation({ activeSection, onSectionChange }: MobileNavigationProps) {
  const [dragStart, setDragStart] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const sections: NavSection[] = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'my-requests', label: 'My Requests', icon: FileText },
    { id: 'buy-reviews', label: 'Buy Reviews', icon: ShoppingCart },
    { id: 'remove-reviews', label: 'Remove Reviews', icon: Trash2 },
    { id: 'topup', label: 'Top Up', icon: Plus },
    { id: 'marketplace', label: 'Marketplace', icon: Store },
    { id: 'withdrawals', label: 'Withdrawals', icon: DollarSign },
    { id: 'upgrade', label: 'Business Upgrade', icon: TrendingUp },
    { id: 'store', label: 'EDGE Store', icon: Package },
  ];

  const handleDragEnd = (_event: any, info: any) => {
    const swipeThreshold = 50;
    const { offset } = info;

    if (offset.x < -swipeThreshold && currentIndex < sections.length - 1) {
      // Swipe left - next section
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      onSectionChange(sections[nextIndex].id);
    } else if (offset.x > swipeThreshold && currentIndex > 0) {
      // Swipe right - previous section
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      onSectionChange(sections[prevIndex].id);
    }
  };

  // Update current index when activeSection changes externally
  React.useEffect(() => {
    const index = sections.findIndex(s => s.id === activeSection);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [activeSection]);

  return (
    <div className="md:hidden">
      {/* Swipeable Navigation Container */}
      <div className="relative overflow-hidden py-4">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          className="flex gap-3 px-4"
          animate={{ x: -currentIndex * 140 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {sections.map((section, index) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            const isCurrent = currentIndex === index;

            return (
              <button
                key={section.id}
                onClick={() => {
                  setCurrentIndex(index);
                  onSectionChange(section.id);
                }}
                className={`flex-shrink-0 w-32 flex flex-col items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] neon-glow'
                    : 'bg-white/5 hover:bg-white/10'
                } ${isCurrent ? 'scale-105' : 'scale-95 opacity-70'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium text-center leading-tight">{section.label}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-4">
          {sections.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                onSectionChange(sections[index].id);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                currentIndex === index
                  ? 'bg-[#0ea5e9] w-6'
                  : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Swipe Hint */}
        {currentIndex === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center mt-2"
          >
            <p className="text-xs text-muted-foreground">← Swipe to navigate →</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
