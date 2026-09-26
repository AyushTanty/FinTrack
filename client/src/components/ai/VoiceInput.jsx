import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'react-bootstrap';
import { Mic, MicOff } from 'lucide-react';

export default function VoiceInput({ onTranscript, disabled }) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [onTranscript]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  if (!supported) {
    return (
      <Button variant="outline-secondary" disabled title="Voice input not supported in this browser">
        <Mic size={20} />
      </Button>
    );
  }

  return (
    <Button 
      variant={isListening ? "outline-danger" : "outline-secondary"} 
      onClick={toggleListening} 
      disabled={disabled}
      className={isListening ? "pulse-animation text-danger" : ""}
    >
      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          .pulse-animation {
            animation: pulse 1.5s infinite ease-in-out;
          }
        `}
      </style>
    </Button>
  );
}
