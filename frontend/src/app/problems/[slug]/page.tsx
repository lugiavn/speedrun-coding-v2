'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import ReactMarkdown from 'react-markdown';
import Split from 'react-split';
import { Editor } from '@monaco-editor/react';
import { fetcher, api } from '@/lib/api';
import { useTheme } from '@/components/ThemeProvider';
import ProblemSubmissionsList from '@/components/ProblemSubmissionsList';
import { useSubmitCode } from '@/lib/hooks/useSubmitCode';
import { useAuth } from '@/components/AuthProvider';

// Tab options
const TABS = {
  QUESTION: 'question',
  SOLUTION: 'solution',
  SUBMISSIONS: 'submissions'
};

// Default timer value in milliseconds (10 minutes)
const DEFAULT_TIMER_VALUE = 10 * 60 * 1000;

// Format time in MM:SS format, handling negative time
const formatTime = (milliseconds) => {
  // Handle negative times
  const isNegative = milliseconds < 0;
  const absMilliseconds = Math.abs(milliseconds);
  
  // Calculate minutes and seconds
  const totalSeconds = Math.floor(absMilliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  // Format with leading zeros
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');
  
  // Return formatted time with negative sign if needed
  return `${isNegative ? '-' : ''}${formattedMinutes}:${formattedSeconds}`;
};

export default function ProblemDetailPage() {
  const { slug } = useParams();
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(TABS.QUESTION);
  const [language, setLanguage] = useState('');
  const [code, setCode] = useState('');
  const [solutionLanguage, setSolutionLanguage] = useState('');
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [availableSolutionLanguages, setAvailableSolutionLanguages] = useState([]);
  // Store code for each language
  const [codeByLanguage, setCodeByLanguage] = useState({});
  const [systemMessage, setSystemMessage] = useState('');
  
  // Use our custom hook for submission
  const { submitCode, isSubmitting, pendingSubmission } = useSubmitCode();
  
  // Editor theme based on site theme
  const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';
  
  // Timer state with dynamic initial value
  const [initialTimerValue, setInitialTimerValue] = useState(DEFAULT_TIMER_VALUE);
  const [timerStarted, setTimerStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(initialTimerValue);
  const [isCountdown, setIsCountdown] = useState(true); // Default to countdown mode
  const timerIntervalRef = useRef(null);
  
  // Get problem data with solution templates
  const { data, error, isLoading } = useSWR(
    slug ? `/problems/?slug=${slug}` : null,
    fetcher
  );

  // Extract the problem from the results
  const problem = data?.results?.[0];
  
  // Debug logs
  useEffect(() => {
    console.log('Data received:', data);
    console.log('Problem:', problem);
    if (problem) {
      console.log('Solution templates:', problem.solution_templates);
      console.log('Current language:', language);
      console.log('Template for current language:', problem.solution_templates?.[language]);
    }
  }, [data, problem, language]);

  // Setup when problem data is received
  useEffect(() => {
    if (problem) {
      console.log("DEBUG: is problem data received?");
      
      document.title = `${problem.title} - Speedrun Coding`;
      
      // Set dynamic timer value based on time thresholds if available
      if (problem.time_thresholds && problem.time_thresholds.length >= 2) {
        // Sort thresholds by max_minutes ascending
        const sortedThresholds = [...problem.time_thresholds].sort((a, b) => 
          a.max_minutes - b.max_minutes
        );
        
        // Get the second highest threshold (second to last item)
        const secondHighestThreshold = sortedThresholds[sortedThresholds.length - 2];
        if (secondHighestThreshold && typeof secondHighestThreshold.max_minutes === 'number') {
          const timerMinutes = secondHighestThreshold.max_minutes;
          console.log(`Setting timer to ${timerMinutes} minutes from threshold rank: ${secondHighestThreshold.rank}`);
          const newTimerValue = timerMinutes * 60 * 1000;
          setInitialTimerValue(newTimerValue);
          setRemainingTime(newTimerValue);
        }
      }
      
      // Set up solution templates and code & language.
      if (problem.solution_templates) {
        const templateLanguages = Object.keys(problem.solution_templates);
        setAvailableLanguages(templateLanguages);
        
        // Initialize code templates for each language
        const initialCodeByLanguage = {};
        templateLanguages.forEach(lang => {
          initialCodeByLanguage[lang] = problem.solution_templates[lang] || '';
        });
        setCodeByLanguage(initialCodeByLanguage);
        
        // Set initial language if we don't have one yet or current is invalid
        if (!language || !templateLanguages.includes(language)) {
          // Try to set Python as default, otherwise use first available language
          const defaultLang = templateLanguages.includes('python') ? 'python' : templateLanguages[0] || '';
          setLanguage(defaultLang);
          setCode(problem.solution_templates[defaultLang] || '');
        }
      }
      // Set up reference solutions and solution language.
      if (problem.reference_solutions) {
        const solutionLanguages = Object.keys(problem.reference_solutions);
        setAvailableSolutionLanguages(solutionLanguages);
        
        // Set initial solution language if we don't have one yet or current is invalid
        if (!solutionLanguage || !solutionLanguages.includes(solutionLanguage)) {
          // Try to set Python as default, otherwise use first available language
          const defaultSolutionLang = solutionLanguages.includes('python') ? 'python' : solutionLanguages[0] || '';
          setSolutionLanguage(defaultSolutionLang);
        }
      }
    }
  }, [problem]);

  // Timer effect - handles both count up and count down
  useEffect(() => {
    if (timerStarted) {
      timerIntervalRef.current = setInterval(() => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        
        // Update both timers independently
        setElapsedTime(elapsed);
        setRemainingTime(initialTimerValue - elapsed);
        
      }, 100);
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerStarted, startTime, initialTimerValue]);
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Toggle between stopwatch and countdown modes
  const toggleTimerMode = () => {
    if (timerStarted) {
      setIsCountdown(!isCountdown);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading problem...</div>;
  }

  if (error) {
    return <div className="p-8">Error loading problem: {error.message}</div>;
  }

  if (!problem) {
    return <div className="p-8">Problem not found</div>;
  }

  const handleLanguageChange = (e) => {
    console.log("DEBUG: handleLanguageChange");
    const newLanguage = e.target.value;
    
    // Save current code for the current language
    setCodeByLanguage(prev => ({
      ...prev,
      [language]: code
    }));
    console.log("DEBUG: codeByLanguage", codeByLanguage);
    // Set the new language
    setLanguage(newLanguage);
    
    // Load code for the new language
    setCode(codeByLanguage[newLanguage] || problem.solution_templates[newLanguage] || '// No template available for this language');
  };

  const handleSolutionLanguageChange = (e) => {
    setSolutionLanguage(e.target.value);
  };

  const handleEditorChange = (value) => {
    // Start timer on first keystroke if not already started
    if (!timerStarted) {
      setTimerStarted(true);
      setStartTime(Date.now());
    }
    setCode(value);
  };
  
  // Handle reset button click
  const handleReset = () => {
    // Confirm with the user
    if (!window.confirm('Are you sure you want to reset? This will clear your code changes and timer.')) {
      return;
    }
    // Reset timer state
    setTimerStarted(false);
    setStartTime(null);
    setElapsedTime(0);
    setRemainingTime(initialTimerValue);
    
    // Reset code to original templates
    if (problem?.solution_templates) {
      const initialCodeByLanguage = {};
      Object.keys(problem.solution_templates).forEach(lang => {
        initialCodeByLanguage[lang] = problem.solution_templates[lang] || '';
      });
      setCodeByLanguage(initialCodeByLanguage);
      
      // Reset current code editor to template
      setCode(problem.solution_templates[language] || '');
    }
  };

  const handleRandomProblem = async () => {
    if (!window.confirm('Are you sure you want to abandon this problem?')) {
      return;
    }
    try {
      const response = await api.problems.list();
      if (response?.results?.length > 0) {
        const otherProblems = response.results.filter(p => p.slug !== slug);
        if (otherProblems.length > 0) {
          const randomProblem = otherProblems[Math.floor(Math.random() * otherProblems.length)];
          router.push(`/problems/${randomProblem.slug}`);
        }
      }
    } catch (error) {
      console.error('Failed to fetch problems:', error);
    }
    // Simpler version:
    // router.push('/random_problem');
  };
  
  const handleSubmit = async () => {
    if (!user) {
      setSystemMessage('You have to log in first');
      return;
    }

    console.log("DEBUG: handleSubmit");
    if (!problem || !language || !code) {
      console.error('Missing problem, language, or code');
      return;
    }
    // Switch to submissions tab
    setActiveTab(TABS.SUBMISSIONS);
    try {
      // Submit the code using our hook
      const result = await submitCode({
        problemId: problem.id,
        language: language,
        code: code,
        startTime: startTime
      });
      // Do not reset timer on successful submission
    } catch (error) {
      console.error('Error in submission handler:', error);
    }
  };

  return (
    <div className="h-full w-full overflow-hidden">
      <style jsx global>{`
        /* Custom scrollbar styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${theme === 'dark' ? '#1f2937' : '#f3f4f6'};
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${theme === 'dark' ? '#4b5563' : '#d1d5db'};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${theme === 'dark' ? '#6b7280' : '#9ca3af'};
        }
        
        /* Split panel gutter styling */
        .split-panels > .gutter {
          background-color: ${theme === 'dark' ? '#374151' : '#e5e7eb'};
          border-left: 1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'};
          border-right: 1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'};
          transition: background-color 0.2s ease;
        }
        .split-panels > .gutter:hover {
          background-color: ${theme === 'dark' ? '#3b82f6' : '#1d4ed8'};
          border-left: 1px solid ${theme === 'dark' ? '#60a5fa' : '#3b82f6'};
          border-right: 1px solid ${theme === 'dark' ? '#60a5fa' : '#3b82f6'};
        }
      `}</style>
      <Split 
        className="flex h-full split-panels"
        sizes={[50, 50]} 
        minSize={300}
        gutterSize={8}
        gutterAlign="center"
        direction="horizontal"
      >
        {/* Left Panel - Problem Details with Tabs */}
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === TABS.QUESTION
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab(TABS.QUESTION)}
            >
              Question
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === TABS.SOLUTION
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab(TABS.SOLUTION)}
            >
              Solution
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === TABS.SUBMISSIONS
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab(TABS.SUBMISSIONS)}
            >
              My Submissions
            </button>
            {/* Edit button for staff/admin */}
            {user?.is_staff && (
              <button
                className="ml-auto px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center"
                onClick={() => router.push(`/staff/problems/edit/${slug}`)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </div>
          
          {/* Tab Content */}
          <div className="flex-grow overflow-auto p-4 custom-scrollbar">
            {activeTab === TABS.QUESTION && (
              <div>
                <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{problem.title}</h1>
                <div className="flex gap-2 mb-4">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm">
                    {problem.difficulty || 'Medium'}
                  </span>
                  {problem.tags && problem.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown>
                    {problem.description_md}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            
            {activeTab === TABS.SOLUTION && (
              <div className="prose dark:prose-invert max-w-none">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Reference Solution</h2>
                
                {problem.reference_solutions ? (
                  <>
                    <div className="mb-4">
                      {availableSolutionLanguages.length > 1 ? (
                        <select
                          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white"
                          value={solutionLanguage}
                          onChange={handleSolutionLanguageChange}
                        >
                          {availableSolutionLanguages.map(lang => (
                            <option key={lang} value={lang}>
                              {lang}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded inline-block">
                          Language: {solutionLanguage}
                        </span>
                      )}
                    </div>
                    
                    <div className="h-96 border border-gray-300 dark:border-gray-600 rounded">
                      <Editor
                        height="100%"
                        language={solutionLanguage}
                        value={problem.reference_solutions[solutionLanguage] || '// No solution available for this language'}
                        theme={editorTheme}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          fontSize: 14,
                          tabSize: 2,
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-gray-700 dark:text-gray-300">No reference solutions available for this problem.</p>
                )}
              </div>
            )}
            
            {activeTab === TABS.SUBMISSIONS && (
              <>
                {/* Show pending submission */}
                {pendingSubmission && (
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold mb-2">Current Submission</h2>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                      <div className="flex items-center">
                        <div className="animate-pulse mr-2 h-4 w-4 rounded-full bg-blue-500"></div>
                        <span className="font-semibold">Status: Processing submission...</span>
                      </div>
                      <div className="mt-2">
                        <p><span className="text-gray-600 dark:text-gray-400">Language:</span> {pendingSubmission.language}</p>
                        <p><span className="text-gray-600 dark:text-gray-400">Submitted:</span> {new Date(pendingSubmission.submitted_at).toLocaleTimeString()}</p>
                        <p><span className="text-gray-600 dark:text-gray-400">Duration:</span> {formatTime(pendingSubmission.duration_ms)}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Regular submissions list */}
                <ProblemSubmissionsList problemId={problem.id} />
              </>
            )}
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            {availableLanguages.length > 1 ? (
              <select 
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white"
                value={language}
                onChange={handleLanguageChange}
              >
                {availableLanguages.map(lang => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            ) : (
              <span className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded">
                Language: {language}
              </span>
            )}
            
            {/* Timer Display and Reset Button */}
            <div className="flex items-center gap-2">
              {/* Timer Display */}
              <div 
                className={`px-3 py-2 rounded font-mono text-lg cursor-pointer ${
                  !timerStarted 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' 
                    : remainingTime < 0
                      ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' 
                      : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                }`}
                onClick={toggleTimerMode}
                title="Click to toggle between countdown and stopwatch"
              >
                <div className="flex items-center gap-1">
                  {/* Mode indicator */}
                  <span className="text-xs opacity-70">
                    {!timerStarted ? "" : (isCountdown ? "⏱ COUNT-DOWN " : "⏱ STOP-WATCH ")}
                  </span>
                  
                  {/* Time display */}
                  <span>
                    {!timerStarted 
                      ? formatTime(initialTimerValue)
                      : isCountdown 
                        ? formatTime(remainingTime) 
                        : formatTime(elapsedTime)
                    }
                  </span>
                </div>
              </div>
              
              {/* Reset Button */}
              <button
                className={`px-3 py-2 rounded font-medium text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors ${
                  !timerStarted ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleReset}
                disabled={!timerStarted}
                title="Reset timer and code to initial state"
              >
                Reset Timer
              </button>
              <button
                  onClick={handleRandomProblem}
                  className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm">
                  Next Problem (Random)
              </button>
            </div>
          </div>
          <div className="flex-grow overflow-hidden">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={handleEditorChange}
              theme={editorTheme}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                tabSize: 2,
                automaticLayout: true,
              }}
            />
          </div>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            {systemMessage && (
              <div className="text-sm text-red-500 dark:text-red-400 mr-auto">
                {systemMessage}
              </div>
            )}
            <button 
              className={`px-4 py-2 bg-blue-600 text-white rounded ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleSubmit}
              disabled={isSubmitting || !problem || !language || !code}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </Split>
    </div>
  );
} 