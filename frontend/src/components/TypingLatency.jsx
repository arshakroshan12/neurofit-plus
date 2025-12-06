import { useState, useEffect, useRef } from 'react';
import './TypingLatency.css';

const TypingLatency = ({ onComplete }) => {
  const [isActive, setIsActive] = useState(false);
  const [text, setText] = useState('');
  const [targetText] = useState('The quick brown fox jumps over the lazy dog');
  const [startTime, setStartTime] = useState(null);
  const [latencies, setLatencies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const inputRef = useRef(null);

  const handleStart = () => {
    setIsActive(true);
    setStartTime(Date.now());
    setText('');
    setCurrentIndex(0);
    setLatencies([]);
    setCompleted(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    const now = Date.now();

    if (!isActive || !startTime) return;

    if (value.length > text.length) {
      // Key was pressed
      const keyPressTime = now - startTime - (latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) : 0);
      if (value.length > 1) {
        setLatencies((prev) => [...prev, keyPressTime]);
      }
    }

    setText(value);

    // Check if completed
    if (value === targetText) {
      setCompleted(true);
      setIsActive(false);
      const totalTime = now - startTime;
      const averageLatency = latencies.length > 0 
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
        : totalTime / targetText.length;
      
      // Calculate accuracy (correct characters / total characters)
      let correctChars = 0;
      for (let i = 0; i < Math.min(value.length, targetText.length); i++) {
        if (value[i] === targetText[i]) {
          correctChars++;
        }
      }
      const accuracy = correctChars / targetText.length;

      onComplete({
        typing_features: {
          average_latency_ms: averageLatency,
          total_duration_ms: totalTime,
          accuracy: accuracy,
        }
      });
    }
  };

  useEffect(() => {
    if (completed && inputRef.current) {
      inputRef.current.blur();
    }
  }, [completed]);

  return (
    <div className="typing-latency-container">
      <h2>Typing Latency Test</h2>
      <p className="subtitle">Type the text below as quickly and accurately as possible</p>
      
      {!isActive && !completed && (
        <button onClick={handleStart} className="start-button">
          Start Test
        </button>
      )}

      {isActive && (
        <div className="typing-test">
          <div className="target-text">
            {targetText.split('').map((char, index) => (
              <span
                key={index}
                className={
                  index < text.length
                    ? text[index] === char
                      ? 'correct'
                      : 'incorrect'
                    : index === text.length
                    ? 'current'
                    : 'pending'
                }
              >
                {char}
              </span>
            ))}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleChange}
            className="typing-input"
            disabled={completed}
            placeholder="Start typing..."
          />
        </div>
      )}

      {completed && (
        <div className="results">
          <p className="success-message">✓ Test completed!</p>
          <p>Average latency: {(latencies.length > 0 
            ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
            : 0).toFixed(2)} ms</p>
        </div>
      )}
    </div>
  );
};

export default TypingLatency;

