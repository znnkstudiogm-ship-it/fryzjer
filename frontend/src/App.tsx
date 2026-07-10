import React, { useState, useEffect, useRef } from "react";
import { 
  Phone, 
  MapPin, 
  Clock, 
  Scissors, 
  Sparkles, 
  User, 
  Heart, 
  Flame, 
  ChevronDown, 
  ChevronUp, 
  Menu, 
  X, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Facebook,
  Info,
  FileText,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SALON_SERVICES, ServiceCategory, ServiceItem } from "./types";

// Images generated for the application
import jedenImage from "./assets/images/wlosypierwsze.jpg";
import heroImage from "./assets/images/wlosyjeden.jpg";
import portraitImage from "./assets/images/wlosydwa.jpg";
import balayageImage from "./assets/images/wlosytrzy.jpg";
import blondImage from "./assets/images/wlosycztery.jpg";
import brunetImage from "./assets/images/wlosypiec.jpg";
import dlugiImage from "./assets/images/wlosyszesc.jpg";

export default function App() {
  // Navigation / Pages State
  // "home" | "privacy" | "regulamin"
  const [currentPage, setCurrentPage] = useState<"home" | "privacy" | "regulamin">("home");
  
  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Accordion (Cennik) State - open first category by default
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    "koloryzacja": true,
    "strzyzenie_damskie": true
  });

  // Booking Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    category: "Koloryzacja",
    service: "Koloryzacja wł. średnie – jeden kolor",
    date: "",
    time: "",
    notes: ""
  });

  const [timeError, setTimeError] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{
    success: boolean | null;
    message: string;
  }>({ success: null, message: "" });

  const formSectionRef = useRef<HTMLDivElement>(null);

  // Toggle Category Accordion
  const toggleCategory = (id: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Get active services list for the selected category in dropdown
  const getServicesForCategoryName = (categoryName: string): string[] => {
    const categoryObj = SALON_SERVICES.find(
      c => c.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (!categoryObj) return [];
    return categoryObj.items.map(item => item.name);
  };

  // Handle category change in form
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCat = e.target.value;
    const services = getServicesForCategoryName(selectedCat);
    setFormData(prev => ({
      ...prev,
      category: selectedCat,
      service: services[0] || ""
    }));
  };

  // Handle direct selection of service from accordion (pre-fills form)
  const handleSelectServiceFromCennik = (categoryName: string, serviceName: string) => {
    setFormData(prev => ({
      ...prev,
      category: categoryName,
      service: serviceName
    }));
    
    // Scroll to form smoothly
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Interface for dynamic schedules
  interface DaySchedule {
    isClosed: boolean;
    minTime: string;
    maxTime: string;
    label: string;
  }

  // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday) based on local date
  const getDayOfWeek = (dateStr: string): number => {
    if (!dateStr) return -1;
    
    // Standardize separators (dots or slashes to hyphens)
    const unified = dateStr.replace(/[\.\/]/g, "-");
    const parts = unified.split("-");
    
    if (parts.length === 3) {
      let year = 0;
      let month = 0;
      let day = 0;
      
      if (parts[0].length === 4) {
        // Format: YYYY-MM-DD
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else if (parts[2].length === 4) {
        // Format: DD-MM-YYYY
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      } else {
        // Guess based on magnitude
        const p0 = parseInt(parts[0], 10);
        const p2 = parseInt(parts[2], 10);
        if (p0 > 31) {
          year = p0;
          month = parseInt(parts[1], 10) - 1;
          day = p2;
        } else if (p2 > 31) {
          day = p0;
          month = parseInt(parts[1], 10) - 1;
          year = p2;
        } else {
          return -1;
        }
      }
      
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        // Construct the Date locally to avoid UTC timezone offset issues
        const localDate = new Date(year, month, day);
        return localDate.getDay();
      }
    }
    
    // Fallback parsing for standard formats if split fails
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
      const d = new Date(parsed);
      if (dateStr.includes("T") || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return d.getDay();
      } else {
        // Standard YYYY-MM-DD formats parsed in browsers default to UTC
        return d.getUTCDay();
      }
    }
    
    return -1;
  };

  // Get schedule for selected date
  const getScheduleForDate = (dateStr: string): DaySchedule => {
    const day = getDayOfWeek(dateStr);
    if (day === 1 || day === 4) { // Monday or Thursday
      return {
        isClosed: false,
        minTime: "13:00",
        maxTime: "20:00",
        label: "Godzina (13:00 – 20:00)"
      };
    } else if (day === 2 || day === 3 || day === 5) { // Tuesday, Wednesday, Friday
      return {
        isClosed: false,
        minTime: "09:00",
        maxTime: "17:00",
        label: "Godzina (09:00 – 17:00)"
      };
    } else if (day === 0 || day === 6) { // Saturday or Sunday
      return {
        isClosed: true,
        minTime: "",
        maxTime: "",
        label: "Salon jest zamknięty w tym dniu"
      };
    }
    // Default / no date
    return {
      isClosed: false,
      minTime: "09:00",
      maxTime: "17:00",
      label: "Godzina"
    };
  };

  const getTodayString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getMaxDateString = (): string => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    const year = maxDate.getFullYear();
    const month = String(maxDate.getMonth() + 1).padStart(2, "0");
    const day = String(maxDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getMinTimeForDate = (dateStr: string): string => {
    const schedule = getScheduleForDate(dateStr);
    if (schedule.isClosed) return "";
    
    if (dateStr === getTodayString()) {
      const now = new Date();
      const currentHour = String(now.getHours()).padStart(2, "0");
      const currentMin = String(now.getMinutes()).padStart(2, "0");
      const currentTimeStr = `${currentHour}:${currentMin}`;
      
      if (currentTimeStr > schedule.minTime) {
        if (currentTimeStr > schedule.maxTime) {
          return schedule.maxTime;
        }
        return currentTimeStr;
      }
    }
    return schedule.minTime;
  };

  const getDaySchedule = (): DaySchedule => {
    return getScheduleForDate(formData.date);
  };

  const getDayScheduleLabel = (): string => {
    if (!formData.date) return "Godzina wizyty (wybierz najpierw datę)";
    const schedule = getScheduleForDate(formData.date);
    if (schedule.isClosed) return "Salon jest dziś zamknięty";
    
    if (formData.date === getTodayString()) {
      const minTime = getMinTimeForDate(formData.date);
      return `Godzina (${minTime} – ${schedule.maxTime})`;
    }
    
    return schedule.label;
  };

  // Validate hour dynamically based on date
  const validateTime = (timeStr: string, dateStr: string): boolean => {
    if (!timeStr) return false;
    
    const schedule = getScheduleForDate(dateStr);
    if (schedule.isClosed) {
      setTimeError("W tym dniu salon jest zamknięty. Proszę wybrać inny termin.");
      return false;
    }

    const [hourStr, minuteStr] = timeStr.split(":");
    const hours = parseInt(hourStr, 10);
    const minutes = parseInt(minuteStr, 10);
    const totalMinutes = hours * 60 + minutes;

    const minTimeAllowed = getMinTimeForDate(dateStr);
    const [minH, minM] = minTimeAllowed.split(":").map(Number);
    const [maxH, maxM] = schedule.maxTime.split(":").map(Number);
    const minMinutes = minH * 60 + minM;
    const maxMinutes = maxH * 60 + maxM;

    if (totalMinutes < minMinutes || totalMinutes > maxMinutes) {
      if (dateStr === getTodayString() && timeStr < minTimeAllowed) {
        setTimeError(`Wybrana godzina już minęła. Wybierz godzinę od ${minTimeAllowed} do ${schedule.maxTime}.`);
      } else {
        setTimeError(`Uwaga: Wybierz godzinę z dozwolonego przedziału od ${minTimeAllowed} do ${schedule.maxTime}.`);
      }
      return false;
    }
    setTimeError("");
    return true;
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, time: val }));
    validateTime(val, formData.date);
  };

  // Automatically validate/adjust time and date when date changes
  useEffect(() => {
    // Clear previous errors first
    setTimeError("");
    setFormErrors(prev => {
      const { date, time, ...rest } = prev;
      return rest;
    });

    if (formData.date) {
      const todayStr = getTodayString();
      const maxDateStr = getMaxDateString();

      if (formData.date < todayStr) {
        setFormErrors(prev => ({ ...prev, date: "Nie można zarezerwować wizyty w przeszłości. Wybierz aktualną lub przyszłą datę." }));
        setFormData(prev => ({ ...prev, time: "" }));
      } else if (formData.date > maxDateStr) {
        setFormErrors(prev => ({ ...prev, date: "Nie można zarezerwować wizyty z tak dużym wyprzedzeniem. Wybierz datę w ciągu najbliższych 3 miesięcy." }));
        setFormData(prev => ({ ...prev, time: "" }));
      } else {
        const schedule = getScheduleForDate(formData.date);
        if (schedule.isClosed) {
          setFormData(prev => ({ ...prev, time: "" }));
          setTimeError("Salon jest zamknięty w wybranym dniu. Proszę wybrać inną datę.");
        } else if (formData.time) {
          const isValid = validateTime(formData.time, formData.date);
          if (!isValid) {
            setFormData(prev => ({ ...prev, time: "" }));
          }
        }
      }
    }
  }, [formData.date]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) {
      errors.firstName = "Imię jest wymagane.";
    }
    if (!formData.lastName.trim()) {
      errors.lastName = "Nazwisko jest wymagane.";
    }
    
    // Phone validation (simple format check)
    const phoneClean = formData.phone.replace(/\s+/g, "");
    if (!formData.phone.trim()) {
      errors.phone = "Numer telefonu jest wymagany.";
    } else if (!/^[+]?[0-9]{9,15}$/.test(phoneClean)) {
      errors.phone = "Wprowadź poprawny numer telefonu (np. 537347356).";
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = "Adres e-mail jest wymagany.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Wprowadź poprawny adres e-mail.";
    }

    const todayStr = getTodayString();
    const maxDateStr = getMaxDateString();

    if (!formData.date) {
      errors.date = "Wybierz datę wizyty.";
    } else if (formData.date < todayStr) {
      errors.date = "Nie można zarezerwować wizyty w przeszłości. Wybierz aktualną lub przyszłą datę.";
    } else if (formData.date > maxDateStr) {
      errors.date = "Nie można zarezerwować wizyty z tak dużym wyprzedzeniem. Wybierz datę w ciągu najbliższych 3 miesięcy.";
    } else {
      const schedule = getScheduleForDate(formData.date);
      if (schedule.isClosed) {
        errors.date = "Salon jest zamknięty w wybranym dniu. Proszę wybrać inną datę.";
      }
    }

    if (formData.date) {
      const schedule = getScheduleForDate(formData.date);
      if (schedule.isClosed) {
        errors.time = "Salon jest zamknięty w tym dniu.";
      } else if (!formData.time) {
        errors.time = "Wprowadź godzinę.";
      } else {
        const [hourStr, minuteStr] = formData.time.split(":");
        const hours = parseInt(hourStr, 10);
        const minutes = parseInt(minuteStr, 10);
        const totalMinutes = hours * 60 + minutes;

        const minTimeAllowed = getMinTimeForDate(formData.date);
        const [minH, minM] = minTimeAllowed.split(":").map(Number);
        const [maxH, maxM] = schedule.maxTime.split(":").map(Number);
        const minMinutes = minH * 60 + minM;
        const maxMinutes = maxH * 60 + maxM;

        if (totalMinutes < minMinutes || totalMinutes > maxMinutes) {
          if (formData.date === todayStr && formData.time < minTimeAllowed) {
            errors.time = `Wybrana godzina już minęła. Wybierz godzinę od ${minTimeAllowed} do ${schedule.maxTime}.`;
          } else {
            errors.time = `Godzina musi być w przedziale ${minTimeAllowed} - ${schedule.maxTime}.`;
          }
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form to /api/send-booking
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmissionStatus({ success: null, message: "" });

    try {
      const payload = {
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        phone: formData.phone,
        email: formData.email,
        category: formData.category,
        service: formData.service,
        date: formData.date,
        time: formData.time,
        notes: formData.notes
      };

      const response = await fetch("/api/send-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success) {
        setSubmissionStatus({
          success: true,
          message: "Dziękujemy! Twoje zapytanie o rezerwację zostało wysłane. Skontaktujemy się z Tobą w celu potwierdzenia terminu."
        });
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          category: "Koloryzacja",
          service: "Koloryzacja wł. średnie – jeden kolor",
          date: "",
          time: "",
          notes: ""
        });
      } else {
        // If one failed but the response was ok with success=true (handled in Netlify function but in Express let's see)
        setSubmissionStatus({
          success: false,
          message: result.error || "Wystąpił błąd podczas wysyłania zgłoszenia. Spróbuj ponownie lub skontaktuj się telefonicznie."
        });
      }
    } catch (err: any) {
      setSubmissionStatus({
        success: false,
        message: "Problem z połączeniem. Upewnij się, że masz połączenie z siecią i spróbuj ponownie."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for rendering icons dynamically based on category
  const renderCategoryIcon = (iconName: string) => {
    const props = { className: "w-5 h-5 text-[#C5A059]" };
    switch (iconName) {
      case "Sparkles": return <Sparkles {...props} />;
      case "Scissors": return <Scissors {...props} />;
      case "User": return <User {...props} />;
      case "Heart": return <Heart {...props} />;
      case "Flame": return <Flame {...props} />;
      default: return <Scissors {...props} />;
    }
  };

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#E0E0E0] font-sans antialiased selection:bg-[#C5A059] selection:text-black flex flex-col justify-between">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#141414]/90 backdrop-blur-md border-b border-[#C5A059]/20 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex justify-between items-center">
          
          {/* Logo */}
          <div className="flex flex-col cursor-pointer" onClick={() => setCurrentPage("home")}>
            <span className="font-serif text-xl sm:text-2xl tracking-[0.15em] text-[#C5A059] uppercase font-bold leading-tight">
              Beauty Style
            </span>
            <span className="text-[9px] sm:text-[10px] tracking-[0.35em] text-gray-400 uppercase font-medium">
              Roksana Kotyrba
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-8 lg:gap-12 items-center text-[11px] font-semibold uppercase tracking-widest text-gray-300">
            <button 
              onClick={() => { setCurrentPage("home"); setTimeout(() => document.getElementById("o-nas")?.scrollIntoView({ behavior: 'smooth' }), 50); }} 
              className="hover:text-[#C5A059] transition-colors cursor-pointer"
            >
              O nas
            </button>
            <button 
              onClick={() => { setCurrentPage("home"); setTimeout(() => document.getElementById("uslugi")?.scrollIntoView({ behavior: 'smooth' }), 50); }} 
              className="hover:text-[#C5A059] transition-colors cursor-pointer"
            >
              Cennik
            </button>
            <button 
              onClick={() => { setCurrentPage("home"); setTimeout(() => document.getElementById("galeria")?.scrollIntoView({ behavior: 'smooth' }), 50); }} 
              className="hover:text-[#C5A059] transition-colors cursor-pointer"
            >
              Galeria
            </button>
            <button 
              onClick={() => { setCurrentPage("home"); setTimeout(() => document.getElementById("kontakt")?.scrollIntoView({ behavior: 'smooth' }), 50); }} 
              className="hover:text-[#C5A059] transition-colors cursor-pointer"
            >
              Kontakt
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex gap-3 items-center">
            <a 
              href="tel:+48537347356" 
              className="border border-[#C5A059]/40 hover:border-[#C5A059] text-gray-300 hover:text-[#C5A059] px-4 py-2 rounded-none text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2"
            >
              <Phone className="w-3 h-3" />
              Zadzwoń
            </a>
            <button 
              onClick={() => {
                setCurrentPage("home");
                setTimeout(() => formSectionRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
              }}
              className="bg-[#C5A059] text-black hover:bg-[#D4B577] px-5 py-2 rounded-none text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-lg shadow-[#C5A059]/10"
            >
              Zarezerwuj wizytę
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden text-gray-300 hover:text-[#C5A059] transition-colors focus:outline-none"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden bg-[#141414] border-t border-[#C5A059]/10 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4 flex flex-col text-sm uppercase tracking-widest font-semibold text-gray-300">
                <button 
                  onClick={() => {
                    setCurrentPage("home");
                    setMobileMenuOpen(false);
                    setTimeout(() => document.getElementById("o-nas")?.scrollIntoView({ behavior: 'smooth' }), 100);
                  }}
                  className="text-left py-2 hover:text-[#C5A059]"
                >
                  O nas
                </button>
                <button 
                  onClick={() => {
                    setCurrentPage("home");
                    setMobileMenuOpen(false);
                    setTimeout(() => document.getElementById("uslugi")?.scrollIntoView({ behavior: 'smooth' }), 100);
                  }}
                  className="text-left py-2 hover:text-[#C5A059]"
                >
                  Cennik
                </button>
                <button 
                  onClick={() => {
                    setCurrentPage("home");
                    setMobileMenuOpen(false);
                    setTimeout(() => document.getElementById("galeria")?.scrollIntoView({ behavior: 'smooth' }), 100);
                  }}
                  className="text-left py-2 hover:text-[#C5A059]"
                >
                  Galeria
                </button>
                <button 
                  onClick={() => {
                    setCurrentPage("home");
                    setMobileMenuOpen(false);
                    setTimeout(() => document.getElementById("kontakt")?.scrollIntoView({ behavior: 'smooth' }), 100);
                  }}
                  className="text-left py-2 hover:text-[#C5A059]"
                >
                  Kontakt
                </button>
                <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
                  <a 
                    href="tel:+48537347356"
                    className="w-full text-center border border-[#C5A059]/40 py-3 text-xs font-bold text-gray-300 hover:text-[#C5A059] flex items-center justify-center gap-2"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Zadzwoń
                  </a>
                  <button 
                    onClick={() => {
                      setCurrentPage("home");
                      setMobileMenuOpen(false);
                      setTimeout(() => formSectionRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                    }}
                    className="w-full text-center bg-[#C5A059] text-black py-3 text-xs font-bold"
                  >
                    Rezerwacja
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {currentPage === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              
              {/* HERO SECTION */}
              <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-black">
                {/* Background image with parallax styled overlay */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={heroImage} 
                    alt="Salon fryzjerski" 
                    className="w-full h-full object-cover opacity-35 object-center scale-105 transform transition duration-[20s] hover:scale-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F0F] via-[#0F0F0F]/90 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-transparent"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
                  <div className="max-w-2xl">
                    {/* Tiny high contrast header */}
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      className="flex items-center gap-2 mb-4"
                    >
                      <span className="h-[1px] w-8 bg-[#C5A059]"></span>
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-[#C5A059]">
                        Beauty Style Roksana Kotyrba
                      </span>
                    </motion.div>

                    {/* Main Slogan */}
                    <motion.h1 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.1 }}
                      className="text-4xl sm:text-5xl lg:text-6.5xl font-serif text-white tracking-tight leading-[1.15] mb-6"
                    >
                      Twoje włosy to Twoja korona.<br className="hidden sm:inline" />Pozwól mi o nią zadbać.
                    </motion.h1>

                    <motion.p 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.2 }}
                      className="text-base sm:text-lg text-gray-300 mb-10 leading-relaxed font-light"
                    >
                      Profesjonalny i elegancki salon fryzjerski w Rybniku. Specjalizuję się w nowoczesnych koloryzacjach, precyzyjnych cięciach damskich i męskich oraz luksusowych zabiegach pielęgnacyjnych.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.3 }}
                      className="flex flex-col sm:flex-row gap-4"
                    >
                      <button 
                        onClick={() => formSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                        className="bg-[#C5A059] text-black font-bold uppercase py-4 px-8 text-xs tracking-widest hover:bg-[#D4B577] transition-all duration-300 shadow-lg shadow-[#C5A059]/20 cursor-pointer text-center"
                      >
                        Zarezerwuj wizytę
                      </button>
                      <a 
                        href="tel:+48537347356"
                        className="border border-[#C5A059]/40 text-white hover:text-[#C5A059] hover:border-[#C5A059] font-bold uppercase py-4 px-8 text-xs tracking-widest transition-all duration-300 text-center flex items-center justify-center gap-2"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Zadzwoń do mnie
                      </a>
                    </motion.div>
                  </div>
                </div>

                {/* Bottom elegant bar showing details */}
                <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/5 bg-[#141414]/80 backdrop-blur-sm hidden lg:block">
                  <div className="max-w-7xl mx-auto px-8 py-5 grid grid-cols-3 gap-8">
                    <div className="flex items-center gap-4">
                      <MapPin className="w-5 h-5 text-[#C5A059] shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Adres Salonu</p>
                        <p className="text-xs text-white">ul. Orzechowa 17, Rybnik</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 border-x border-white/5 px-8">
                      <Phone className="w-5 h-5 text-[#C5A059] shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Rezerwacja Telefoniczna</p>
                        <p className="text-xs text-white hover:text-[#C5A059] transition-colors">
                          <a href="tel:+48537347356">+48 537 347 356</a>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pl-8">
                      <Clock className="w-5 h-5 text-[#C5A059] shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Otwarte Pn - Pt</p>
                        <p className="text-xs text-white">9:00 - 17:00 / 13:00 - 20:00</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION: ABOUT ME (O NAS) */}
              <section id="o-nas" className="py-24 bg-[#0F0F0F] relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
                    
                    {/* Portrait Image Block */}
                    <div className="lg:col-span-5 relative">
                      <div className="absolute -inset-1 border border-[#C5A059]/30 translate-x-4 translate-y-4 -z-10"></div>
                      <div className="bg-[#141414] aspect-[3/4] overflow-hidden border border-[#C5A059]/10 relative">
                      <img
                      src={portraitImage}
                      alt="Roksana Kotyrba"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      />
                      </div>
                    </div>

                    {/* Text Block */}
                    <div className="lg:col-span-7">
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C5A059] block mb-3">O Salonie & Właścicielce</span>
                      <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-tight mb-6">
                        Indywidualne podejście, perfekcyjne rzemiosło.
                      </h2>
                      <div className="h-0.5 w-16 bg-[#C5A059] mb-8"></div>
                      
                      <div className="space-y-6 text-gray-300 font-light leading-relaxed">
                        <p>
                          Nazywam się <strong>Roksana Kotyrba</strong> i prowadzę kameralny salon fryzjerski <strong>Beauty Style</strong> w Rybniku. Fryzjerstwo to nie tylko mój zawód, ale przede wszystkim życiowa pasja. Od lat z entuzjazmem kreuję wizerunek moich Klientów, dbając o to, by każda fryzura była perfekcyjnie dopasowana do ich osobowości, typu urody i struktury włosa.
                        </p>
                        <p>
                          Salon <strong>Beauty Style</strong> powstał z myślą o osobach poszukujących profesjonalnych i kompleksowych usług na najwyższym poziomie. Jako jedyna osoba w zespole gwarantuję w pełni indywidualne podejście — cały czas spędzony w moim salonie dedykowany jest wyłącznie jednej Klientce na raz. Bez pośpiechu, w skupieniu i z pełnym zaangażowaniem dobierzemy fryzurę, która idealnie wydobędzie Twoje naturalne piękno.
                        </p>
                      </div>

                      {/* Stat/Features highlights */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-10 mt-10 border-t border-white/5">
                        <div>
                          <p className="text-xl sm:text-2xl font-serif text-[#C5A059] font-bold">100%</p>
                          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold mt-1">Indywidualna uwaga</p>
                        </div>
                        <div>
                          <p className="text-xl sm:text-2xl font-serif text-[#C5A059] font-bold">Podczerwień</p>
                          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold mt-1">Zaawansowana pielęgnacja</p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-xl sm:text-2xl font-serif text-[#C5A059] font-bold">Rybnik</p>
                          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold mt-1">Komfortowa lokalizacja</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </section>

              {/* SECTION: USŁUGI I CENNIK (ACCORDION) */}
              <section id="uslugi" className="py-24 bg-[#141414] border-y border-[#C5A059]/10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                  
                  {/* Header */}
                  <div className="text-center mb-16">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C5A059] block mb-3">Luksusowa Oferta</span>
                    <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-tight mb-4">Cennik Usług</h2>
                    <p className="text-gray-400 text-sm font-light max-w-lg mx-auto">
                      Wszystkie zabiegi wykonuję z zachowaniem najwyższych standardów higieny i dbałości o każdy detal. Kliknij na kategorię, by rozwinąć szczegóły.
                    </p>
                    <div className="h-0.5 w-12 bg-[#C5A059] mx-auto mt-6"></div>
                  </div>

                  {/* Accordion list */}
                  <div className="space-y-4">
                    {SALON_SERVICES.map((category) => {
                      const isOpen = !!openCategories[category.id];
                      return (
                        <div 
                          key={category.id} 
                          className="border border-[#C5A059]/20 bg-[#0F0F0F] transition-all duration-300 hover:border-[#C5A059]/40 overflow-hidden"
                        >
                          {/* Accordion Trigger Header */}
                          <button
                            onClick={() => toggleCategory(category.id)}
                            className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none select-none"
                          >
                            <div className="flex items-center gap-4">
                              {renderCategoryIcon(category.icon)}
                              <div>
                                <h3 className="font-serif text-base sm:text-lg text-white font-medium tracking-wide">
                                  {category.name}
                                </h3>
                                <p className="text-xs text-gray-400 font-light mt-0.5 line-clamp-1 sm:line-clamp-none">
                                  {category.description}
                                </p>
                              </div>
                            </div>
                            <div className="p-1 border border-[#C5A059]/20 text-[#C5A059] hover:bg-[#C5A059]/10 rounded-none transition-all">
                              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </button>

                          {/* Accordion Content */}
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                              >
                                <div className="px-6 pb-6 pt-2 border-t border-white/5 bg-[#121212]/50">
                                  <div className="divide-y divide-white/5">
                                    {category.items.map((item, index) => (
                                      <div 
                                        key={index} 
                                        className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 group hover:bg-white/[0.01] px-2 -mx-2 transition-colors duration-150"
                                      >
                                        <div className="flex-grow">
                                          <div className="flex justify-between items-baseline gap-4">
                                            <span className="font-medium text-sm sm:text-base text-gray-200 group-hover:text-white transition-colors">
                                              {item.name}
                                            </span>
                                            {/* Elegant dot leader in desktop */}
                                            <span className="hidden sm:inline-block flex-grow border-b border-dashed border-white/10 mx-2"></span>
                                            <span className="font-serif text-sm sm:text-base text-[#C5A059] font-bold shrink-0">
                                              {item.price}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1">
                                              <Clock className="w-3 h-3 text-[#C5A059]" />
                                              {item.duration}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="shrink-0 pt-2 sm:pt-0">
                                          <button
                                            onClick={() => handleSelectServiceFromCennik(category.name, item.name)}
                                            className="text-[10px] font-bold uppercase tracking-widest bg-transparent border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059] hover:text-black px-4 py-2 transition-all duration-300 w-full sm:w-auto text-center"
                                          >
                                            Wybierz i zapytaj
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </section>

              {/* SECTION: GALLERY (GALERIA) */}
              <section id="galeria" className="py-24 bg-[#0F0F0F]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C5A059] block mb-3">Efekty Pracy</span>
                      <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">Galeria Realizacji</h2>
                      <div className="h-0.5 w-16 bg-[#C5A059] mt-4"></div>
                    </div>
                    <p className="text-gray-400 text-sm max-w-md font-light leading-relaxed">
                      Zobacz efekty metamorfoz i profesjonalnych koloryzacji, które opuściły mój salon. Dbając o jakość włosa, tworzę niepowtarzalne kompozycje kolorystyczne.
                    </p>
                  </div>

                  {/* Elegant Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    
                    {/* Item 1 */}
                    <div className="overflow-hidden bg-[#141414] border border-white/5 relative aspect-square">
                      <img 
                        src={balayageImage} 
                        alt="Stylizacja włosów" 
                        className="w-full h-full object-cover contrast-110 hover:scale-105 transition-all duration-700 ease-in-out"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Item 2 */}
                    <div className="overflow-hidden bg-[#141414] border border-white/5 relative aspect-square">
                      <img 
                        src={heroImage} 
                        alt="Wnętrze salonu" 
                        className="w-full h-full object-cover contrast-110 hover:scale-105 transition-all duration-700 ease-in-out"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Item 3 */}
                    <div className="overflow-hidden bg-[#141414] border border-white/5 relative aspect-square">
                      <img 
                        src={portraitImage} 
                        alt="Metamorfoza fryzury" 
                        className="w-full h-full object-cover contrast-110 hover:scale-105 transition-all duration-700 ease-in-out"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Item 4 */}
                    <div className="overflow-hidden bg-[#141414] border border-white/5 relative aspect-square">
                      <img 
                        src={blondImage} 
                        alt="Koloryzacja i refleksy" 
                        className="w-full h-full object-cover contrast-110 hover:scale-105 transition-all duration-700 ease-in-out"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Item 5 */}
                    <div className="overflow-hidden bg-[#141414] border border-white/5 relative aspect-square">
                      <img 
                        src={brunetImage} 
                        alt="Stanowisko fryzjerskie" 
                        className="w-full h-full object-cover contrast-110 hover:scale-105 transition-all duration-700 ease-in-out"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Item 6 */}
                    <div className="overflow-hidden bg-[#141414] border border-white/5 relative aspect-square">
                      <img 
                        src={dlugiImage} 
                        alt="Efekt stylizacji" 
                        className="w-full h-full object-cover contrast-110 hover:scale-105 transition-all duration-700 ease-in-out"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                  </div>
                </div>
              </section>

              {/* SECTION: RESERVATION FORM (ZAPYTAJ O REZERWACJĘ) */}
              <section 
                id="rezerwacja" 
                ref={formSectionRef} 
                className="py-24 bg-[#141414] border-t border-[#C5A059]/20 relative"
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                    
                    {/* Left Column: Form Header Info */}
                    <div className="lg:col-span-4 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C5A059] block mb-3">Rezerwacja Online</span>
                        <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-tight mb-6">
                          Zapytaj o dogodny termin
                        </h2>
                        <div className="h-0.5 w-16 bg-[#C5A059] mb-8"></div>
                        <p className="text-gray-300 text-sm font-light leading-relaxed mb-6">
                          Wypełnij krótki formularz, wybierając odpowiednią kategorię oraz szczegółową usługę z cennika. Skontaktuję się z Tobą telefonicznie, aby potwierdzić rezerwację i doprecyzować szczegóły.
                        </p>
                      </div>

                      <div className="space-y-4 pt-8 border-t border-white/5">
                        <div className="flex gap-3 items-center text-xs text-gray-400">
                          <Phone className="w-4 h-4 text-[#C5A059]" />
                          <span>Zawsze możesz też zadzwonić: <a href="tel:+48537347356" className="text-white hover:text-[#C5A059] transition-colors font-bold">+48 537 347 356</a></span>
                        </div>
                        <div className="flex gap-3 items-center text-xs text-gray-400">
                          <Clock className="w-4 h-4 text-[#C5A059]" />
                          <span>Praca od 09:00 do 17:00 / 13:00 do 20:00</span>
                        </div>
                        <div className="flex gap-3 items-center text-xs text-gray-400">
                          <Calendar className="w-4 h-4 text-[#C5A059]" />
                          <span>Zgłoszenia online przetwarzam na bieżąco!</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Dynamic Form */}
                    <div className="lg:col-span-8 bg-[#0F0F0F] border border-[#C5A059]/20 p-6 sm:p-10 relative">
                      
                      {/* Success / Error Message Banner */}
                      {submissionStatus.success !== null && (
                        <div className={`p-5 mb-8 rounded-none flex items-start gap-4 border ${
                          submissionStatus.success 
                            ? "bg-green-950/30 border-green-700/30 text-green-300" 
                            : "bg-red-950/30 border-red-900/30 text-red-300"
                        }`}>
                          {submissionStatus.success ? (
                            <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <h4 className="font-serif font-bold mb-1">
                              {submissionStatus.success ? "Wysłano pomyślnie!" : "Wystąpił problem"}
                            </h4>
                            <p className="text-xs leading-relaxed">{submissionStatus.message}</p>
                          </div>
                        </div>
                      )}

                      <form onSubmit={handleSubmitBooking} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          
                          {/* Imię */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
                              Imię *
                            </label>
                            <input 
                              type="text" 
                              required
                              value={formData.firstName}
                              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                              className={`w-full bg-black border ${formErrors.firstName ? 'border-red-500' : 'border-white/10'} p-4 text-sm text-white focus:border-[#C5A059] outline-none transition-colors rounded-none placeholder:text-gray-600`}
                              placeholder="np. Anna"
                            />
                            {formErrors.firstName && (
                              <p className="text-[10px] text-red-500 mt-1">{formErrors.firstName}</p>
                            )}
                          </div>

                          {/* Nazwisko */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
                              Nazwisko *
                            </label>
                            <input 
                              type="text" 
                              required
                              value={formData.lastName}
                              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                              className={`w-full bg-black border ${formErrors.lastName ? 'border-red-500' : 'border-white/10'} p-4 text-sm text-white focus:border-[#C5A059] outline-none transition-colors rounded-none placeholder:text-gray-600`}
                              placeholder="np. Kowalska"
                            />
                            {formErrors.lastName && (
                              <p className="text-[10px] text-red-500 mt-1">{formErrors.lastName}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          
                          {/* Numer Telefonu */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
                              Numer Telefonu *
                            </label>
                            <input 
                              type="tel" 
                              required
                              value={formData.phone}
                              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                              className={`w-full bg-black border ${formErrors.phone ? 'border-red-500' : 'border-white/10'} p-4 text-sm text-white focus:border-[#C5A059] outline-none transition-colors rounded-none placeholder:text-gray-600`}
                              placeholder="+48 123 456 789"
                            />
                            {formErrors.phone && (
                              <p className="text-[10px] text-red-500 mt-1">{formErrors.phone}</p>
                            )}
                          </div>

                          {/* Adres E-mail */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
                              Adres E-mail *
                            </label>
                            <input 
                              type="email" 
                              required
                              value={formData.email}
                              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                              className={`w-full bg-black border ${formErrors.email ? 'border-red-500' : 'border-white/10'} p-4 text-sm text-white focus:border-[#C5A059] outline-none transition-colors rounded-none placeholder:text-gray-600`}
                              placeholder="twoj-email@przyklad.pl"
                            />
                            {formErrors.email && (
                              <p className="text-[10px] text-red-500 mt-1">{formErrors.email}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          
                          {/* Data wizyty */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
                              Data Wizyty *
                            </label>
                            <input 
                              type="date" 
                              required
                              min={getTodayString()}
                              max={getMaxDateString()}
                              value={formData.date}
                              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                              className={`w-full bg-black border ${formErrors.date ? 'border-red-500' : 'border-white/10'} p-4 text-sm text-white focus:border-[#C5A059] outline-none transition-colors rounded-none placeholder:text-gray-600`}
                            />
                            {formErrors.date && (
                              <p className="text-[10px] text-red-500 mt-1">{formErrors.date}</p>
                            )}
                          </div>

                          {/* Kategoria usługi */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
                              Kategoria Usługi *
                            </label>
                            <div className="relative">
                              <select 
                                value={formData.category}
                                onChange={handleCategoryChange}
                                className="w-full bg-black border border-white/10 p-4 text-sm text-white focus:border-[#C5A059] outline-none transition-colors rounded-none appearance-none cursor-pointer"
                              >
                                {SALON_SERVICES.map(c => (
                                  <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500">
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          
                          {/* Konkretna usługa (dynamiczna) */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
                              Wybierz Usługę *
                            </label>
                            <div className="relative">
                              <select 
                                value={formData.service}
                                onChange={(e) => setFormData(prev => ({ ...prev, service: e.target.value }))}
                                className="w-full bg-black border border-white/10 p-4 text-sm text-white focus:border-[#C5A059] outline-none transition-colors rounded-none appearance-none cursor-pointer"
                              >
                                {getServicesForCategoryName(formData.category).map((serviceName, idx) => (
                                  <option key={idx} value={serviceName}>{serviceName}</option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500">
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Split layout for distinct hour block and notes */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-6 border-t border-white/5">
                          
                          {/* Umów się na wizytę (Godzina) Block - Left Column */}
                          <div className="md:col-span-5 bg-black border border-[#C5A059]/30 p-5 space-y-3 flex flex-col justify-between">
                            <div>
                              <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#C5A059] block">
                                Umów się na wizytę
                              </label>
                              <span className="text-[10px] text-gray-400 block mt-1">
                                {getDayScheduleLabel()} *
                              </span>
                            </div>
                            
                            <div className="relative">
                              {!formData.date ? (
                                <input 
                                  type="text" 
                                  disabled
                                  placeholder="Najpierw wybierz datę"
                                  className="w-full bg-black border border-white/10 p-3.5 text-sm text-gray-500 outline-none rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              ) : (
                                <input 
                                  type="time" 
                                  disabled={getDaySchedule().isClosed}
                                  required={!getDaySchedule().isClosed}
                                  value={formData.time}
                                  onChange={handleTimeChange}
                                  className={`w-full bg-black border ${formErrors.time || timeError ? 'border-red-500' : 'border-[#C5A059]/40'} p-3.5 text-sm text-white focus:border-[#C5A059] outline-none transition-colors rounded-none disabled:opacity-50 disabled:cursor-not-allowed [color-scheme:dark]`}
                                />
                              )}
                            </div>
                            
                            <p className="text-[9px] text-gray-500 leading-normal">
                              {getDaySchedule().isClosed 
                                ? "Salon jest zamknięty w weekendy. Proszę wybrać dzień od poniedziałku do piątku."
                                : "(W razie zajętego terminu skontaktujemy się z Tobą, aby zaproponować najbliższy dostępny termin)"}
                            </p>
                            
                            {(formErrors.time || timeError) && (
                              <p className="text-[10px] text-red-400 font-medium leading-tight mt-1">
                                {formErrors.time || timeError}
                              </p>
                            )}
                          </div>

                          {/* Dodatkowe uwagi - Right Column */}
                          <div className="md:col-span-7 space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
                              Dodatkowe Uwagi
                            </label>
                            <textarea 
                              value={formData.notes}
                              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                              className="w-full bg-black border border-white/10 p-4 text-sm text-white focus:border-[#C5A059] outline-none transition-colors rounded-none resize-none h-32 placeholder:text-gray-600"
                              placeholder="Napisz nam więcej — np. jaki kolor włosów Cię interesuje, na co masz alergię, czy inne życzenia dotyczące wizyty"
                            ></textarea>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                          <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full bg-[#C5A059] text-black hover:bg-[#D4B577] disabled:bg-gray-700 disabled:text-gray-400 font-bold py-4 uppercase text-xs tracking-widest transition-all duration-300 shadow-xl shadow-[#C5A059]/5 cursor-pointer flex items-center justify-center gap-2"
                          >
                            {isSubmitting ? (
                              <>
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></span>
                                Wysyłanie zapytania...
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                Wyślij zapytanie o rezerwację
                              </>
                            )}
                          </button>
                        </div>

                      </form>
                    </div>

                  </div>
                </div>
              </section>

              {/* SECTION: CONTACT & MAP (KONTAKT I MAPA) */}
              <section id="kontakt" className="py-24 bg-[#0F0F0F] relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                    
                    {/* Column 1: Info and Table */}
                    <div className="lg:col-span-5 space-y-10">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C5A059] block mb-3">Kontakt & Lokalizacja</span>
                        <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
                          Odwiedź Mój Salon
                        </h2>
                        <div className="h-0.5 w-16 bg-[#C5A059] mt-4 mb-8"></div>
                        <p className="text-gray-300 text-sm font-light leading-relaxed">
                          Salon znajduje się w Rybniku w spokojnej okolicy na ulicy Orzechowej 17. Przed budynkiem dostępny jest wygodny, bezpłatny parking dla Klientów.
                        </p>
                      </div>

                      {/* Contact Details Cards */}
                      <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 border border-white/5 bg-[#141414]">
                          <MapPin className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Adres</p>
                            <p className="text-sm text-white font-medium mt-1">ul. Orzechowa 17, 44-200 Rybnik</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 border border-white/5 bg-[#141414]">
                          <Phone className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Telefon Rezerwacje</p>
                            <a 
                              href="tel:+48537347356" 
                              className="text-sm text-[#C5A059] hover:text-[#D4B577] font-bold mt-1 inline-block transition-colors"
                            >
                              +48 537 347 356
                            </a>
                            <p className="text-[9px] text-gray-500 mt-0.5">(Kliknij numer, aby zadzwonić z komórki)</p>
                          </div>
                        </div>
                      </div>

                      {/* Open Hours Table */}
                      <div className="border border-[#C5A059]/20 bg-[#141414] p-6">
                        <h3 className="font-serif text-base text-[#C5A059] mb-4 uppercase tracking-wider font-semibold flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#C5A059]" />
                          Godziny Otwarcia
                        </h3>
                        <div className="space-y-3 text-xs sm:text-sm">
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-gray-400">Poniedziałek</span>
                            <span className="text-white font-medium">13:00 – 20:00</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-gray-400">Wtorek</span>
                            <span className="text-white font-medium">09:00 – 17:00</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-gray-400">Środa</span>
                            <span className="text-white font-medium">09:00 – 17:00</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-gray-400">Czwartek</span>
                            <span className="text-white font-medium">13:00 – 20:00</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-gray-400">Piątek</span>
                            <span className="text-white font-medium">09:00 – 17:00</span>
                          </div>
                          <div className="flex justify-between text-gray-500 pb-1">
                            <span>Sobota</span>
                            <span className="uppercase tracking-widest font-semibold text-red-500/80">Zamknięte</span>
                          </div>
                          <div className="flex justify-between text-gray-500">
                            <span>Niedziela</span>
                            <span className="uppercase tracking-widest font-semibold text-red-500/80">Zamknięte</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Column 2: Google Map */}
                    <div className="lg:col-span-7 bg-[#141414] border border-white/5 p-2 aspect-[4/3] sm:aspect-video lg:aspect-auto lg:h-full min-h-[300px]">
                      <iframe 
                        title="Beauty Style Roksana Kotyrba Rybnik"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2556.764353243912!2d18.53723321588523!3d50.11059497943015!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4711409f6b9074d3%3A0xe530ef007c0ca48d!2sOrzechowa%2017%2C%2044-200%20Rybnik%2C%20Poland!5e0!3m2!1sen!2spl!4v1700000000000!5m2!1sen!2spl"
                        className="w-full h-full border-0 grayscale opacity-80 hover:grayscale-0 transition-all duration-500"
                        allowFullScreen={true}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                    </div>

                  </div>
                </div>
              </section>

            </motion.div>
          )}

          {/* PAGE: PRIVACY POLICY (POLITYKA PRYWATNOŚCI) */}
          {currentPage === "privacy" && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
            >
              <div className="mb-8">
                <button 
                  onClick={() => setCurrentPage("home")}
                  className="text-xs font-bold uppercase tracking-widest text-[#C5A059] hover:text-[#D4B577] transition-colors flex items-center gap-2 mb-6"
                >
                  ← Powrót do strony głównej
                </button>
                <h1 className="text-3xl sm:text-4xl font-serif text-white font-bold tracking-tight mb-2">
                  Polityka Prywatności
                </h1>
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-6">
                  Salon Beauty Style Roksana Kotyrba
                </span>
                <div className="h-[1px] w-full bg-[#C5A059]/20"></div>
              </div>

              <div className="space-y-6 text-gray-300 leading-relaxed font-light">
                <p className="text-sm text-gray-500 italic">
                  Data ostatniej aktualizacji: 09.07.2026 r.
                </p>

                <h3 className="text-lg font-serif text-[#C5A059] font-semibold mt-6">
                  1. Administrator danych
                </h3>
                <p>
                  Administratorem danych osobowych jest Beauty Style Roksana Kotyrba.
                </p>
                <p>
                  W sprawach związanych z przetwarzaniem danych można skontaktować się pod numerem telefonu lub adresem e-mail podanym na stronie internetowej.
                </p>

                <h3 className="text-lg font-serif text-[#C5A059] font-semibold mt-6">
                  2. Jakie dane zbieramy?
                </h3>
                <p>
                  W celu dokonania i obsługi rezerwacji wizyty możemy przetwarzać następujące dane:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-400">
                  <li>imię i nazwisko,</li>
                  <li>numer telefonu,</li>
                  <li>adres e-mail,</li>
                  <li>datę i godzinę wizyty,</li>
                  <li>informacje przekazane podczas rezerwacji.</li>
                </ul>

                <h3 className="text-lg font-serif text-[#C5A059] font-semibold mt-6">
                  3. Cel przetwarzania danych
                </h3>
                <p>
                  Dane osobowe przetwarzane są w celu:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-400">
                  <li>dokonania i obsługi rezerwacji wizyty,</li>
                  <li>kontaktu z klientem,</li>
                  <li>wysyłania potwierdzeń i przypomnień o wizycie drogą SMS oraz e-mail,</li>
                  <li>realizacji obowiązków wynikających z przepisów prawa,</li>
                  <li>dochodzenia lub obrony przed ewentualnymi roszczeniami.</li>
                </ul>

                <h3 className="text-lg font-serif text-[#C5A059] font-semibold mt-6">
                  4. Podstawa prawna przetwarzania
                </h3>
                <p>
                  Dane przetwarzane są na podstawie art. 6 ust. 1 lit. b RODO (wykonanie umowy lub podjęcie działań przed jej zawarciem) oraz art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes administratora).
                </p>

                <h3 className="text-lg font-serif text-[#C5A059] font-semibold mt-6">
                  5. Odbiorcy danych
                </h3>
                <p>
                  Dane mogą być przekazywane podmiotom wspierającym obsługę rezerwacji, wysyłkę wiadomości SMS i e-mail oraz utrzymanie strony internetowej.
                </p>

                <h3 className="text-lg font-serif text-[#C5A059] font-semibold mt-6">
                  6. Okres przechowywania danych
                </h3>
                <p>
                  Dane przechowywane są przez okres niezbędny do realizacji rezerwacji oraz przez czas wymagany przepisami prawa lub potrzebny do obrony przed ewentualnymi roszczeniami.
                </p>

                <h3 className="text-lg font-serif text-[#C5A059] font-semibold mt-6">
                  7. Prawa użytkownika
                </h3>
                <p>
                  Każdej osobie przysługuje prawo do:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-400">
                  <li>dostępu do swoich danych,</li>
                  <li>ich sprostowania,</li>
                  <li>usunięcia,</li>
                  <li>ograniczenia przetwarzania,</li>
                  <li>wniesienia sprzeciwu wobec przetwarzania,</li>
                  <li>wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.</li>
                </ul>

                <h3 className="text-lg font-serif text-[#C5A059] font-semibold mt-6">
                  8. Kontakt
                </h3>
                <p>
                  W sprawach związanych z ochroną danych osobowych można skontaktować się z administratorem poprzez dane kontaktowe dostępne na stronie internetowej.
                </p>
              </div>
            </motion.div>
          )}

          {/* PAGE: REGULAMIN */}
          {currentPage === "regulamin" && (
            <motion.div
              key="regulamin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
            >
              <div className="mb-8">
                <button 
                  onClick={() => setCurrentPage("home")}
                  className="text-xs font-bold uppercase tracking-widest text-[#C5A059] hover:text-[#D4B577] transition-colors flex items-center gap-2 mb-6"
                >
                  ← Powrót do strony głównej
                </button>
                <h1 className="text-3xl sm:text-4xl font-serif text-white font-bold tracking-tight mb-2">
                  Regulamin
                </h1>
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-6">
                  Salon Beauty Style Roksana Kotyrba
                </span>
                <div className="h-[1px] w-full bg-[#C5A059]/20"></div>
              </div>

              <div className="space-y-6 text-gray-300 leading-relaxed font-light">
                <p className="text-sm text-gray-500 italic">
                  Data ostatniej aktualizacji: 09.07.2026 r.
                </p>

                <h3 className="text-lg font-serif text-[#C5A059] font-semibold mt-6">
                  1. Postanowienia ogólne
                </h3>
                <p>
                  Regulamin określa zasady korzystania ze strony internetowej salonu Beauty Style Roksana Kotyrba oraz dokonywania rezerwacji wizyt.
                </p>
                <p>
                  Korzystanie ze strony oznacza akceptację niniejszego Regulaminu.
                </p>
                <p>
                  Właścicielem strony jest Beauty Style Roksana Kotyrba.
                </p>

                <h3 className="text-lg font-serif text-[#C5A059] font-semibold mt-6">
                  2. Rezerwacja wizyt
                </h3>
                <p>
                  Rezerwacji można dokonać za pośrednictwem formularza dostępnego na stronie internetowej.
                </p>
                <p>
                  Podczas rezerwacji klient zobowiązany jest do podania prawdziwych i aktualnych danych.
                </p>

                <h3 className="text-lg font-serif text-[#C5A059] font-semibold mt-6">
                  3. Zmiana lub odwołanie wizyty
                </h3>
                <p>
                  Klient może zmienić lub odwołać termin wizyty poprzez kontakt z salonem.
                </p>
                <p>
                  Zaleca się poinformowanie o rezygnacji z odpowiednim wyprzedzeniem, aby umożliwić zapisanie innego klienta.
                </p>

                <h3 className="text-lg font-serif text-[#C5A059] font-semibold mt-6">
                  4. Obowiązki klienta
                </h3>
                <p>
                  Klient zobowiązuje się do:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-400">
                  <li>podawania prawdziwych danych,</li>
                  <li>punktualnego stawienia się na wizytę,</li>
                  <li>przestrzegania zasad obowiązujących w salonie.</li>
                </ul>

                <h3 className="text-lg font-serif text-[#C5A059] font-semibold mt-6">
                  5. Odpowiedzialność
                </h3>
                <p>
                  Administrator dokłada wszelkich starań, aby strona działała poprawnie.
                </p>
                <p>
                  Administrator nie ponosi odpowiedzialności za przerwy w działaniu strony wynikające z przyczyn niezależnych od niego.
                </p>

                <h3 className="text-lg font-serif text-[#C5A059] font-semibold mt-6">
                  6. Dane osobowe
                </h3>
                <p>
                  Dane osobowe przetwarzane są zgodnie z obowiązującymi przepisami prawa oraz Polityką Prywatności.
                </p>
                <p>
                  Dane wykorzystywane są wyłącznie w celu realizacji rezerwacji, kontaktu z klientem oraz obsługi świadczonych usług.
                </p>

                <h3 className="text-lg font-serif text-[#C5A059] font-semibold mt-6">
                  7. Prawa autorskie
                </h3>
                <p>
                  Wszelkie materiały zamieszczone na stronie, w tym zdjęcia, grafiki, logo oraz treści, są własnością Beauty Style Roksana Kotyrba lub zostały wykorzystane zgodnie z obowiązującymi przepisami prawa. Zabrania się ich kopiowania i rozpowszechniania bez zgody właściciela.
                </p>

                <h3 className="text-lg font-serif text-[#C5A059] font-semibold mt-6">
                  8. Postanowienia końcowe
                </h3>
                <p>
                  Administrator zastrzega sobie prawo do zmiany niniejszego Regulaminu.
                </p>
                <p>
                  Zmiany obowiązują od momentu ich opublikowania na stronie internetowej.
                </p>
                <p>
                  W sprawach nieuregulowanych Regulaminem zastosowanie mają przepisy prawa polskiego.
                </p>
              </div>
            </motion.div>
          )}


        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#0A0A0A] border-t border-[#C5A059]/20 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 mb-12">
            
            {/* Column 1: Brand & Contact */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex flex-col cursor-pointer" onClick={() => setCurrentPage("home")}>
                <span className="font-serif text-xl tracking-[0.15em] text-[#C5A059] uppercase font-bold">
                  Beauty Style
                </span>
                <span className="text-[9px] tracking-[0.35em] text-gray-400 uppercase font-medium">
                  Roksana Kotyrba
                </span>
              </div>
              <p className="text-xs text-gray-400 font-light max-w-sm leading-relaxed">
                Nowoczesny i kameralny salon fryzjerski stworzony z myślą o dbałości o każdy detal. Twój komfort i piękne, zdrowe włosy są moim absolutnym priorytetem.
              </p>
              
              {/* Social icons */}
              <div className="flex gap-4 pt-2">
                <a 
                  href="https://www.facebook.com/profile.php?id=100054870665486&sk=about" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-8 h-8 rounded-none border border-white/10 hover:border-[#C5A059] flex items-center justify-center text-gray-400 hover:text-[#C5A059] transition-all duration-300"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white">Nawigacja</h4>
              <ul className="space-y-2 text-xs text-gray-400 font-light">
                <li>
                  <button 
                    onClick={() => {
                      setCurrentPage("home");
                      setTimeout(() => document.getElementById("o-nas")?.scrollIntoView({ behavior: 'smooth' }), 50);
                    }} 
                    className="hover:text-[#C5A059] transition-colors"
                  >
                    O nas
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      setCurrentPage("home");
                      setTimeout(() => document.getElementById("uslugi")?.scrollIntoView({ behavior: 'smooth' }), 50);
                    }} 
                    className="hover:text-[#C5A059] transition-colors"
                  >
                    Oferta & Cennik
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      setCurrentPage("home");
                      setTimeout(() => document.getElementById("galeria")?.scrollIntoView({ behavior: 'smooth' }), 50);
                    }} 
                    className="hover:text-[#C5A059] transition-colors"
                  >
                    Galeria prac
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      setCurrentPage("home");
                      setTimeout(() => formSectionRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
                    }} 
                    className="hover:text-[#C5A059] transition-colors"
                  >
                    Rezerwacja terminu
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Firm credentials */}
            <div className="md:col-span-4 space-y-4 text-xs text-gray-400 font-light leading-relaxed">
              <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white">Informacje prawne</h4>
              <p>
                <strong>Beauty Style Roksana Kotyrba</strong><br />
                ul. Orzechowa 17, 44-200 Rybnik<br />
                NIP: (Do uzupełnienia)<br />
                Tel: <a href="tel:+48537347356" className="text-[#C5A059] hover:underline">+48 537 347 356</a>
              </p>
            </div>

          </div>

          {/* Subfooter */}
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] uppercase tracking-widest text-gray-500 gap-4">
            <div>
              <span>© {new Date().getFullYear()} Beauty Style. Wszelkie prawa zastrzeżone.</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center sm:justify-end">
              <button 
                onClick={() => {
                  setCurrentPage("privacy");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }} 
                className="hover:text-[#C5A059] transition-colors cursor-pointer"
              >
                Polityka prywatności
              </button>
              <button 
                onClick={() => {
                  setCurrentPage("regulamin");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }} 
                className="hover:text-[#C5A059] transition-colors cursor-pointer"
              >
                Regulamin
              </button>

            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
