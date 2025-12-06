import { useState } from 'react';
import './Questionnaire.css';

const Questionnaire = ({ onComplete }) => {
  const [answers, setAnswers] = useState({
    sleep_hours: '',
    energy_level: '',
    stress_level: '',
  });

  const [errors, setErrors] = useState({});

  const questions = [
    {
      id: 'sleep_hours',
      text: 'How many hours of sleep did you get last night?',
      type: 'number',
      min: 0,
      max: 24,
      step: 0.5,
    },
    {
      id: 'energy_level',
      text: 'Rate your current energy level (0-10, where 0 is exhausted and 10 is fully energized):',
      type: 'number',
      min: 0,
      max: 10,
      step: 1,
    },
    {
      id: 'stress_level',
      text: 'How would you rate your stress level today? (0-10, where 0 is no stress and 10 is extremely stressed):',
      type: 'number',
      min: 0,
      max: 10,
      step: 1,
    },
  ];

  const validateInput = (id, value) => {
    const numValue = parseFloat(value);
    const question = questions.find(q => q.id === id);
    
    if (value === '' || isNaN(numValue)) {
      return `${question.text} is required`;
    }
    
    if (numValue < question.min || numValue > question.max) {
      return `Please enter a value between ${question.min} and ${question.max}`;
    }
    
    return null;
  };

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    
    // Clear error for this field
    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all inputs
    const newErrors = {};
    let isValid = true;
    
    questions.forEach((question) => {
      const error = validateInput(question.id, answers[question.id]);
      if (error) {
        newErrors[question.id] = error;
        isValid = false;
      }
    });
    
    if (!isValid) {
      setErrors(newErrors);
      return;
    }
    
    // Format answers as session schema expects
    const formattedAnswers = questions.map((question) => ({
      question_id: question.id,
      value: parseFloat(answers[question.id]),
    }));
    
    onComplete(formattedAnswers);
  };

  const allAnswered = answers.sleep_hours && answers.energy_level && answers.stress_level;

  return (
    <div className="questionnaire-container">
      <h2>Questionnaire</h2>
      <p className="subtitle">Please answer the following questions</p>
      <form onSubmit={handleSubmit} className="questionnaire-form">
        {questions.map((question) => (
          <div key={question.id} className="question-item">
            <label htmlFor={question.id} className="question-label">
              {question.text}
            </label>
            <input
              id={question.id}
              type={question.type}
              min={question.min}
              max={question.max}
              step={question.step}
              value={answers[question.id]}
              onChange={(e) => handleChange(question.id, e.target.value)}
              className={`question-input ${errors[question.id] ? 'error' : ''}`}
              required
            />
            {errors[question.id] && (
              <span className="error-message">{errors[question.id]}</span>
            )}
          </div>
        ))}
        <button
          type="submit"
          className="submit-button"
          disabled={!allAnswered}
        >
          Continue
        </button>
      </form>
    </div>
  );
};

export default Questionnaire;
