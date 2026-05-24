import { useState } from "react";
import { ArrowRight, Sparkles, RefreshCcw, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { universities } from "../data";
import { UniversityCard } from "../components/UniversityCard";

const QUESTIONS = [
  {
    id: "major",
    question: "First, what do you want to study?",
    placeholder: "e.g. Computer Science, Graphic Design...",
  },
  {
    id: "location",
    question: "Where are you looking to study?",
    placeholder: "e.g. New York, California, TX...",
  },
  {
    id: "budget",
    question: "What's your maximum yearly budget?",
    placeholder: "e.g. 30000, 50000...",
    type: "number"
  }
];

export function Quiz() {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({
    major: "",
    location: "",
    budget: "",
  });
  const [inputValue, setInputValue] = useState("");
  const [showResults, setShowResults] = useState(false);

  const handleNext = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!inputValue.trim() && currentStep < QUESTIONS.length) {
      return; // Require input
    }

    const currentQuestionId = QUESTIONS[currentStep].id;
    setAnswers(prev => ({ ...prev, [currentQuestionId]: inputValue }));
    setInputValue("");

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const restartQuiz = () => {
    setHasStarted(false);
    setCurrentStep(0);
    setAnswers({ major: "", location: "", budget: "" });
    setInputValue("");
    setShowResults(false);
  };

  // Find best match based on quiz answers
  const bestMatches = showResults ? universities.map(uni => {
    let score = 0;
    
    // Major match
    const majorTarget = answers.major.toLowerCase();
    if (uni.majors.some(m => m.name.toLowerCase().includes(majorTarget))) {
      score += 40;
    }
    
    // Location match
    const locTarget = answers.location.toLowerCase();
    if (uni.location.toLowerCase().includes(locTarget)) {
      score += 30;
    }
    
    // Budget match
    const tuitionVal = parseInt(uni.tuition.replace(/[^0-9]/g, ''), 10);
    const budgetVal = parseInt(answers.budget.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(budgetVal) && tuitionVal <= budgetVal) {
      score += 30;
    }

    return { ...uni, matchScore: score };
  }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 2) : [];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex flex-col pt-12 pb-24">
      <div className="container mx-auto px-4 max-w-4xl flex-1 flex flex-col">
        
        <AnimatePresence mode="wait">
          {!hasStarted ? (
            // Landing / Start Screen
            <motion.div
              key="start"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center text-center pb-20"
            >
              <div className="inline-flex items-center justify-center p-5 bg-indigo-100 rounded-full mb-8 text-indigo-600 shadow-inner">
                <GraduationCap size={48} />
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
                Find Your Dream University
              </h1>
              <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                Not sure where to start? Take our quick 3-step personalized quiz to get matched with the perfect school based on your major, location, and budget.
              </p>
              <button
                onClick={() => setHasStarted(true)}
                className="inline-flex items-center gap-3 rounded-full bg-indigo-600 px-10 py-4 text-xl font-bold text-white shadow-xl shadow-indigo-600/30 transition-all hover:bg-indigo-700 hover:-translate-y-1"
              >
                Start Quiz <ArrowRight size={24} />
              </button>
            </motion.div>
          ) : !showResults ? (
            // Questions Screen
            <motion.div
              key="questions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center pb-20"
            >
              {/* Progress Bar */}
              <div className="mb-16">
                <div className="flex justify-between text-sm font-semibold text-gray-400 mb-3 px-1">
                  <span>Question {currentStep + 1} of {QUESTIONS.length}</span>
                  <span className="text-indigo-600">{Math.round(((currentStep) / QUESTIONS.length) * 100)}% Completed</span>
                </div>
                <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${((currentStep) / QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question & Input Area */}
              <div className="relative min-h-[160px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                  >
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-10 text-center">
                      {QUESTIONS[currentStep].question}
                    </h2>
                    
                    <form onSubmit={handleNext} className="relative">
                      <div className="flex items-center overflow-hidden rounded-full bg-white p-2.5 shadow-2xl ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-indigo-600 transition-all hover:shadow-xl">
                        <input
                          type={QUESTIONS[currentStep].type || "text"}
                          autoFocus
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder={QUESTIONS[currentStep].placeholder}
                          className="w-full border-0 bg-transparent px-6 py-4 text-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                        />
                        <button 
                          type="submit"
                          disabled={!inputValue.trim()}
                          className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white transition-all hover:bg-indigo-700 hover:scale-105 disabled:opacity-50 disabled:hover:bg-indigo-600 disabled:hover:scale-100 shrink-0"
                        >
                          <ArrowRight size={24} />
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            // Results Screen
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mt-8"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Your Top Matches</h2>
                  <p className="text-gray-500 mt-1">Based on your preferences</p>
                </div>
                <button 
                  onClick={restartQuiz}
                  className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-5 py-2.5 rounded-xl transition-colors"
                >
                  <RefreshCcw size={16} /> Retake Quiz
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {bestMatches.map((uni, idx) => (
                  <div key={uni.id} className="relative group">
                    {idx === 0 && (
                      <div className="absolute -top-4 -left-4 z-10 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 transform rotate-[-2deg] group-hover:scale-110 transition-transform">
                        <Sparkles size={16} /> #1 Match
                      </div>
                    )}
                    <UniversityCard university={uni} />
                    
                    {/* Explanation card below */}
                    <div className="mt-4 p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-sm text-indigo-900 shadow-sm">
                      <span className="font-bold block mb-1.5 text-indigo-800">Why this fits you:</span>
                      <p className="text-indigo-700/80">Based on your quiz answers, this university scored {uni.matchScore}% for your specific requirements regarding major, location, and tuition.</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}