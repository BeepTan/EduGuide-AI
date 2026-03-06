import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioRecorder, AudioPlayer } from '../utils/audio';
import { UserContext, UserRole } from '../types';

export function useLiveAPI(userContext: UserContext) {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const [debugLogs, setDebugLogs] = useState<string[]>([]);

    const addLog = useCallback((msg: string) => {
        setDebugLogs(prev => [...prev.slice(-9), `${new Date().toISOString().split('T')[1].slice(0, -1)}: ${msg}`]);
        console.log(msg);
    }, []);

    const wsRef = useRef<WebSocket | null>(null);
    const recorderRef = useRef<AudioRecorder | null>(null);
    const playerRef = useRef<AudioPlayer | null>(null);

    const disconnect = useCallback(() => {
        if (recorderRef.current) {
            recorderRef.current.stop();
            recorderRef.current = null;
        }
        if (playerRef.current) {
            playerRef.current.stop();
            playerRef.current = null;
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
        setIsSpeaking(false);
    }, []);

    const connect = useCallback(async () => {
        if (wsRef.current) return;

        setError(null);
        addLog("Init connection...");

        // 1. Initialize audio immediately in the click event for mobile browser compatibility
        playerRef.current = new AudioPlayer();

        const audioRecorder = new AudioRecorder((base64) => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                const audioMessage = {
                    realtimeInput: { mediaChunks: [{ mimeType: "audio/pcm;rate=16000", data: base64 }] }
                };
                wsRef.current.send(JSON.stringify(audioMessage));
            }
        }, addLog);
        recorderRef.current = audioRecorder;

        try {
            addLog("Requesting mic...");
            // 2. Request mic access immediately, which requires synchronous relation to user tap
            await audioRecorder.start();
            addLog("Mic granted, audioContext state: " + audioRecorder.getContextState());
        } catch (err: any) {
            addLog("Mic error: " + (err.message || String(err)));
            setError("Failed to access microphone.");
            disconnect();
            return;
        }

        // 3. Connect to WebSocket
        const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any)?.env?.GEMINI_API_KEY || (process as any)?.env?.API_KEY;
        if (!apiKey) {
            setError("API Key not found.");
            disconnect();
            return;
        }

        const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

        addLog("Connecting WS...");
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            addLog("WS Opened. Sending setup.");
            const setupMessage = {
                setup: {
                    model: "models/gemini-2.5-flash-native-audio-latest", // Discovered correct exact model name via v1alpha API
                    systemInstruction: {
                        parts: [{
                            text: `You are EduGuide, an expert educational mentor.
              User role: ${userContext.role} (Age: ${userContext.targetAge}).
              Topic: ${userContext.topic}.
              Level: ${userContext.currentLevel}.
              Goal: ${userContext.goal}.
              Keep responses very short and conversational since this is a voice chat. Do not output markdown lists. Ask clarifying questions naturally.`
                        }]
                    },
                    generationConfig: {
                        responseModalities: ["AUDIO"]
                    }
                }
            };

            ws.send(JSON.stringify(setupMessage));

            // Send the very first message after setup to start the dialogue
            const initialMessage = {
                clientContent: {
                    turns: [{
                        role: "user",
                        parts: [{ text: `Hello! Let's chat about ${userContext.topic}. Lead the way!` }]
                    }],
                    turnComplete: true
                }
            };
            ws.send(JSON.stringify(initialMessage));

            setIsConnected(true);
            setError(null);
        };

        ws.onmessage = async (event) => {
            // Messages from the server can be setupComplete, serverContent, etc.
            let msg;
            try {
                if (event.data instanceof Blob) {
                    const text = await event.data.text();
                    msg = JSON.parse(text);
                } else {
                    msg = JSON.parse(event.data);
                }
            } catch (e) {
                console.error("Failed to parse msg", event.data);
                return;
            }

            if (msg.serverContent && msg.serverContent.modelTurn) {
                setIsSpeaking(true);
                const parts = msg.serverContent.modelTurn.parts;
                for (const part of parts) {
                    if (part.inlineData && part.inlineData.data) {
                        await playerRef.current?.playPCM16(part.inlineData.data);
                    }
                }
            }

            if (msg.serverContent && msg.serverContent.turnComplete) {
                addLog("Model turn complete.");
                setIsSpeaking(false);
            }
        };

        ws.onerror = (e) => {
            addLog("WS Error!");
            setError("WebSocket connection failed.");
            disconnect();
        };

        ws.onclose = (event) => {
            addLog(`WS Closed. Code: ${event.code}, Reason: ${event.reason || 'None'}`);
            setIsConnected(false);
        };

    }, [userContext, addLog, disconnect]);

    // Update disconnect to be standalone without recreating issues
    // Just simple manual disconnect func
    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (wsRef.current) wsRef.current.close();
            if (recorderRef.current) recorderRef.current.stop();
            if (playerRef.current) playerRef.current.stop();
        };
    }, []);

    return { isConnected, isSpeaking, connect, disconnect, error, debugLogs };
}
