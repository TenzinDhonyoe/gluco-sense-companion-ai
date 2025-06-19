
import { useState, useEffect } from 'react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export const useChatHistory = (userId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);

  const storageKey = `chat-history-${userId}`;

  // Load chat history from localStorage on mount
  useEffect(() => {
    if (!userId) return;

    const savedMessages = localStorage.getItem(storageKey);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
  }, [userId, storageKey]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (!userId || messages.length === 0) return;

    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, userId, storageKey]);

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const clearChat = () => {
    setMessages([]);
    if (userId) {
      localStorage.removeItem(storageKey);
    }
  };

  return {
    messages,
    setMessages,
    addMessage,
    clearChat
  };
};
