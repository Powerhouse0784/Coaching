'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, CheckCircle, XCircle, Trophy, AlertCircle, Brain, 
  BookOpen, Code, Zap, Target, TrendingUp, Award,
  Play, Pause, SkipForward, Flag, ChevronDown, Search, Filter, Loader
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  explanation: string;
}

interface Quiz {
  title: string;
  category: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  questions: Question[];
  metadata: {
    generatedAt: string;
    model: string;
    questionCount: number;
    markingScheme: { correct: string; incorrect: string; unattempted: string };
  };
}

interface Score {
  total: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  percentage: number;
  passed: boolean;
  timeTaken: number;
}

interface Category {
  id: string;
  title: string;
  subject: string;
  class?: number;
  difficulty?: string;
}

// ── Main Component ─────────────────────────────────────────────────────────────
const QuizInterface: React.FC = () => {
  const [quizState, setQuizState] = useState<'categories' | 'loading' | 'taking' | 'result'>('categories');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(3600);
  const [startTime, setStartTime] = useState(0);
  const [score, setScore] = useState<Score | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [categories, setCategories] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [showExplanations, setShowExplanations] = useState(false);

  // ── Dark mode detection ──
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const check = () => setDarkMode(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  const dm = darkMode;

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/quiz/generate');
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (e) { console.error('Failed to load categories:', e); }
  };

  // Timer
  useEffect(() => {
    if (quizState === 'taking' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { handleSubmit(); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quizState, timeLeft]);

  const formatTime = useCallback((secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  const generateQuiz = async (categoryId: string) => {
    setQuizState('loading');
    setSelectedCategory(categoryId);
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: categoryId, questionCount: 20 }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to generate quiz');
      setQuiz(data.data);
      setSelectedAnswers(new Array(data.data.questions.length).fill(null));
      setTimeLeft(data.data.duration * 60);
      setStartTime(Date.now());
      setCurrentQuestion(0);
      setFlaggedQuestions(new Set());
      setShowExplanations(false);
      setQuizState('taking');
    } catch (err: any) {
      alert(err.message || 'Failed to generate quiz. Please try again.');
      setQuizState('categories');
    }
  };

  const selectAnswer = useCallback((idx: number) => {
    const next = [...selectedAnswers];
    next[currentQuestion] = idx;
    setSelectedAnswers(next);
  }, [currentQuestion, selectedAnswers]);

  const toggleFlag = useCallback(() => {
    const next = new Set(flaggedQuestions);
    if (next.has(currentQuestion)) next.delete(currentQuestion);
    else next.add(currentQuestion);
    setFlaggedQuestions(next);
  }, [currentQuestion, flaggedQuestions]);

  const nextQuestion = useCallback(() => {
    if (quiz && currentQuestion < quiz.questions.length - 1) setCurrentQuestion(q => q + 1);
  }, [currentQuestion, quiz]);

  const prevQuestion = useCallback(() => {
    if (currentQuestion > 0) setCurrentQuestion(q => q - 1);
  }, [currentQuestion]);

  const handleSubmit = useCallback(() => {
    if (!quiz) return;
    let totalScore = 0, correct = 0, incorrect = 0, unattempted = 0;
    selectedAnswers.forEach((ans, i) => {
      if (ans === null) unattempted++;
      else if (ans === quiz.questions[i].correctAnswer) { totalScore += 4; correct++; }
      else { totalScore -= 1; incorrect++; }
    });
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const percentage = Math.round((totalScore / quiz.totalMarks) * 100);
    setScore({ total: totalScore, correct, incorrect, unattempted, percentage, passed: totalScore >= quiz.passingMarks, timeTaken });
    setQuizState('result');
  }, [selectedAnswers, quiz, startTime]);

  const resetQuiz = () => {
    setQuizState('categories');
    setScore(null);
    setQuiz(null);
    setSelectedAnswers([]);
    setFlaggedQuestions(new Set());
    setShowExplanations(false);
    setCurrentQuestion(0);
  };

  const getFilteredCategories = () => {
    if (!categories) return [];
    let all = categories.all || [];
    if (filterGroup !== 'all' && categories.grouped?.[filterGroup]) {
      all = categories.grouped[filterGroup].categories;
    }
    if (searchTerm) {
      all = all.filter((c: Category) =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return all;
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (quizState === 'loading') {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
        <div className="text-center px-4">
          <Loader className="w-14 h-14 sm:w-16 sm:h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${dm ? 'text-white' : 'text-gray-900'}`}>Generating Your Quiz...</h2>
          <p className={`text-sm sm:text-base ${dm ? 'text-gray-400' : 'text-gray-600'}`}>AI is creating 20 unique questions for you</p>
        </div>
      </div>
    );
  }

  // ── Categories Screen ──────────────────────────────────────────────────────
  if (quizState === 'categories') {
    const filteredCategories = getFilteredCategories();
    const groups = categories?.grouped ? Object.keys(categories.grouped) : [];

    return (
      <div className={`min-h-screen transition-colors p-3 sm:p-4 lg:p-6 ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}>
        <div className="max-w-6xl mx-auto py-4 sm:py-6 lg:py-8">

          {/* Header */}
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-3 sm:mb-4 shadow-sm text-xs sm:text-sm ${dm ? 'bg-blue-900 text-blue-300' : 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700'}`}>
              <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-medium">AI-Powered Quiz System</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4 px-4">
              Take a Quiz
            </h1>
            <p className={`text-sm sm:text-base lg:text-xl max-w-2xl mx-auto px-4 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
              Choose from 50+ quiz categories • 20 questions • 60 minutes • +4/-1 marking
            </p>
          </div>

          {/* Search & Filter */}
          <div className={`rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6 mb-5 sm:mb-6 border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={`w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm sm:text-base ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`}
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <select
                  value={filterGroup}
                  onChange={e => setFilterGroup(e.target.value)}
                  className={`w-full sm:min-w-[200px] pl-9 sm:pl-10 pr-8 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none font-semibold text-sm sm:text-base ${dm ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                >
                  <option value="all">All Categories</option>
                  {groups.map(g => (
                    <option key={g} value={g}>{categories.grouped[g].title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Categories Grid */}
          {filteredCategories.length === 0 ? (
            <div className={`rounded-xl sm:rounded-2xl border-2 p-10 sm:p-14 text-center ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <AlertCircle className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 ${dm ? 'text-gray-500' : 'text-gray-400'}`} />
              <p className={`text-sm sm:text-base ${dm ? 'text-gray-400' : 'text-gray-600'}`}>No categories found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
              {filteredCategories.map((cat: Category) => (
                <button
                  key={cat.id}
                  onClick={() => generateQuiz(cat.id)}
                  className={`rounded-xl sm:rounded-2xl shadow-sm hover:shadow-xl transition-all p-4 sm:p-5 lg:p-6 text-left border-2 hover:border-blue-500 group ${dm ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-transparent'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.class ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-green-500 to-teal-600'}`}>
                      {cat.class
                        ? <BookOpen className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                        : <Code className="text-white w-5 h-5 sm:w-6 sm:h-6" />}
                    </div>
                    <Play className={`w-4 h-4 sm:w-5 sm:h-5 transition group-hover:text-blue-500 ${dm ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                  <h3 className={`font-bold mb-2 text-sm sm:text-base group-hover:text-blue-500 transition ${dm ? 'text-white' : 'text-gray-900'}`}>
                    {cat.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {cat.class && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${dm ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                        Class {cat.class}
                      </span>
                    )}
                    {cat.difficulty && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                        cat.difficulty === 'beginner'
                          ? dm ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
                          : cat.difficulty === 'intermediate'
                            ? dm ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                            : dm ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700'
                      }`}>
                        {cat.difficulty}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Quiz Taking Screen ─────────────────────────────────────────────────────
  if (quizState === 'taking' && quiz) {
    const question = quiz.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
    const answeredCount = selectedAnswers.filter(a => a !== null).length;

    return (
      <div className={`min-h-screen transition-colors p-2 sm:p-4 ${dm ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-5xl mx-auto">

          {/* Sticky Header */}
          <div className={`rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 sticky top-2 sm:top-4 z-10 border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
              <div className="min-w-0">
                <h2 className={`font-semibold text-xs sm:text-sm lg:text-base truncate ${dm ? 'text-white' : 'text-gray-900'}`}>{quiz.title}</h2>
                <p className={`text-[10px] sm:text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{answeredCount}/{quiz.questions.length} answered</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-base ${timeLeft < 300 ? 'bg-red-100 text-red-700 animate-pulse' : dm ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                  <Clock className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  <span className="font-bold tabular-nums">{formatTime(timeLeft)}</span>
                </div>
                <button onClick={handleSubmit}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition text-xs sm:text-sm">
                  Submit
                </button>
              </div>
            </div>
            <div className={`h-1.5 sm:h-2 rounded-full overflow-hidden ${dm ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Question Card */}
          <div className={`rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8 mb-3 sm:mb-4 border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
              <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                <span className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold flex-shrink-0 text-sm sm:text-lg ${dm ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                  {currentQuestion + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                      question.difficulty === 'easy'
                        ? dm ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
                        : question.difficulty === 'medium'
                          ? dm ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                          : dm ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700'
                    }`}>
                      {question.difficulty}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${dm ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                      {question.topic}
                    </span>
                    <span className={`text-[10px] sm:text-sm ${dm ? 'text-gray-500' : 'text-gray-500'}`}>• 4 marks</span>
                  </div>
                  <h3 className={`text-sm sm:text-base lg:text-xl font-semibold leading-snug ${dm ? 'text-white' : 'text-gray-900'}`}>
                    {question.question}
                  </h3>
                </div>
              </div>
              <button onClick={toggleFlag}
                className={`p-1.5 sm:p-2 rounded-lg transition flex-shrink-0 ${flaggedQuestions.has(currentQuestion) ? 'bg-orange-100 text-orange-600' : dm ? 'bg-gray-700 text-gray-400 hover:text-orange-500' : 'bg-gray-100 text-gray-400 hover:text-orange-600'}`}>
                <Flag className="w-4 h-4 sm:w-5 sm:h-5" fill={flaggedQuestions.has(currentQuestion) ? 'currentColor' : 'none'} />
              </button>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => selectAnswer(i)}
                  className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all ${
                    selectedAnswers[currentQuestion] === i
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : dm
                        ? 'border-gray-600 hover:border-blue-500 hover:bg-gray-700'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedAnswers[currentQuestion] === i ? 'border-blue-500 bg-blue-500' : dm ? 'border-gray-500' : 'border-gray-300'
                    }`}>
                      {selectedAnswers[currentQuestion] === i && <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full" />}
                    </div>
                    <span className={`font-medium text-xs sm:text-sm lg:text-base flex-1 ${
                      selectedAnswers[currentQuestion] === i ? 'text-blue-700' : dm ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      {String.fromCharCode(65 + i)}. {opt}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation + Question Grid */}
          <div className={`rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center justify-between mb-4 gap-2">
              <button onClick={prevQuestion} disabled={currentQuestion === 0}
                className={`px-4 sm:px-6 py-2 border-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition text-xs sm:text-sm font-semibold ${dm ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                Previous
              </button>
              <span className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                {currentQuestion + 1} of {quiz.questions.length}
              </span>
              <button onClick={nextQuestion} disabled={currentQuestion === quiz.questions.length - 1}
                className="px-4 sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                Next <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Question Navigator Grid */}
            <div className={`pt-3 sm:pt-4 border-t-2 ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
              <p className={`text-[10px] sm:text-xs mb-2 sm:mb-3 flex items-center gap-1.5 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5" />Quick Navigation:
              </p>
              <div className="grid grid-cols-10 gap-1 sm:gap-2">
                {quiz.questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQuestion(i)}
                    className={`aspect-square rounded-lg font-semibold text-[10px] sm:text-xs transition ${
                      flaggedQuestions.has(i)
                        ? 'bg-orange-100 text-orange-700 border-2 border-orange-500'
                        : selectedAnswers[i] !== null
                          ? 'bg-green-100 text-green-700 border-2 border-green-500'
                          : currentQuestion === i
                            ? 'bg-blue-500 text-white'
                            : dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 sm:mt-4 text-[10px] sm:text-xs">
                {[
                  { color: 'bg-green-100 border-green-500', label: 'Answered' },
                  { color: dm ? 'bg-gray-700' : 'bg-gray-100', label: 'Not Answered', noBorder: true },
                  { color: 'bg-orange-100 border-orange-500', label: 'Flagged' },
                ].map(({ color, label, noBorder }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded ${color} ${noBorder ? '' : 'border-2'}`} />
                    <span className={dm ? 'text-gray-400' : 'text-gray-600'}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Results Screen ─────────────────────────────────────────────────────────
  if (quizState === 'result' && score && quiz) {
    return (
      <div className={`min-h-screen transition-colors p-3 sm:p-4 lg:p-6 ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}>
        <div className="max-w-4xl mx-auto py-4 sm:py-6 lg:py-8">
          <div className={`rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>

            {/* Result Header */}
            <div className="text-center mb-6 sm:mb-8">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${score.passed ? dm ? 'bg-green-900' : 'bg-green-100' : dm ? 'bg-red-900' : 'bg-red-100'}`}>
                {score.passed
                  ? <Trophy className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${dm ? 'text-green-400' : 'text-green-600'}`} />
                  : <XCircle className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${dm ? 'text-red-400' : 'text-red-600'}`} />}
              </div>
              <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${dm ? 'text-white' : 'text-gray-900'}`}>
                {score.passed ? 'Congratulations! 🎉' : 'Keep Practicing! 💪'}
              </h1>
              <p className={`text-sm sm:text-base mb-1.5 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                {score.passed
                  ? "You've successfully passed the quiz!"
                  : `You need ${quiz.passingMarks} marks to pass. You got ${score.total} marks.`}
              </p>
              <p className={`text-xs sm:text-sm ${dm ? 'text-gray-500' : 'text-gray-500'}`}>
                {quiz.title} • Completed in {formatTime(score.timeTaken)}
              </p>
            </div>

            {/* Score Display */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 text-white text-center mb-5 sm:mb-6">
              <p className="text-base sm:text-lg mb-1 sm:mb-2">Your Score</p>
              <p className="text-5xl sm:text-6xl font-bold mb-1 sm:mb-2">{score.percentage}%</p>
              <p className="text-blue-100 text-base sm:text-lg">{score.total} / {quiz.totalMarks} marks</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-5 sm:mb-6">
              {[
                { icon: CheckCircle, label: 'Correct', value: score.correct, sub: `+${score.correct * 4} marks`, bg: dm ? 'bg-green-900' : 'bg-green-50', color: dm ? 'text-green-400' : 'text-green-600' },
                { icon: XCircle, label: 'Incorrect', value: score.incorrect, sub: `-${score.incorrect} marks`, bg: dm ? 'bg-red-900' : 'bg-red-50', color: dm ? 'text-red-400' : 'text-red-600' },
                { icon: AlertCircle, label: 'Unattempted', value: score.unattempted, sub: '0 marks', bg: dm ? 'bg-gray-700' : 'bg-gray-50', color: dm ? 'text-gray-400' : 'text-gray-600' },
              ].map(({ icon: Icon, label, value, sub, bg, color }) => (
                <div key={label} className={`${bg} rounded-xl p-3 sm:p-4 text-center`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color} mx-auto mb-1.5 sm:mb-2`} />
                  <p className={`text-xs sm:text-sm mb-0.5 sm:mb-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
                  <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
                  <p className={`text-[10px] sm:text-xs ${dm ? 'text-gray-500' : 'text-gray-500'}`}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Performance Analysis */}
            <div className={`rounded-xl p-4 sm:p-5 lg:p-6 mb-5 sm:mb-6 ${dm ? 'bg-blue-950 border-2 border-blue-900' : 'bg-blue-50'}`}>
              <h3 className={`font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base ${dm ? 'text-white' : 'text-gray-900'}`}>
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                Performance Analysis
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {[
                  {
                    label: 'Accuracy',
                    pct: Math.round((score.correct / (score.correct + score.incorrect || 1)) * 100),
                    barColor: 'bg-green-500',
                  },
                  {
                    label: 'Attempt Rate',
                    pct: Math.round(((score.correct + score.incorrect) / quiz.questions.length) * 100),
                    barColor: 'bg-blue-500',
                  },
                ].map(({ label, pct, barColor }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span className={dm ? 'text-gray-400' : 'text-gray-600'}>{label}</span>
                      <span className={`font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>{pct}%</span>
                    </div>
                    <div className={`h-1.5 sm:h-2 rounded-full overflow-hidden ${dm ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Toggle Solutions */}
            <div className="mb-5 sm:mb-6">
              <button onClick={() => setShowExplanations(!showExplanations)}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2 text-sm sm:text-base">
                {showExplanations ? 'Hide' : 'Show'} Detailed Solutions
                <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${showExplanations ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Detailed Solutions */}
            {showExplanations && (
              <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-6">
                <h3 className={`font-bold text-base sm:text-lg ${dm ? 'text-white' : 'text-gray-900'}`}>Question-wise Review</h3>
                {quiz.questions.map((q, idx) => {
                  const userAns = selectedAnswers[idx];
                  const isCorrect = userAns === q.correctAnswer;
                  const isUnattempted = userAns === null;
                  return (
                    <div key={idx} className={`border-2 rounded-xl p-3 sm:p-4 ${
                      isUnattempted
                        ? dm ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
                        : isCorrect
                          ? dm ? 'border-green-800 bg-green-950' : 'border-green-200 bg-green-50'
                          : dm ? 'border-red-800 bg-red-950' : 'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 ${dm ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-900'}`}>
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-xs sm:text-sm mb-2 ${dm ? 'text-white' : 'text-gray-900'}`}>{q.question}</p>
                          <div className="space-y-1">
                            {q.options.map((opt, oi) => (
                              <div key={oi} className={`flex items-start gap-1.5 text-xs sm:text-sm ${
                                oi === q.correctAnswer
                                  ? dm ? 'text-green-400 font-semibold' : 'text-green-700 font-semibold'
                                  : oi === userAns && !isCorrect
                                    ? dm ? 'text-red-400' : 'text-red-700'
                                    : dm ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {oi === q.correctAnswer && <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />}
                                {oi === userAns && !isCorrect && <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />}
                                {oi !== q.correctAnswer && !(oi === userAns && !isCorrect) && <span className="w-3.5 sm:w-4 flex-shrink-0" />}
                                <span>{String.fromCharCode(65 + oi)}. {opt}</span>
                              </div>
                            ))}
                          </div>
                          <div className={`mt-2 sm:mt-3 p-2.5 sm:p-3 rounded-lg border ${dm ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                            <p className={`text-[10px] sm:text-xs font-semibold mb-1 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Explanation:</p>
                            <p className={`text-[10px] sm:text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{q.explanation}</p>
                          </div>
                        </div>
                        <div className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-xs sm:text-sm font-semibold flex-shrink-0 ${
                          isUnattempted
                            ? dm ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                            : isCorrect
                              ? dm ? 'bg-green-900 text-green-300' : 'bg-green-200 text-green-700'
                              : dm ? 'bg-red-900 text-red-300' : 'bg-red-200 text-red-700'
                        }`}>
                          {isUnattempted ? '0' : isCorrect ? '+4' : '-1'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Button */}
            <button onClick={resetQuiz}
              className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2 text-sm sm:text-base">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
              Take Another Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default QuizInterface;