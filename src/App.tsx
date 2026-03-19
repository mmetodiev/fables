/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  Volume2, 
  VolumeX,
  Sparkles,
  ArrowLeft,
  Search,
  X
} from 'lucide-react';
import fablesData from './data/fables.json';

// Types
interface FableBase {
  title: string;
  body: string;
  moral: string;
  body_child: string;
  moral_elaborated: string;
}

type Fable = FableBase & { id: string };

// `fables.json` does not include ids, so we generate stable ids from the array index.
const fables: Fable[] = (fablesData as FableBase[]).map((f, idx) => ({
  ...f,
  id: (f as unknown as { id?: string }).id ?? String(idx),
}));

export default function App() {
  const [view, setView] = useState<'list' | 'detail' | 'search'>('list');
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * fables.length));
  const [isReading, setIsReading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const MIN_SEARCH_CHARS = 3;

  // Refs for TTS state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const readingSessionRef = useRef<number>(0);

  const currentFable = fables[currentIndex];

  const trimmedSearchQuery = searchQuery.trim();
  const canSearch = trimmedSearchQuery.length >= MIN_SEARCH_CHARS;

  const filteredFables = canSearch
    ? fables.filter((f) => {
        const q = trimmedSearchQuery.toLowerCase();
        return f.title.toLowerCase().includes(q) || f.moral.toLowerCase().includes(q);
      })
    : [];

  const shuffleFable = () => {
    const nextIndex = Math.floor(Math.random() * fables.length);
    setCurrentIndex(nextIndex);
  };

  const stopReading = useCallback(() => {
    readingSessionRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load();
      audioRef.current = null;
    }
    setIsReading(false);
  }, []);

  const startReading = async () => {
    const sessionId = readingSessionRef.current + 1;
    readingSessionRef.current = sessionId;
    try {
      setIsReading(true);

      // Stop any current playback before creating a new stream.
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.load();
        audioRef.current = null;
      }

      const audio = new Audio(`/api/tts?text=${encodeURIComponent(currentFable.body_child)}`);
      audioRef.current = audio;
      audio.preload = "none";
      audio.onended = () => {
        if (readingSessionRef.current === sessionId) {
          setIsReading(false);
          audioRef.current = null;
        }
      };
      audio.onerror = () => {
        console.error("Audio playback error.");
        if (readingSessionRef.current === sessionId) {
          setIsReading(false);
          audioRef.current = null;
        }
      };
      await audio.play();

    } catch (err) {
      console.error("Failed to read fable:", err);
      if (readingSessionRef.current === sessionId) {
        setIsReading(false);
      }
    }
  };

  // --- Navigation ---
  const nextFable = () => {
    stopReading();
    setCurrentIndex((prev) => (prev + 1) % fables.length);
  };

  const prevFable = () => {
    stopReading();
    setCurrentIndex((prev) => (prev - 1 + fables.length) % fables.length);
  };

  const goToHome = () => {
    stopReading();
    setView('list');
    setSearchQuery("");
  };

  const selectFable = (index: number) => {
    setCurrentIndex(index);
    setView('detail');
  };

  const openSearch = () => {
    setView('search');
  };

  // Swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (view !== 'detail') return;
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) nextFable();
    if (isRightSwipe) prevFable();
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden">
      {/* Header */}
      <header className="p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={goToHome}>
          <div className="w-10 h-10 olive-accent rounded-full flex items-center justify-center">
            <BookOpen size={20} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">FableQuest</h1>
        </div>
        <div className="flex gap-2">
          {view === 'list' && (
            <button 
              onClick={openSearch}
              className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5 transition-colors"
            >
              <Search size={20} />
            </button>
          )}
          {view === 'detail' && (
            <button 
              onClick={goToHome}
              className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5 transition-colors"
            >
              <Home size={20} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 relative px-6 pb-24">
        <AnimatePresence mode="wait">
          {view === 'list' ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="h-full flex flex-col"
            >
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <span className="sans-ui text-[10px] uppercase tracking-[0.2em] opacity-50 font-bold mb-4">Random Fable Selection</span>
                <button
                  onClick={() => selectFable(currentIndex)}
                  className="cream-card p-10 text-center hover:scale-[1.02] transition-transform active:scale-95 group"
                >
                  <div className="w-16 h-16 olive-accent rounded-full flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform">
                    <Sparkles size={32} />
                  </div>
                  <h3 className="text-3xl font-bold mb-3">{currentFable.title}</h3>
                  <p className="text-lg opacity-60 italic mb-6">"{currentFable.moral}"</p>
                  <div className="inline-flex items-center gap-2 font-bold text-sm uppercase tracking-widest opacity-80 group-hover:translate-x-1 transition-transform">
                    Read Story <ChevronRight size={16} />
                  </div>
                </button>
                
                <button 
                  onClick={shuffleFable}
                  className="mt-12 flex items-center gap-2 text-sm font-semibold opacity-40 hover:opacity-100 transition-opacity uppercase tracking-widest"
                >
                  <Sparkles size={16} />
                  <span>Try Another Random Story</span>
                </button>
              </div>
            </motion.div>
          ) : view === 'search' ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              <div className="flex items-center gap-3 mb-6">
                <button 
                  onClick={goToHome}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
                >
                  <ArrowLeft size={24} />
                </button>
                <div className="flex-1 relative">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search fables..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-4 pr-10 rounded-full bg-white border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 sans-ui text-sm"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {canSearch && filteredFables.length > 0 ? (
                  <div className="grid gap-4">
                    {filteredFables.map((fable) => {
                      const originalIndex = fables.findIndex(f => f.id === fable.id);
                      return (
                        <button
                          key={fable.id}
                          onClick={() => selectFable(originalIndex)}
                          className="cream-card p-5 text-left hover:bg-black/[0.02] transition-colors"
                        >
                          <h3 className="text-lg font-semibold">{fable.title}</h3>
                          <p className="text-xs opacity-50 italic mt-1">{fable.moral}</p>
                        </button>
                      );
                    })}
                  </div>
                ) : canSearch ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-30">
                    <Search size={48} strokeWidth={1} />
                    <p className="mt-4 italic">No fables found for "{trimmedSearchQuery}"</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-30">
                    <Search size={48} strokeWidth={1} />
                    <p className="mt-4 italic">Type at least {MIN_SEARCH_CHARS} characters to search</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key={currentFable.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="h-full flex flex-col"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="flex-1 flex flex-col">
                <div className="mb-8">
                  <div className="flex items-center justify-between gap-3">
                    <span className="sans-ui text-[10px] uppercase tracking-widest opacity-50 font-bold">The Story</span>
                    <button
                      onClick={isReading ? stopReading : startReading}
                      className={`h-9 px-3 rounded-full flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                        isReading
                          ? 'bg-red-500 text-white'
                          : 'olive-accent'
                      }`}
                    >
                      {isReading ? (
                        <>
                          <VolumeX size={14} />
                          <span>Stop Reading</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={14} />
                          <span>Read Aloud</span>
                        </>
                      )}
                    </button>
                  </div>
                  <h2 className="text-4xl font-bold mt-2 leading-tight">{currentFable.title}</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mb-8">
                  <p className="text-2xl leading-relaxed italic opacity-80 mb-12">
                    {currentFable.body_child}
                  </p>
                  
                  <div className="cream-card p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 opacity-50 rounded-bl-full -mr-4 -mt-4" />
                    <span className="sans-ui text-[10px] uppercase tracking-widest opacity-50 font-bold">The Lesson</span>
                    <p className="text-xl mt-3 font-medium leading-relaxed">
                      {currentFable.moral_elaborated}
                    </p>
                  </div>
                </div>

                {/* Navigation Dots */}
                <div className="flex justify-center gap-2">
                  {fables.map((_, idx) => (
                    <div 
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? 'w-4 olive-accent' : 'bg-black/10'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Interaction Bar */}
              <div className="mt-8 flex items-center justify-between gap-4">
                <button 
                  onClick={prevFable}
                  className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5"
                >
                  <ChevronLeft size={24} />
                </button>

                <div className="flex-1" />

                <button 
                  onClick={nextFable}
                  className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              {/* Reading Status Overlay */}
              {isReading && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-28 left-0 right-0 px-6"
                >
                  <div className="bg-white/90 backdrop-blur-md border border-black/5 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600">
                        <Volume2 size={20} />
                      </div>
                      <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute inset-0 bg-emerald-400 rounded-full -z-10"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="sans-ui text-xs font-bold uppercase tracking-wider opacity-40">
                        Reading Aloud
                      </p>
                      <p className="text-sm italic line-clamp-1">
                        Listen to the story...
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Decorative Background Elements */}
      <div className="fixed top-[-10%] right-[-10%] w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-80 h-80 bg-orange-100/50 rounded-full blur-3xl -z-10" />
    </div>
  );
}
