import { useState, useEffect, useRef } from 'react';
import './ReactionTime.css';

const ReactionTime = ({ onComplete }) => {
  const [isWaiting, setIsWaiting] = useState(false);
  const [canClick, setCanClick] = useState(false);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [currentTest, setCurrentTest] = useState(0);
  const [showWait, setShowWait] = useState(false);
  const waitTimeoutRef = useRef(null);
  const startTimeRef = useRef(null);
  const TOTAL_TESTS = 3;

  const handleStart = () => {
    setCurrentTest(0);
    setReactionTimes([]);
    startNextTest();
  };

  const startNextTest = () => {
    setIsWaiting(true);
    setCanClick(false);
    setShowWait(true);

    // Random delay between 2-5 seconds
    const delay = 2000 + Math.random() * 3000;

    waitTimeoutRef.current = setTimeout(() => {
      setIsWaiting(false);
      setCanClick(true);
      setShowWait(false);
      startTimeRef.current = Date.now();
    }, delay);
  };

  const handleClick = () => {
    if (!canClick) return;

    const reactionTime = Date.now() - startTimeRef.current;
    setCanClick(false);
    setCurrentTest((prev) => prev + 1);

    setReactionTimes((prev) => {
      const allTimes = [...prev, reactionTime];
      
      if (allTimes.length >= TOTAL_TESTS) {
        // All tests completed
        setTimeout(() => {
          const averageReactionTime = allTimes.reduce((a, b) => a + b, 0) / allTimes.length;
          onComplete({
            task_performance: {
              reaction_time_ms: averageReactionTime,
              reaction_times: allTimes,
            }
          });
        }, 500);
      } else {
        // Continue to next test
        setTimeout(() => {
          startNextTest();
        }, 1000);
      }
      
      return allTimes;
    });
  };

  useEffect(() => {
    return () => {
      if (waitTimeoutRef.current) {
        clearTimeout(waitTimeoutRef.current);
      }
    };
  }, []);

  const isComplete = reactionTimes.length >= TOTAL_TESTS;

  return (
    <div className="reaction-time-container">
      <h2>Reaction Time Test</h2>
      <p className="subtitle">Click the button when it turns green (Test {currentTest + 1}/{TOTAL_TESTS})</p>

      {reactionTimes.length === 0 && !isWaiting && (
        <button onClick={handleStart} className="start-button">
          Start Test
        </button>
      )}

      <div className="reaction-area">
        {isWaiting && showWait && (
          <button className="wait-button" disabled>
            Wait for green...
          </button>
        )}
        {canClick && (
          <button
            onClick={handleClick}
            className="click-button"
            autoFocus
          >
            Click Now!
          </button>
        )}
        {!isWaiting && !canClick && reactionTimes.length > 0 && reactionTimes.length < TOTAL_TESTS && (
          <div className="between-tests">
            <p>Reaction time: {reactionTimes[reactionTimes.length - 1]} ms</p>
            <p>Next test starting...</p>
          </div>
        )}
        {isComplete && (
          <div className="results">
            <p className="success-message">✓ All tests completed!</p>
            <p>Average reaction time: {(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length).toFixed(2)} ms</p>
          </div>
        )}
      </div>

      {reactionTimes.length > 0 && !isComplete && (
        <div className="test-results">
          <p>Previous results:</p>
          <ul>
            {reactionTimes.map((time, index) => (
              <li key={index}>Test {index + 1}: {time} ms</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReactionTime;

