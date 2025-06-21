import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {

  Users,
  Zap,

  BarChart3,

} from "lucide-react";


export default function ScrollSections() {
    const [currentSection, setCurrentSection] = useState(0)
    const [isScrolling, setIsScrolling] = useState(false)
    const [isFullyInView, setIsFullyInView] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
  
    const sections = [
      {
        id: 0,
        bg: "#1a1a1a",
        textColor: "text-white",
        title: "Amplify Your Reach",
        subtitle: "Effortlessly",
        description:
          "Your content deserves to be seen everywhere. Our intelligent sync ensures your voice reaches both Twitter and Farcaster audiences simultaneously.",
        icon: <Zap className="w-16 h-16" />,
      },
      {
        id: 1,
        bg: "#2563eb",
        textColor: "text-white",
        title: "Build Communities",
        subtitle: "Across Platforms",
        description:
          "Connect with diverse audiences on both platforms. Grow your following organically while maintaining authentic engagement across all channels.",
        icon: <Users className="w-16 h-16" />,
      },
      {
        id: 2,
        bg: "#059669",
        textColor: "text-white",
        title: "Track Your Growth",
        subtitle: "In Real-Time",
        description:
          "Monitor your cross-platform performance with detailed analytics. See how your content performs across Twitter and Farcaster with comprehensive insights.",
        icon: <BarChart3 className="w-16 h-16" />,
      },
    ]
  
    const currentSectionData = sections[currentSection]
  
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          // Only enable scroll hijacking when component is fully visible (threshold: 1.0)
          setIsFullyInView(entry.intersectionRatio >= 1.0)
        },
        { threshold: [0.5, 1.0] },
      )
  
      if (containerRef.current) {
        observer.observe(containerRef.current)
      }
  
      return () => observer.disconnect()
    }, [])
  
    useEffect(() => {
      if (!isFullyInView) return
  
      const handleWheel = (e: WheelEvent) => {
        // If we're on the first section and scrolling up, allow normal scroll to hero
        if (currentSection === 0 && e.deltaY < 0) {
          setIsFullyInView(false) // This will disable scroll hijacking
          return // Allow normal scroll behavior
        }
        e.preventDefault()
  
        if (isScrolling) return
  
        const newSection = currentSection + Math.sign(e.deltaY)
  
        if (newSection >= 0 && newSection < sections.length) {
          setIsScrolling(true)
          setCurrentSection(newSection)
          setTimeout(() => setIsScrolling(false), 1000)
        }
      }
  
      const handleKeyDown = (e: KeyboardEvent) => {
        if (currentSection === 0 && e.key === "ArrowUp") {
          setIsFullyInView(false) // This will disable scroll hijacking
          return // Allow normal scroll behavior
        }
  
        if (isScrolling) return
  
        if (e.key === "ArrowDown") {
          const newSection = currentSection + 1
          if (newSection < sections.length) {
            setIsScrolling(true)
            setCurrentSection(newSection)
            setTimeout(() => setIsScrolling(false), 1000)
          }
        } else if (e.key === "ArrowUp") {
          const newSection = currentSection - 1
          if (newSection >= 0) {
            setIsScrolling(true)
            setCurrentSection(newSection)
            setTimeout(() => setIsScrolling(false), 1000)
          }
        }
      }
  
      if (isFullyInView) {
        window.addEventListener("wheel", handleWheel, { passive: false })
        window.addEventListener("keydown", handleKeyDown)
      }
  
      return () => {
        window.removeEventListener("wheel", handleWheel)
        window.removeEventListener("keydown", handleKeyDown)
      }
    }, [currentSection, isScrolling, sections.length, isFullyInView])
  
    return (
      <motion.div
        ref={containerRef}
        className="w-full min-h-screen relative overflow-hidden"
        animate={{ backgroundColor: currentSectionData.bg }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >

  
        {/* Main Content */}
        <div className="flex flex-col justify-center items-center min-h-screen text-center px-4 relative z-10">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`max-w-4xl ${currentSectionData.textColor}`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8 flex justify-center opacity-80"
            >
              {currentSectionData.icon}
            </motion.div>
  
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-6xl md:text-7xl lg:text-8xl font-light mb-8 leading-tight"
            >
              {currentSectionData.title}
              <br />
              <span className="font-normal">{currentSectionData.subtitle}</span>
            </motion.h1>
  
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-xl md:text-2xl opacity-80 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              {currentSectionData.description}
            </motion.p>
  
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-white/20 transition-all duration-300 text-lg font-medium"
            >
              Get Started Now
            </motion.button>
          </motion.div>
  
          {/* Scroll Indicator */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            className="absolute bottom-20 text-2xl text-white/60"
          >
            {currentSection < sections.length - 1 ? "↓" : "↑"}
          </motion.div>
        </div>
  
        {/* Background Patterns */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 overflow-hidden pointer-events-none"
        >
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/3 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </motion.div>
      </motion.div>
    )
  }