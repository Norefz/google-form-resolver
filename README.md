# Google Form Resolver

A Chrome extension that automatically answers Google Forms using Google Gemini AI.

## Features

- **Automatic Form Filling**: Uses Google Gemini AI to answer multiple choice and essay questions
- **Daily Quota**: 50 free responses per day
- **User Identification**: Displays your Google account info
- **Progress Tracking**: Shows solved count and remaining quota

## Tech Stack

- **Frontend**: Chrome Extension (popup.js, content.js, popup.html)
- **Backend**: Node.js + Express
- **AI**: Google Generative AI (Gemini)

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. Configure API key\*\*:
   - Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a `.env` file:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

3. **Start the server**:

   ```bash
   node server.js
   ```

4. **Load the extension**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project folder

5. **Check AI MODEL**:
   ```bash
   node check_module.js
   ```

## Usage

1. Open any Google Form
2. Click the extension icon in your browser
3. Click "Solve All" to auto-fill all questions

## API Endpoints

- `GET /api/stats` - Get current quota status
- `POST /api/solve` - Solve a question (body: `{ question, options }`)
