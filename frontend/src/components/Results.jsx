import './Results.css';

const Results = ({ data, onReset }) => {
  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low':
        return '#10b981'; // green
      case 'medium':
        return '#f59e0b'; // yellow
      case 'high':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  return (
    <div className="results-container">
      <h2>Fatigue Assessment Results</h2>
      
      <div className="score-card">
        <div className="score-value">{data.fatigue_score?.toFixed(1)}</div>
        <div className="score-label">Fatigue Score</div>
        <div
          className="risk-badge"
          style={{ backgroundColor: getRiskColor(data.risk_level) }}
        >
          {data.risk_level?.toUpperCase()} RISK
        </div>
      </div>

      <div className="recommendations-section">
        <h3>Recommendations</h3>
        <ul className="recommendations-list">
          {data.recommendations?.map((rec, index) => (
            <li key={index}>{rec}</li>
          ))}
        </ul>
      </div>

      <div className="timestamp">
        <p>Assessment completed: {new Date(data.timestamp).toLocaleString()}</p>
        {data.model_used && (
          <p className="model-info">Model used: {data.model_used === 'ml_model' ? 'ML Model' : 'Heuristic'}</p>
        )}
      </div>

      <button onClick={onReset} className="reset-button">
        Start New Assessment
      </button>
    </div>
  );
};

export default Results;

