'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, CheckCircle, XCircle, Trophy, AlertCircle, Brain, 
  BookOpen, Code, Zap, Target, TrendingUp, Award,
  Play, Pause, SkipForward, Flag, ChevronDown, Search, Filter
} from 'lucide-react';

// Types
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
    markingScheme: {
      correct: string;
      incorrect: string;
      unattempted: string;
    };
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

const QuizInterface: React.FC = () => {
  const [quizState, setQuizState] = useState<'categories' | 'loading' | 'taking' | 'result'>('categories');
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(3600); // 60 minutes
  const [startTime, setStartTime] = useState<number>(0);
  const [score, setScore] = useState<Score | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [categories, setCategories] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [showExplanations, setShowExplanations] = useState(false);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/quiz/generate');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (quizState === 'taking' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev: number) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quizState, timeLeft]);

  const formatTime = useCallback((seconds: number): string => {
    const mins: number = Math.floor(seconds / 60);
    const secs: number = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const generateQuiz = async (categoryId: string) => {
    setQuizState('loading');
    setSelectedCategory(categoryId);

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryId,
          questionCount: 20
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate quiz');
      }

      setQuiz(data.data);
      setSelectedAnswers(new Array(data.data.questions.length).fill(null));
      setTimeLeft(data.data.duration * 60); // Convert to seconds
      setStartTime(Date.now());
      setQuizState('taking');
    } catch (error: any) {
      console.error('Quiz generation error:', error);
      alert(error.message || 'Failed to generate quiz. Please try again.');
      setQuizState('categories');
    }
  };

  const selectAnswer = useCallback((answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  }, [currentQuestion, selectedAnswers]);

  const toggleFlag = useCallback(() => {
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(currentQuestion)) {
      newFlagged.delete(currentQuestion);
    } else {
      newFlagged.add(currentQuestion);
    }
    setFlaggedQuestions(newFlagged);
  }, [currentQuestion, flaggedQuestions]);

  const nextQuestion = useCallback(() => {
    if (quiz && currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  }, [currentQuestion, quiz]);

  const prevQuestion = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  }, [currentQuestion]);

  const handleSubmit = useCallback(() => {
    if (!quiz) return;

    let totalScore = 0;
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    
    selectedAnswers.forEach((answer: number | null, index: number) => {
      if (answer === null) {
        unattempted++;
        // +0 for unattempted
      } else if (answer === quiz.questions[index].correctAnswer) {
        totalScore += 4; // +4 for correct
        correct++;
      } else {
        totalScore -= 1; // -1 for incorrect
        incorrect++;
      }
    });

    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const percentage = Math.round((totalScore / quiz.totalMarks) * 100);

    const finalScore: Score = {
      total: totalScore,
      correct,
      incorrect,
      unattempted,
      percentage,
      passed: totalScore >= quiz.passingMarks,
      timeTaken
    };

    setScore(finalScore);
    setQuizState('result');
  }, [selectedAnswers, quiz, startTime]);

  // Filter categories for search
  const getFilteredCategories = () => {
    if (!categories) return [];

    let allCategories = categories.all || [];

    // Filter by group
    if (filterGroup !== 'all' && categories.grouped[filterGroup]) {
      allCategories = categories.grouped[filterGroup].categories;
    }

    // Filter by search
    if (searchTerm) {
      allCategories = allCategories.filter((cat: Category) =>
        cat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return allCategories;
  };

  // Categories Selection Screen
  if (quizState === 'categories') {
    const filteredCategories = getFilteredCategories();
    const groups = categories?.grouped ? Object.keys(categories.grouped) : [];

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
        <div className="max-w-6xl mx-auto py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full mb-4 shadow-sm">
              <Brain size={16} />
              <span className="text-sm font-medium">AI-Powered Quiz System</span>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Take a Quiz
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose from 50+ quiz categories • 20 questions • 60 minutes • +4/-1 marking
            </p>
          </div>

          {/* Search & Filter */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[200px]"
                >
                  <option value="all">All Categories</option>
                  {groups.map((group) => (
                    <option key={group} value={group}>
                      {categories.grouped[group].title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              </div>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((category: Category) => (
              <button
                key={category.id}
                onClick={() => generateQuiz(category.id)}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-6 text-left border-2 border-transparent hover:border-blue-500 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    category.class 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                      : 'bg-gradient-to-br from-green-500 to-teal-600'
                  }`}>
                    {category.class ? (
                      <BookOpen className="text-white" size={24} />
                    ) : (
                      <Code className="text-white" size={24} />
                    )}
                  </div>
                  <Play className="text-gray-400 group-hover:text-blue-600 transition" size={20} />
                </div>
                
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                  {category.title}
                </h3>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {category.class && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Class {category.class}
                    </span>
                  )}
                  {category.difficulty && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      category.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                      category.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {category.difficulty}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No categories found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading Screen
  if (quizState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Generating Your Quiz...</h2>
          <p className="text-gray-600">AI is creating 20 unique questions for you</p>
        </div>
      </div>
    );
  }

  // Quiz Taking Screen
  if (quizState === 'taking' && quiz) {
    const question = quiz.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
    const answeredCount = selectedAnswers.filter(a => a !== null).length;

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4 sticky top-4 z-10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-gray-900">{quiz.title}</h2>
                <p className="text-sm text-gray-600">{answeredCount}/{quiz.questions.length} answered</p>
              </div>
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  timeLeft < 300 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-100 text-blue-700'
                }`}>
                  <Clock size={20} />
                  <span className="font-bold tabular-nums text-lg">{formatTime(timeLeft)}</span>
                </div>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition"
                >
                  Submit Quiz
                </button>
              </div>
            </div>
            
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-4">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-3 flex-1">
                <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold flex-shrink-0 text-lg">
                  {currentQuestion + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {question.difficulty}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {question.topic}
                    </span>
                    <span className="text-sm text-gray-500">• 4 marks</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {question.question}
                  </h3>
                </div>
              </div>
              
              <button
                onClick={toggleFlag}
                className={`p-2 rounded-lg transition ${
                  flaggedQuestions.has(currentQuestion)
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-gray-100 text-gray-400 hover:text-orange-600'
                }`}
              >
                <Flag size={20} fill={flaggedQuestions.has(currentQuestion) ? 'currentColor' : 'none'} />
              </button>
            </div>

            <div className="space-y-3">
              {question.options.map((option: string, index: number) => (
                <button
                  key={index}
                  onClick={() => selectAnswer(index)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedAnswers[currentQuestion] === index
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedAnswers[currentQuestion] === index
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedAnswers[currentQuestion] === index && (
                        <div className="w-3 h-3 bg-white rounded-full" />
                      )}
                    </div>
                    <span className={`font-medium flex-1 ${
                      selectedAnswers[currentQuestion] === index
                        ? 'text-blue-700'
                        : 'text-gray-700'
                    }`}>
                      {String.fromCharCode(65 + index)}. {option}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                Previous
              </button>

              <div className="text-sm text-gray-600">
                Question {currentQuestion + 1} of {quiz.questions.length}
              </div>

              <button
                onClick={nextQuestion}
                disabled={currentQuestion === quiz.questions.length - 1}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                Next
                <SkipForward size={16} />
              </button>
            </div>

            {/* Question Navigator */}
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-600 mb-3 flex items-center gap-2">
                <Target size={14} />
                Quick Navigation:
              </p>
              <div className="grid grid-cols-10 gap-2">
                {quiz.questions.map((_: Question, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`aspect-square rounded-lg font-semibold text-sm transition ${
                      flaggedQuestions.has(index)
                        ? 'bg-orange-100 text-orange-700 border-2 border-orange-500'
                        : selectedAnswers[index] !== null
                        ? 'bg-green-100 text-green-700 border-2 border-green-500'
                        : currentQuestion === index
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
                  Answered
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 rounded"></div>
                  Not Answered
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-100 border-2 border-orange-500 rounded"></div>
                  Flagged
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (quizState === 'result' && score && quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
        <div className="max-w-4xl mx-auto py-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Result Header */}
            <div className="text-center mb-8">
              <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${
                score.passed ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {score.passed ? (
                  <Trophy className="w-12 h-12 text-green-600" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-600" />
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {score.passed ? 'Congratulations! 🎉' : 'Keep Practicing! 💪'}
              </h1>
              <p className="text-gray-600 mb-2">
                {score.passed 
                  ? "You've successfully passed the quiz!"
                  : `You need ${quiz.passingMarks} marks to pass. You got ${score.total} marks.`}
              </p>
              <p className="text-sm text-gray-500">
                {quiz.title} • Completed in {formatTime(score.timeTaken)}
              </p>
            </div>

            {/* Score Display */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white text-center mb-6">
              <p className="text-lg mb-2">Your Score</p>
              <p className="text-6xl font-bold mb-2">{score.percentage}%</p>
              <p className="text-blue-100 text-lg">
                {score.total} / {quiz.totalMarks} marks
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Correct</p>
                <p className="text-2xl font-bold text-green-600">{score.correct}</p>
                <p className="text-xs text-gray-500">+{score.correct * 4} marks</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Incorrect</p>
                <p className="text-2xl font-bold text-red-600">{score.incorrect}</p>
                <p className="text-xs text-gray-500">-{score.incorrect} marks</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <AlertCircle className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Unattempted</p>
                <p className="text-2xl font-bold text-gray-600">{score.unattempted}</p>
                <p className="text-xs text-gray-500">0 marks</p>
              </div>
            </div>

            {/* Performance Analysis */}
            <div className="bg-blue-50 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" />
                Performance Analysis
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Accuracy</span>
                    <span className="font-semibold text-gray-900">
                      {Math.round((score.correct / (score.correct + score.incorrect || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${(score.correct / (score.correct + score.incorrect || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Attempt Rate</span>
                    <span className="font-semibold text-gray-900">
                      {Math.round(((score.correct + score.incorrect) / quiz.questions.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${((score.correct + score.incorrect) / quiz.questions.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Solutions Toggle */}
            <div className="mb-6">
              <button
                onClick={() => setShowExplanations(!showExplanations)}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2"
              >
                {showExplanations ? 'Hide' : 'Show'} Detailed Solutions
                <ChevronDown className={`transform transition ${showExplanations ? 'rotate-180' : ''}`} size={20} />
              </button>
            </div>

            {/* Detailed Solutions */}
            {showExplanations && (
              <div className="space-y-4 mb-6">
                <h3 className="font-bold text-gray-900 text-lg">Question-wise Review</h3>
                {quiz.questions.map((q, idx) => {
                  const userAnswer = selectedAnswers[idx];
                  const isCorrect = userAnswer === q.correctAnswer;
                  const isUnattempted = userAnswer === null;

                  return (
                    <div key={idx} className={`border-2 rounded-xl p-4 ${
                      isUnattempted ? 'border-gray-200 bg-gray-50' :
                      isCorrect ? 'border-green-200 bg-green-50' :
                      'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-start gap-3 mb-3">
                        <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-2">{q.question}</p>
                          <div className="space-y-1 text-sm">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className={`flex items-center gap-2 ${
                                optIdx === q.correctAnswer ? 'text-green-700 font-semibold' :
                                optIdx === userAnswer && !isCorrect ? 'text-red-700' :
                                'text-gray-600'
                              }`}>
                                {optIdx === q.correctAnswer && <CheckCircle size={16} />}
                                {optIdx === userAnswer && !isCorrect && <XCircle size={16} />}
                                <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                            <p className="text-sm font-semibold text-gray-700 mb-1">Explanation:</p>
                            <p className="text-sm text-gray-600">{q.explanation}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                          isUnattempted ? 'bg-gray-200 text-gray-700' :
                          isCorrect ? 'bg-green-200 text-green-700' :
                          'bg-red-200 text-red-700'
                        }`}>
                          {isUnattempted ? '0' : isCorrect ? '+4' : '-1'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setQuizState('categories');
                  setScore(null);
                  setQuiz(null);
                  setSelectedAnswers([]);
                  setFlaggedQuestions(new Set());
                  setShowExplanations(false);
                }}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Trophy size={20} />
                Take Another Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default QuizInterface;