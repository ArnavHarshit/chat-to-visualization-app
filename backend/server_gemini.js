const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const EventEmitter = require('events');
const { OpenAI } = require('openai');

const app = express();
const PORT = 5000;
const eventEmitter = new EventEmitter();

// --- Configuration ---
// Replace with your actual OpenAI API Key.
// Store this securely, e.g., in an environment variable.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY'
});

// Mock data store for simplicity. In a real app, use a database.
const questions = [];
const answers = {};

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());

// --- LLM Service Function ---
// This function simulates the LLM's role.
const getLLMResponse = async (question) => {
  console.log(`Sending question to LLM: "${question}"`);

  // This is a simplified logic. In a real-world scenario, you'd
  // use a more sophisticated prompt to get structured JSON.
  // We'll use a hardcoded map for the demo to ensure correct output.
  const predefinedResponses = {
    "explain newton's first law of motion": {
      "text": "Newton’s First Law states that an object at rest will stay at rest, and an object in motion will stay in motion with the same speed and in the same direction, unless acted upon by an external force.",
      "visualization": {
        "id": "vis_001",
        "duration": 4000,
        "fps": 30,
        "layers": [
          {
            "id": "ball1",
            "type": "circle",
            "props": { "x": 100, "y": 200, "r": 20, "fill": "#3498db" },
            "animations": [
              { "property": "x", "from": 100, "to": 400, "start": 0, "end": 3000 }
            ]
          },
          {
            "id": "arrow1",
            "type": "arrow",
            "props": { "x": 90, "y": 200, "dx": 30, "dy": 0, "color": "#e74c3c" },
            "animations": []
          }
        ]
      }
    },
    "explain the solar system": {
      "text": "The Solar System consists of the Sun at the center with planets orbiting around it due to gravitational pull.",
      "visualization": {
        "id": "vis_999",
        "duration": 6000,
        "fps": 30,
        "layers": [
          { "id": "sun", "type": "circle", "props": { "x": 300, "y": 300, "r": 40, "fill": "#f39c12" }, "animations": [] },
          { "id": "earth", "type": "circle", "props": { "x": 200, "y": 300, "r": 15, "fill": "#3498db" },
            "animations": [
              { "property": "orbit", "centerX": 300, "centerY": 300, "radius": 100, "duration": 6000 }
            ]
          }
        ]
      }
    },
    "explain photosynthesis": {
      "text": "Photosynthesis is the process used by plants, algae and certain bacteria to turn light energy into chemical energy, in the form of glucose or sugar.",
      "visualization": {
        "id": "vis_333",
        "duration": 5000,
        "fps": 30,
        "layers": [
          { "id": "leaf", "type": "rect", "props": { "x": 200, "y": 250, "width": 150, "height": 80, "fill": "#27ae60" }, "animations": [] },
          { "id": "sunlight", "type": "line", "props": { "x1": 50, "y1": 50, "x2": 250, "y2": 250, "color": "#f1c40f" }, "animations": [
              { "property": "x2", "from": 250, "to": 300, "start": 0, "end": 2000 },
              { "property": "y2", "from": 250, "to": 300, "start": 0, "end": 2000 }
            ]
          },
          { "id": "water", "type": "arrow", "props": { "x": 270, "y": 400, "dx": 0, "dy": -50, "color": "#3498db" }, "animations": [
              { "property": "y", "from": 400, "to": 330, "start": 1000, "end": 3000 }
            ]
          },
          { "id": "glucose", "type": "circle", "props": { "x": 350, "y": 290, "r": 10, "fill": "#e74c3c" }, "animations": [
              { "property": "r", "from": 0, "to": 10, "start": 3000, "end": 3500 }
            ]
          }
        ]
      }
    }
  };

  const normalizedQuestion = question.toLowerCase().trim();
  if (predefinedResponses[normalizedQuestion]) {
    return predefinedResponses[normalizedQuestion];
  } else {
    // Fallback to a simple, non-visual response for unknown questions
    return {
      "text": "I'm sorry, I don't have a specific visualization for that question yet. But I can explain it!",
      "visualization": { "id": "vis_fallback", "duration": 1000, "fps": 1, "layers": [] }
    };
  }
};

// --- API Endpoints ---

// 1. POST /api/questions
app.post('/api/questions', async (req, res) => {
  const { userId, question } = req.body;
  if (!question) {
    return res.status(400).send({ error: 'Question is required.' });
  }

  const questionId = `q_${Date.now()}`;
  const answerId = `a_${Date.now()}`;

  const newQuestion = { id: questionId, userId, question, answerId };
  questions.push(newQuestion);

  // Broadcast the new question via SSE
  eventEmitter.emit('question_created', newQuestion);
  console.log(`Question submitted: ${questionId}`);

  // Don't wait for the LLM response to send the initial response.
  res.status(202).json({ questionId, answerId });

  // Now, process the question with the LLM in the background.
  try {
    const llmResponse = await getLLMResponse(question);
    const newAnswer = { id: answerId, ...llmResponse };
    answers[answerId] = newAnswer;

    // Broadcast the new answer via SSE
    eventEmitter.emit('answer_created', newAnswer);
    console.log(`Answer created: ${answerId}`);
  } catch (error) {
    console.error('Error getting LLM response:', error);
    // In a production app, handle this error more gracefully.
  }
});

// 2. GET /api/questions
app.get('/api/questions', (req, res) => {
  res.json(questions);
});

// 3. GET /api/answers/:id
app.get('/api/answers/:id', (req, res) => {
  const answer = answers[req.params.id];
  if (answer) {
    res.json(answer);
  } else {
    res.status(404).send({ error: 'Answer not found.' });
  }
});

// 4. GET /api/stream
app.get('/api/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const onQuestionCreated = (question) => {
    sendEvent('question_created', question);
  };
  const onAnswerCreated = (answer) => {
    sendEvent('answer_created', answer);
  };

  eventEmitter.on('question_created', onQuestionCreated);
  eventEmitter.on('answer_created', onAnswerCreated);

  req.on('close', () => {
    eventEmitter.off('question_created', onQuestionCreated);
    eventEmitter.off('answer_created', onAnswerCreated);
    console.log('SSE connection closed.');
  });
});

app.listen(PORT, () => {
  console.log(`Backend server listening at http://localhost:${PORT}`);
});