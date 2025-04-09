# WanderAI - Intelligent Travel Planning Assistant

WanderAI is an intelligent travel planning system that helps users find the perfect vacation destination based on their preferences. It uses AI to analyze user preferences and provide personalized travel recommendations.

## Features

- Interactive questionnaire to gather travel preferences
- AI-powered destination recommendations
- Real-time flight search integration
- Personalized activity and accommodation suggestions
- Group-specific travel planning
- Safety ratings and considerations

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [Ollama](https://ollama.ai/) (for running the Mistral model locally)
- A modern web browser

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TravelRecommender
   ```

2. **Install Ollama and the Mistral model**
   ```bash
   # Install Ollama (follow instructions on https://ollama.ai/)
   # Then pull the Mistral model
   ollama pull mistral
   ```

3. **Start Ollama**
   ```bash
   ollama serve
   ```

4. **Install Node.js dependencies**
   ```bash
   npm install
   ```

5. **Configure environment variables**
   Create a `.env` file in the root directory with the following content:
   ```
   PORT=3000
   OLLAMA_API_URL=http://localhost:11434/api/generate
   OPENSKY_USERNAME=your_opensky_username
   OPENSKY_PASSWORD=your_opensky_password
   ```

## Running the Application

1. **Start the backend server**
   ```bash
   npm start
   ```
   The server will start on http://localhost:3000

2. **Open the frontend**
   - Open `index.html` in your web browser
   - Or use a local server (e.g., VS Code Live Server)

## Development

- **Frontend**: The main application is in `index.html`
- **Backend**: The server code is in `server.js`
- **Dependencies**: Managed in `package.json`

## API Integration

The application uses:
- OpenSky API for flight data
- Ollama with Mistral model for:
  - Airport code lookups
  - Destination recommendations
  - Activity suggestions
  - Safety analysis

## Troubleshooting

Common issues and solutions:

1. **CORS Errors**
   - Ensure the backend server is running
   - Check that the frontend is being served from the correct origin

2. **Ollama Connection Issues**
   - Verify Ollama is running (`ollama serve`)
   - Check that the Mistral model is installed (`ollama list`)

3. **OpenSky API Errors**
   - Verify your OpenSky credentials in the `.env` file
   - Check the API rate limits

4. **Server Connection Refused**
   - Ensure the server is running on port 3000
   - Check for any port conflicts

## Logging

The application includes comprehensive logging:
- API requests and responses
- Ollama interactions
- Error tracking
- User preference processing

Logs can be viewed in:
- Browser console (frontend)
- Terminal (backend)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 