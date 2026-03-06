import React from 'react';
import { UserContext } from '../types';
import { useLiveAPI } from '../hooks/useLiveAPI';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import Button from './Button';

interface AudioChatProps {
    userContext: UserContext;
}

const AudioChat: React.FC<AudioChatProps> = ({ userContext }) => {
    const { isConnected, isSpeaking, connect, disconnect, error, debugLogs } = useLiveAPI(userContext);

    const toggleConnection = () => {
        if (isConnected) {
            disconnect();
        } else {
            connect();
        }
    };

    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4">
            <div className={`flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 transition-all duration-500 ease-in-out h-[calc(100vh-6rem)] md:mt-2`}>
                <div className="p-6 md:p-10 flex flex-col items-center justify-center flex-1 space-y-8 animate-fade-in relative overflow-hidden">

                    {/* Background Ambient Animation based on connection */}
                    <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${isConnected ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50 animate-pulse" />
                        {isSpeaking && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-100 rounded-full blur-2xl opacity-70 animate-ping duration-1000 delay-150" />}
                    </div>

                    <div className="text-center z-10 space-y-2">
                        <h2 className="text-3xl font-bold text-gray-900">Voice Chat Mode</h2>
                        <p className={`text-gray-500 mx-auto transition-all max-w-md`}>
                            Have a natural, hands-free conversation with EduGuide about <span className="font-semibold text-indigo-600">{userContext.topic}</span>.
                        </p>
                    </div>

                    {error && (
                        <div className="z-10 bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 flex items-center gap-2 max-w-md w-full text-sm shadow-sm">
                            <AlertCircle size={18} className="shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Main Interaction Button */}
                    <div className="z-10 relative group">
                        <div className={`absolute -inset-4 rounded-full transition-all duration-500 blur-xl ${isConnected ? 'bg-indigo-400/30' : 'bg-gray-200/50 group-hover:bg-indigo-200/50'}`}></div>
                        <button
                            onClick={toggleConnection}
                            className={`relative rounded-full shadow-lg transition-all transform active:scale-95 flex items-center justify-center p-10 
                                ${isConnected
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/50'
                                    : 'bg-white border-2 border-gray-100 text-gray-600 hover:border-indigo-200 hover:text-indigo-600'
                                }`}
                        >
                            {isConnected ? <Mic size={48} className="animate-pulse" /> : <MicOff size={48} />}
                        </button>
                    </div>

                    <div className="text-center z-10 h-8">
                        <p className={`font-medium transition-all ${isConnected ? 'text-indigo-600' : 'text-gray-400'}`}>
                            {isConnected
                                ? isSpeaking ? "EduGuide is speaking..." : "Listening to you..."
                                : "Tap the microphone to connect"}
                        </p>
                    </div>

                    {/* Debug Logs for Mobile testing */}
                    <div className="z-10 w-full max-w-sm mt-auto border-t border-gray-100 pt-4 hidden">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Diagnostic Logs</h3>
                        <div className="space-y-1 font-mono text-[10px] text-gray-400 h-24 overflow-y-auto bg-gray-50 rounded-lg p-2">
                            {debugLogs && debugLogs.length > 0 ? (
                                debugLogs.map((log, i) => (
                                    <div key={i} className="border-b border-gray-200/50 pb-1 truncate">{log}</div>
                                ))
                            ) : (
                                <div className="text-gray-400 italic">No logs yet...</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioChat;
