<div align="center">
  <div style="background-color: #4f46e5; padding: 1.5rem; border-radius: 1rem; display: inline-block; margin-bottom: 1rem;">
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
  </div>
  <h1>EduGuide AI</h1>
  <p>Your personalized, AI-powered educational mentor.</p>
</div>

---

## 🌟 Overview

EduGuide AI is an interactive learning companion built with React, Vite, and the **Google Gemini API**. Designed for both students and parents, it adapts its teaching style, complexity, and analogies based on your specific learning profile. Whether you need a high-level roadmap, a deep dive into complex topics, or a hands-free voice conversation, EduGuide AI acts as your personal tutor.

## ✨ Key Features

- **🎯 Personalized Learning Profiles:** Choose your role (Student or Parent), specify the target age/grade, pick a topic, and set your current understanding level to receive perfectly tailored explanations.
- **💬 Intelligent Chat Interface:** A responsive, markdown-supported chat interface powered by Gemini. Ask questions, request examples, and explore topics deeply.
- **🗺️ Automated Roadmaps:** Generate high-level, step-by-step learning roadmaps for any topic with a single click.
- **🎙️ Real-time Voice Chat:** Experience natural, low-latency, two-way audio conversations using the **Gemini 2.5 Flash Native Audio Dialog** API via WebSockets. Hands-free learning has never been easier!
- **🗣️ Integrated Speech-to-Text & Text-to-Speech:** Use voice dictation in the standard chat, and listen to EduGuide's responses aloud using browser-native speech synthesis.
- **💾 Save & Refine Guides:** Turn any helpful AI response into a beautifully formatted Markdown study guide. Save them locally, attach them as context for future chats, and review them anytime.
- **📊 Rich Renderings:** Supports LaTeX math equations, Mermaid diagrams, tables, and syntax-highlighted code blocks.
- **📱 Mobile-First Design:** A sleek, fully responsive UI that works perfectly on desktop browsers and mobile devices alike.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A **Google Gemini API Key**. You can get one from [Google AI Studio](https://aistudio.google.com/).

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd EduGuide-AI
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5173` (or the port specified by Vite) to start learning!

## 🛠️ Technology Stack

- **Frontend Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (via utility classes) + Lucide React (Icons)
- **AI Integration:** `@google/genai` (Gemini API) and Gemini Live WebSocket API (`models/gemini-2.5-flash-native-audio-latest`)
- **Markdown Rendering:** `react-markdown`, `remark-math`, `rehype-katex`, `remark-gfm`, `mermaid`
- **Deployment:** Cloudflare Pages (`@cloudflare/vite-plugin`, `wrangler`)

## 💡 How to Use

1. **Configuration Page:** Start by setting your learning profile. Tell EduGuide your age/grade, topic, level, and specific goals.
2. **Chat:** Ask questions! If EduGuide gives you a great explanation, click the **Save (Disk)** icon on the message to refine it into a Study Guide.
3. **Voice Chat:** Navigate to the Voice Chat tab, enable your microphone, and converse naturally without typing.
4. **Saved Guides:** Review your saved Markdown guides. You can also import them directly into a new chat to ask follow-up questions specifically about that guide.

## 🔒 Privacy

EduGuide AI currently stores all user data—including chat history, learning profiles, and saved guides—locally in your browser's `localStorage`. No personal data is stored on external servers, providing a private and fast learning experience.

---

*Built with ❤️ for learners everywhere.*
