const express = require('express');
const cors = require('cors');
const path = require('path');
const { EventSource } = require('node-event-source');
const { generateResponse } = require('./llm-service');
const { 
  saveQuestion, 
  getQuestions, 
  saveAnswer, 
  getAnswer 
} = require('./data');

const app = express();
const PORT = process.env.PORT || 3001;

// Update the CORS configuration
const whitelist = [
  'http://localhost:3000', 
  'https://vermillion-malasada-a6fa7b.netlify.app/'  // Replace with your actual Netlify URL
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));
app.use(express.json());

// Store connected SSE clients
const clients = [];

// SSE endpoint
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };
  clients.push(newClient);

  req.on('close', () => {
    console.log(`${clientId} Connection closed`);
    clients.splice(clients.indexOf(newClient), 1);
  });
});

// Broadcast to all connected clients
function broadcastEvent(event, data) {
  clients.forEach(client => {
    try {
      client.res.write(`event: ${event}\n`);
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('Error broadcasting to client:', error);
    }
  });
}

// POST /api/questions
app.post('/api/questions', async (req, res) => {
  try {
    const { userId, question } = req.body;
    
    if (!userId || !question) {
      return res.status(400).json({ error: 'userId and question are required' });
    }

    // Save question
    const questionData = saveQuestion(userId, question);
    
    // Broadcast question_created event
    broadcastEvent('question_created', questionData);
    
    // Send to LLM for processing (async)
    generateResponse(question)
      .then(response => {
        // Save answer
        const answerData = saveAnswer(questionData.id, response.text, response.visualization);
        
        // Broadcast answer_created event
        broadcastEvent('answer_created', {
          ...answerData,
          questionId: questionData.id
        });
      })
      .catch(error => {
        console.error('LLM Error:', error);
      });

    res.json({
      questionId: questionData.id,
      answerId: `a_${questionData.id.split('_')[1]}`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/questions
app.get('/api/questions', (req, res) => {
  const questions = getQuestions();
  res.json(questions);
});

// GET /api/answers/:id
app.get('/api/answers/:id', (req, res) => {
  const answer = getAnswer(req.params.id);
  if (!answer) {
    return res.status(404).json({ error: 'Answer not found' });
  }
  res.json(answer);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});