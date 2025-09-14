import React from 'react';

function ChatPanel({ questions, answers, onSelectQuestion }) {
  return (
    <div className="chat-history">
      {questions.map((question) => (
        <div key={question.id}>
          <div 
            className="message user-message"
            onClick={() => onSelectQuestion(question.id)}
            style={{ cursor: 'pointer' }}
          >
            {question.question}
          </div>
          {answers[question.id] && (
            <div className="message bot-message">
              {answers[question.id].text}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ChatPanel;