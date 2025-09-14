# Chat-to-Visualization App

A web application that explains concepts with both text and visualizations. Users can ask questions, and the system provides explanations along with interactive visualizations.

## Features

- Real-time chat interface
- Interactive visualizations
- Play/Pause controls for animations
- Server-Sent Events for real-time updates
- Responsive design

## Demo

Live demo: [Your deployed app URL]

## Installation

1. Clone the repository:

   git clone https://github.com/your-username/chat-to-visualization-app.git
   cd chat-to-visualization-app

2. Install backend dependencies:

    cd backend
    npm install

3. Install frontend dependencies:

    cd ../frontend
    npm install

4. Start the backend server:

    cd ../backend
    npm run dev

5. Start the frontend development server:

    cd ../frontend
    npm start
    Open your browser and navigate to http://localhost:3000

# Usage
1. Type a question in the input field (e.g., "Explain Newton's First Law of Motion")
2. Press Send or hit Enter
3. View the text explanation in the chat panel
4. Click on any question to view its visualization
5. Use the Play/Pause button to control the animation

# Technology Stack
1. Frontend: React.js
2. Backend: Node.js with Express
3. Real-time Communication: Server-Sent Events (SSE)
4. Deployment: Heroku (backend), Netlify (frontend)

# Project Structure

chat-to-visualization-app/
├── backend/
│   ├── server.js          # Express server
│   ├── llm-service.js     # Mock LLM service
│   ├── data.js           # In-memory data storage
│   └── package.json      # Backend dependencies
├── frontend/
│   ├── public/           # Static files
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── App.js       # Main App component
│   │   └── index.js     # Entry point
│   └── package.json     # Frontend dependencies
└── README.md            # Project documentation

# API Endpoints
1. POST /api/questions - Submit a new question
2. GET /api/questions - Get all questions
3. GET /api/answers/:id - Get answer by ID
4. GET /api/stream - SSE endpoint for real-time updates

# Contributing
1. Fork the repository
2. Create a feature branch: git checkout -b feature-name
3. Commit your changes: git commit -m 'Add some feature'
4. Push to the branch: git push origin feature-name
5. Submit a pull request

# License
This project is licensed under the MIT License.
