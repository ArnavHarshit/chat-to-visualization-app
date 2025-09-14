import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import QuestionInput from './components/QuestionInput';
import ChatPanel from './components/ChatPanel';
import VisualizationCanvas from './components/VisualizationCanvas';
import Controls from './components/Controls';
import './App.css';

// Use environment variable for API base URL or fallback to localhost
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

function App() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentVisualization, setCurrentVisualization] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    // Fetch initial questions
    fetchQuestions();
    
    // Set up SSE connection
    setupSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${API_BASE}/questions`);
      setQuestions(response.data);
      
      // Fetch answers for each question
      response.data.forEach(async (question) => {
        if (question.answerId) {
          try {
            const answerResponse = await axios.get(`${API_BASE}/answers/${question.answerId}`);
            setAnswers(prev => ({
              ...prev,
              [question.id]: answerResponse.data
            }));
          } catch (error) {
            console.error('Error fetching answer:', error);
          }
        }
      });
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to load questions. Please refresh the page.');
    }
  };

  const setupSSE = () => {
    try {
      eventSourceRef.current = new EventSource(`${API_BASE}/stream`);
      
      eventSourceRef.current.addEventListener('question_created', (event) => {
        const question = JSON.parse(event.data);
        setQuestions(prev => [...prev, question]);
        setLoading(true);
        setError(null);
      });
      
      eventSourceRef.current.addEventListener('answer_created', async (event) => {
        const answerData = JSON.parse(event.data);
        setAnswers(prev => ({
          ...prev,
          [answerData.questionId]: answerData
        }));
        setLoading(false);
      });
      
      eventSourceRef.current.onerror = (error) => {
        console.error('SSE error:', error);
        setLoading(false);
        setError('Connection error. Please check if the server is running.');
      };
    } catch (error) {
      console.error('Error setting up SSE:', error);
      setError('Failed to connect to the server. Please check if the server is running.');
    }
  };

  const handleQuestionSubmit = async (questionText) => {
    try {
      setLoading(true);
      setError(null);
      await axios.post(`${API_BASE}/questions`, {
        userId: 'user1',
        question: questionText
      });
    } catch (error) {
      console.error('Error submitting question:', error);
      setLoading(false);
      setError('Failed to submit question. Please try again.');
    }
  };

  const handleSelectQuestion = (questionId) => {
    const answer = answers[questionId];
    if (answer && answer.visualization) {
      setCurrentVisualization(answer.visualization);
      setIsPlaying(false);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const handleRetry = () => {
    setError(null);
    fetchQuestions();
    setupSSE();
  };

  return (
    <div className="app">
      <div className="visualization-panel">
        <VisualizationCanvas 
          visualization={currentVisualization} 
          isPlaying={isPlaying}
        />
        <Controls 
          isPlaying={isPlaying} 
          onPlayPause={handlePlayPause} 
        />
      </div>
      <div className="chat-panel">
        <QuestionInput onSubmit={handleQuestionSubmit} disabled={loading} />
        {loading && <div className="loading">Generating response...</div>}
        {error && (
          <div className="error">
            {error}
            <button onClick={handleRetry} className="retry-button">Retry</button>
          </div>
        )}
        <ChatPanel 
          questions={questions} 
          answers={answers} 
          onSelectQuestion={handleSelectQuestion}
        />
      </div>
    </div>
  );
}

export default App;