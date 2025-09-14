require("dotenv").config();
const { OpenAI } = require('openai');

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateResponse(question) {
  try {
    const prompt = `
    You are a helpful assistant that explains concepts with both text and visualizations.
    When given a concept, you must return a JSON object with two fields:
    1. "text": a string containing a clear explanation of the concept.
    2. "visualization": a JSON object that follows this schema:
        {
          "id": "string",
          "duration": number,
          "fps": number,
          "layers": [
            {
              "id": "string",
              "type": "string", // one of: "circle", "rectangle", "arrow", "line", "text"
              "props": { ... }, // properties for the shape
              "animations": [ // array of animations
                {
                  "property": "string", // which property to animate
                  "from": number, // starting value
                  "to": number, // ending value
                  "start": number, // start time in ms
                  "end": number // end time in ms
                }
              ]
            }
          ]
        }

    Example visualization for Newton's First Law:
    {
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

    Now, explain the following concept: ${question}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant that explains concepts with both text and visualizations. Always return a valid JSON object with 'text' and 'visualization' fields." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0].message.content;
    
    // Extract JSON from the response (it might be wrapped in markdown code blocks)
    let jsonString = responseText;
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/```([\s\S]*?)```/);
    
    if (jsonMatch) {
      jsonString = jsonMatch[1] || jsonMatch[0];
    }
    
    const response = JSON.parse(jsonString);
    return response;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    
    // Fallback to mock responses if API call fails
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes("newton") || lowerQuestion.includes("first law") || lowerQuestion.includes("inertia")) {
      return {
        text: "Newton's First Law of Motion, also known as the Law of Inertia, states that an object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.",
        visualization: {
          id: "vis_001",
          duration: 4000,
          fps: 30,
          layers: [
            {
              id: "ball1",
              type: "circle",
              props: { x: 100, y: 200, r: 20, fill: "#3498db" },
              animations: [
                { property: "x", from: 100, to: 400, start: 0, end: 3000 }
              ]
            },
            {
              id: "arrow1",
              type: "arrow",
              props: { x: 90, y: 200, dx: 30, dy: 0, color: "#e74c3c" },
              animations: []
            }
          ]
        }
      };
    } else if (lowerQuestion.includes("solar system") || lowerQuestion.includes("planet")) {
      return {
        text: "The Solar System consists of the Sun at the center with planets orbiting around it due to gravitational pull. The eight planets are Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.",
        visualization: {
          id: "vis_999",
          duration: 6000,
          fps: 30,
          layers: [
            { 
              id: "sun", 
              type: "circle", 
              props: { x: 300, y: 300, r: 40, fill: "#f39c12" }, 
              animations: [] 
            },
            { 
              id: "earth", 
              type: "circle", 
              props: { x: 200, y: 300, r: 15, fill: "#3498db" },
              animations: [
                { 
                  property: "orbit", 
                  centerX: 300, 
                  centerY: 300, 
                  radius: 100, 
                  start: 0, 
                  end: 6000 
                }
              ]
            }
          ]
        }
      };
    } else {
      return {
        text: "I'm not sure how to visualize that concept. Please try asking about physics concepts, astronomy, or biology.",
        visualization: {
          id: "vis_default",
          duration: 1000,
          fps: 30,
          layers: [
            {
              id: "defaultText",
              type: "text",
              props: { x: 150, y: 150, text: "No visualization available", color: "#000000", size: 16 },
              animations: []
            }
          ]
        }
      };
    }
  }
}

module.exports = { generateResponse };