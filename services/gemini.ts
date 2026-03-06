import { GoogleGenAI, Chat } from "@google/genai";
import { UserContext, UserRole } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined in the environment.");
  }
  return new GoogleGenAI({ apiKey });
};

// Construct the system instruction based on user context
const getSystemInstruction = (context: UserContext): string => {
  const baseInstruction = `You are EduGuide, an expert educational mentor. Your goal is to foster deep understanding, not just provide answers.`;

  if (context.role === UserRole.PARENT) {
    return `${baseInstruction} 
    You are assisting a PARENT who is teaching their child (Age: ${context.targetAge}). 
    Topic: ${context.topic}. 
    Current Level: ${context.currentLevel}.

    GUIDANCE INSTRUCTION:
    Guide the parent to reflect on what they want to achieve in this session.
    Ask what their child already knows before suggesting explanations.
    Explain concepts simply with analogies suitable for the child's age.
    
    IMPORTANT:
    Do not just dump information. Ask the parent what specifically they want to teach or what their child is struggling with.
    Only suggest specific activities or next steps when the parent defines the context or asks for help.
    
    CRITICAL: ALWAYS append exactly 3 short follow-up questions the user can ask you next.
    Format them EXACTLY like this at the very end of your response:
    ---SUGGESTIONS---
    [Question 1]
    [Question 2]
    [Question 3]`;
  } else {
    return `${baseInstruction} 
    You are assisting a STUDENT (Age/Grade: ${context.targetAge}) directly. 
    Topic: ${context.topic}. 
    Current Level: ${context.currentLevel}.

    CRITICAL PEDAGOGICAL INSTRUCTION:
    Adopt a Socratic method. Do not overwhelm with technical details.
    
    MOST IMPORTANT:
    1. Do NOT start by telling the student what they should learn or do.
    2. Instead, ASK guiding questions to help them articulate what they want to build, solve, or understand.
    3. Wait for the student's lead.
    4. Only provide the next technical step or solution if they are stuck or explicitly ask for it.
    5. Your goal is to help them think through the problem themselves.
    
    CRITICAL: ALWAYS append exactly 3 short follow-up questions the student can ask you next.
    Format them EXACTLY like this at the very end of your response:
    ---SUGGESTIONS---
    [Question 1]
    [Question 2]
    [Question 3]`;
  }
};

export const createChatSession = (context: UserContext, history?: { role: string, parts: { text: string }[] }[]): Chat => {
  const ai = getClient();
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: getSystemInstruction(context),
      thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster chat interactions
    },
    history: history
  });
};

export const generateRoadmap = async (context: UserContext): Promise<{ text: string, suggestions?: string[] }> => {
  const ai = getClient();

  let promptText = `Create a learning roadmap for ${context.topic}.
  Target Audience: ${context.role === UserRole.PARENT ? `Parent teaching a ${context.targetAge} year old child` : `Student aged ${context.targetAge}`}.
  Current Level: ${context.currentLevel}.
  Goal: ${context.goal}.`;

  if (context.role === UserRole.STUDENT) {
    promptText += `
    IMPORTANT:
    1. Begin with a "Big Picture" summary. Explain the core concepts at a high level without technical jargon to avoid overwhelming the student.
    2. Explain *why* this topic matters.
    3. Only then, provide a step-by-step breakdown.
    `;
  }

  promptText += `
  Please format the output in clean Markdown. Include:
  1. High-level Conceptual Overview.
  2. Week-by-week or Module-by-module breakdown.
  3. Key concepts to master in each stage.
  4. Suggested practical exercises.`;

  promptText += `
  CRITICAL: ALWAYS append exactly 3 short follow-up questions the user can ask you next.
  Format them EXACTLY like this at the very end of your response:
  ---SUGGESTIONS---
  [Question 1]
  [Question 2]
  [Question 3]`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: promptText,
  });

  const fullText = response.text || "";
  if (!fullText) {
    return { text: "Failed to generate roadmap." };
  }

  // Parse suggestions
  let displayPrefix = fullText;
  let newSuggestions: string[] | undefined = undefined;

  if (fullText.includes('---SUGGESTIONS---')) {
    const parts = fullText.split('---SUGGESTIONS---');
    displayPrefix = parts[0].trim();
    const suggestionsPart = parts[1];

    if (suggestionsPart) {
      newSuggestions = suggestionsPart
        .split('\n')
        .map(s => s.replace(/^[-*0-9.)]+/, '').trim())
        .filter(s => s.length > 5);
    }
  }

  return { text: displayPrefix || "Failed to generate roadmap.", suggestions: newSuggestions };
};

export const refineToMarkdown = async (content: string, context: UserContext): Promise<string> => {
  const ai = getClient();

  const prompt = `Refine the following educational content into a high-quality, structured Markdown study guide/reference note.
  It should be easy to read and review later.
  
  IMPORTANT NOVELTY REQUIREMENT:
  You must start the document with a \`\`\`mermaid\`\`\` code block that contains a mindmap visualizing the key concepts in the content.
  Keep the text in the mindmap nodes extremely minimal (1-3 words per node).
  The output MUST begin with the mermaid block. Then follow up with the refined markdown text.
  
  Context: ${context.role === UserRole.PARENT ? 'Guide for a parent' : 'Study notes for a student'}.
  Topic: ${context.topic}.
  
  Content to refine:
  ${content}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text || content;
};