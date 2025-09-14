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

app.use(cors());
app.use(express.json());

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // The "catchall" handler: for any request that doesn't
  // match one above, send back React's index.html file.
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// Store connected SSE clients
const clients = [];

// SSE endpoint
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
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
    client.res.write(`event: ${event}\n`);
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});