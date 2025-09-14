import React, { useState } from 'react';

function QuestionInput({ onSubmit, disabled }) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim() && !disabled) {
      onSubmit(question);
      setQuestion('');
    }
  };

  return (
    <div className="question-input">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="input-field"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question (e.g., Explain Newton's First Law of Motion)"
          disabled={disabled}
        />
        <button type="submit" className="submit-button" disabled={disabled}>
          {disabled ? 'Processing...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default QuestionInput;