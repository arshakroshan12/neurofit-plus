/**
 * NeuroFit+ Frontend App
 * 
 * Main application component orchestrating questionnaire, typing, and reaction tests.
 */
import { useState, useEffect } from 'react';
import Questionnaire from './components/Questionnaire';
import TypingLatency from './components/TypingLatency';
import ReactionTime from './components/ReactionTime';
import Results from './components/Results';
import ConsentModal from './components/ConsentModal';
import { predictFatigue, saveSession } from './api';
import './App.css';

const STEPS = {
  CONSENT: 'consent',
  QUESTIONNAIRE: 'questionnaire',
  TYPING: 'typing',
  REACTION: 'reaction',
  RESULTS: 'results',
  LOADING: 'loading',
  ERROR: 'error',
};

function App() {
  const [currentStep, setCurrentStep] = useState(STEPS.CONSENT);
  const [consentGiven, setConsentGiven] = useState(false);
  const [sessionData, setSessionData] = useState({
    user_id: null, // Optional - can be set later
    timestamp: new Date().toISOString(),
    answers: [],
    typing_features: null,
    task_performance: null,
  });
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Update timestamp when step changes
    if (currentStep !== STEPS.CONSENT && currentStep !== STEPS.RESULTS) {
      setSessionData(prev => ({
        ...prev,
        timestamp: new Date().toISOString(),
      }));
    }
  }, [currentStep]);

  const handleConsentAccept = () => {
    setConsentGiven(true);
    setCurrentStep(STEPS.QUESTIONNAIRE);
  };

  const handleConsentDecline = () => {
    alert('You must accept the data collection policy to use this application.');
    setCurrentStep(STEPS.CONSENT);
  };

  const handleQuestionnaireComplete = (answers) => {
    setSessionData(prev => ({
      ...prev,
      answers: answers,
    }));
    setCurrentStep(STEPS.TYPING);
  };

  const handleTypingComplete = (typingFeatures) => {
    setSessionData(prev => ({
      ...prev,
      typing_features: typingFeatures,
    }));
    setCurrentStep(STEPS.REACTION);
  };

  const handleReactionComplete = async (taskPerformance) => {
    const completeSessionData = {
      ...sessionData,
      task_performance: taskPerformance,
      timestamp: new Date().toISOString(),
    };
    
    setSessionData(completeSessionData);
    setCurrentStep(STEPS.LOADING);

    try {
      // First, save session data
      try {
        await saveSession(completeSessionData);
        console.log('Session data saved successfully');
      } catch (saveError) {
        console.warn('Failed to save session data:', saveError);
        // Continue even if save fails
      }

      // Then, get fatigue prediction
      const response = await predictFatigue(completeSessionData);
      setResults(response);
      setCurrentStep(STEPS.RESULTS);
    } catch (err) {
      setError(err.message || 'An error occurred while processing your data');
      setCurrentStep(STEPS.ERROR);
    }
  };

  const handleReset = () => {
    setCurrentStep(STEPS.CONSENT);
    setConsentGiven(false);
    setSessionData({
      user_id: null,
      timestamp: new Date().toISOString(),
      answers: [],
      typing_features: null,
      task_performance: null,
    });
    setResults(null);
    setError(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>NeuroFit+</h1>
        <p>Fatigue Assessment Tool</p>
      </header>

      <main className="app-main">
        {currentStep === STEPS.CONSENT && (
          <ConsentModal 
            onAccept={handleConsentAccept}
            onDecline={handleConsentDecline}
          />
        )}

        {currentStep === STEPS.QUESTIONNAIRE && (
          <Questionnaire onComplete={handleQuestionnaireComplete} />
        )}

        {currentStep === STEPS.TYPING && (
          <TypingLatency onComplete={handleTypingComplete} />
        )}

        {currentStep === STEPS.REACTION && (
          <ReactionTime onComplete={handleReactionComplete} />
        )}

        {currentStep === STEPS.LOADING && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Analyzing your data...</p>
          </div>
        )}

        {currentStep === STEPS.ERROR && (
          <div className="error-container">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={handleReset} className="retry-button">
              Start Over
            </button>
          </div>
        )}

        {currentStep === STEPS.RESULTS && results && (
          <Results data={results} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}

export default App;
