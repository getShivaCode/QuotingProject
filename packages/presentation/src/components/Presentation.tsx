import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Slide1 from './slides/Slide1';
import Slide2 from './slides/Slide2';
import Slide3 from './slides/Slide3';
import Slide4 from './slides/Slide4';
import Slide5 from './slides/Slide5';
import Slide6 from './slides/Slide6';
import Slide7 from './slides/Slide7';
import Slide8 from './slides/Slide8';
import Slide10 from './slides/Slide10';
import { useSession } from '../context/SessionContext';
import '../styles/presentation.css';

const slides = [
  { id: 1, component: Slide1, title: 'Value Statement' },
  { id: 2, component: Slide2, title: 'The Challenge' },
  { id: 3, component: Slide3, title: 'Our Solution' },
  { id: 4, component: Slide4, title: 'Step 1: Account Selection' },
  { id: 5, component: Slide5, title: 'Step 2: Product Search' },
  { id: 6, component: Slide6, title: 'Step 3: Shopping Cart' },
  { id: 7, component: Slide7, title: 'Step 4: Request Quote' },
  { id: 8, component: Slide8, title: 'Try It Live' },
];

const hiddenSlides = [
  { id: 9, component: Slide10, title: 'How I Built This' },
];

const allSlides = [...slides, ...hiddenSlides];

export default function Presentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showNavConfirmation, setShowNavConfirmation] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<number | null>(null);
  const { sessionId } = useSession();

  const isSlide8 = currentSlide === 7; // Slide 8 is at index 7
  const hasActiveSession = !!sessionId && isSlide8;

  const handleNavigationConfirmed = useCallback((newSlide: number) => {
    setCurrentSlide(newSlide);
    setShowNavConfirmation(false);
    setPendingNavigation(null);
  }, []);

  const handleNext = useCallback(() => {
    const newSlide = Math.min(currentSlide + 1, slides.length - 1);
    if (hasActiveSession && newSlide !== currentSlide) {
      setPendingNavigation(newSlide);
      setShowNavConfirmation(true);
    } else if (newSlide !== currentSlide) {
      setCurrentSlide(newSlide);
    }
  }, [currentSlide, hasActiveSession]);

  const handlePrev = useCallback(() => {
    const newSlide = Math.max(currentSlide - 1, 0);
    if (hasActiveSession && newSlide !== currentSlide) {
      setPendingNavigation(newSlide);
      setShowNavConfirmation(true);
    } else if (newSlide !== currentSlide) {
      setCurrentSlide(newSlide);
    }
  }, [currentSlide, hasActiveSession]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowDown' && currentSlide < allSlides.length - 1) {
        if (currentSlide < slides.length) {
          const newSlide = slides.length;
          if (hasActiveSession) {
            setPendingNavigation(newSlide);
            setShowNavConfirmation(true);
          } else {
            setCurrentSlide(newSlide);
          }
        } else {
          setCurrentSlide(currentSlide + 1);
        }
      }
      if ((e.key === 'Escape' || e.key === 'ArrowUp') && currentSlide >= slides.length) {
        setCurrentSlide(slides.length - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, handleNext, handlePrev, hasActiveSession]);

  const CurrentSlide = allSlides[currentSlide].component;

  return (
    <div className={`presentation-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Header */}
      <div className="presentation-header">
        <div className="salesforce-logo-corner">
          <img src="https://a.sfdcstatic.com/shared/images/c360-nav/salesforce-with-type-logo.svg" alt="Salesforce" />
        </div>
        <div className="header-content">
          <h1 className="presentation-title">
            Intelligent Quoting
            <span className="header-divider">powered by</span>
            <img className="agentforce-logo-inline" src="https://content.partnerpage.io/eyJidWNrZXQiOiJwYXJ0bmVycGFnZS5wcm9kIiwia2V5IjoibWVkaWEvY29udGFjdF9pbWFnZXMvNWI4ZTAwYjMtNDY5YS00NTQ4LWI1MDgtNDZiZWQyOGRiY2ExL2RlYTVjMGM1LWVmN2QtNDJiNS04YTQwLTQ1ZjM2OGJlNDkxOC5wbmciLCJlZGl0cyI6eyJ0b0Zvcm1hdCI6IndlYnAiLCJyZXNpemUiOnsiZml0IjoiY29udGFpbiIsImJhY2tncm91bmQiOnsiciI6MjU1LCJnIjoyNTUsImIiOjI1NSwiYWxwaGEiOjB9fX19" alt="Agentforce" />
          </h1>
        </div>
        <motion.button
          className="theme-toggle"
          onClick={() => setIsDarkMode(!isDarkMode)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </motion.button>
      </div>

      {/* Main Slide Area */}
      <div className="slide-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="slide-wrapper"
          >
            <CurrentSlide />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Breadcrumbs Navigation - only show for visible slides */}
      {currentSlide < slides.length && (
        <div className="breadcrumbs">
          {slides.map((slide, index) => (
            <motion.div
              key={slide.id}
              className={`breadcrumb ${index === currentSlide ? 'active' : ''} ${index < currentSlide ? 'completed' : ''}`}
              onClick={() => {
                if (hasActiveSession && index !== currentSlide) {
                  setPendingNavigation(index);
                  setShowNavConfirmation(true);
                } else {
                  setCurrentSlide(index);
                }
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="breadcrumb-dot"></div>
              <span className="breadcrumb-label">{slide.title}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Navigation Controls */}
      <div className="navigation-controls">
        <motion.button
          onClick={handlePrev}
          disabled={currentSlide === 0}
          className="nav-button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft size={24} />
        </motion.button>

        <div className="slide-counter">
          {currentSlide < slides.length ? `${currentSlide + 1} / ${slides.length}` : ''}
        </div>

        <motion.button
          onClick={handleNext}
          disabled={currentSlide === slides.length - 1 || currentSlide >= slides.length}
          className="nav-button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronRight size={24} />
        </motion.button>
      </div>

      {/* Keyboard Hint */}
      <div className="keyboard-hint">
        Use ← → keys to navigate
      </div>

      {/* Navigation Confirmation Modal */}
      <AnimatePresence>
        {showNavConfirmation && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNavConfirmation(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Active Chat Session</h2>
              <p>You have an active chat session. Are you sure you want to leave this slide?</p>
              <div className="modal-buttons">
                <motion.button
                  className="modal-button cancel"
                  onClick={() => setShowNavConfirmation(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Stay
                </motion.button>
                <motion.button
                  className="modal-button confirm"
                  onClick={() => {
                    if (pendingNavigation !== null) {
                      handleNavigationConfirmed(pendingNavigation);
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Leave
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
