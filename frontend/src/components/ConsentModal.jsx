import { useState } from 'react';
import './ConsentModal.css';

const ConsentModal = ({ onAccept, onDecline }) => {
  const [readMore, setReadMore] = useState(false);

  return (
    <div className="consent-modal-overlay">
      <div className="consent-modal">
        <h2>Data Collection Consent</h2>
        <div className="consent-content">
          <p>
            Before you begin the fatigue assessment, please read and accept our data collection policy.
          </p>
          
          <div className="consent-section">
            <h3>What we collect:</h3>
            <ul>
              <li>Questionnaire answers (sleep hours, energy level, stress level)</li>
              <li>Typing latency measurements</li>
              <li>Reaction time test results</li>
              <li>Optional user ID (no personally identifiable information)</li>
            </ul>
          </div>

          {readMore && (
            <div className="consent-section">
              <h3>How we use your data:</h3>
              <ul>
                <li>To calculate your fatigue score and provide recommendations</li>
                <li>To improve our fatigue prediction model (anonymized)</li>
                <li>Stored securely in JSONL format for research purposes</li>
              </ul>
              
              <h3>Your privacy:</h3>
              <ul>
                <li>No personal information (name, email, phone) is collected</li>
                <li>Optional user ID is used only for session tracking</li>
                <li>Data is stored locally in development environment</li>
              </ul>
            </div>
          )}

          <button 
            className="read-more-button"
            onClick={() => setReadMore(!readMore)}
          >
            {readMore ? 'Show less' : 'Read more'}
          </button>
        </div>

        <div className="consent-actions">
          <button 
            className="decline-button"
            onClick={onDecline}
          >
            Decline
          </button>
          <button 
            className="accept-button"
            onClick={onAccept}
          >
            I Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;

