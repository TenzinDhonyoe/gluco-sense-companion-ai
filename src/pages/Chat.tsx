
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Bot, User, TrendingUp, Utensils, HelpCircle, Trash2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const Chat = () => {
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState("there");
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { messages, setMessages, addMessage, clearChat } = useChatHistory(userId);

  const quickReplies = [
    { icon: TrendingUp, text: "Show my glucose trend", message: "Show me my glucose trend" },
    { icon: Utensils, text: "Recommend a meal", message: "Can you recommend a healthy meal?" },
    { icon: HelpCircle, text: "Ask a question", message: "I have a question about diabetes management" }
  ];

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();

        if (profile && profile.name) {
          const firstName = profile.name.split(' ')[0];
          setUserName(firstName);
          
          // Only set initial welcome message if there's no existing chat history
          if (messages.length === 0) {
            setMessages([{
              id: '1',
              type: 'bot',
              content: `Hi ${firstName} 👋 Welcome back! Your average glucose trend this week is stable. How can I help you today?`,
              timestamp: new Date()
            }]);
          }
        } else {
          // Fallback welcome message only if no existing history
          if (messages.length === 0) {
            setMessages([{
              id: '1',
              type: 'bot',
              content: "Hi there 👋 Welcome back! Your average glucose trend this week is stable. How can I help you today?",
              timestamp: new Date()
            }]);
          }
        }
      }
    };

    fetchUserProfile();
  }, [messages.length, setMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getRelativeTime = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Handle greetings differently
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
      return `Hi ${userName}! How can I help you today? 😊 I can assist with glucose patterns, meal suggestions, or answer any diabetes management questions you have.`;
    }
    
    if (lowerMessage.includes('glucose') || lowerMessage.includes('blood sugar') || lowerMessage.includes('trend')) {
      return "📈 Based on your recent readings, I notice your glucose levels have been mostly in range. Your average this week is 142 mg/dL with good stability. To maintain control, try balanced meals with protein and fiber. Would you like specific meal suggestions?";
    }
    
    if (lowerMessage.includes('exercise') || lowerMessage.includes('workout')) {
      return "💪 Great question! Exercise is excellent for glucose management. I see you've been logging workouts regularly. Try exercising 30-60 minutes after meals for the best glucose response. Even a 10-minute walk can help reduce post-meal spikes.";
    }
    
    if (lowerMessage.includes('food') || lowerMessage.includes('meal') || lowerMessage.includes('eat')) {
      return "🍽️ For better glucose control, focus on: 1) Eating protein first, then vegetables, then carbs 2) Choosing complex carbs over simple sugars 3) Adding fiber to slow glucose absorption. What specific foods are you curious about?";
    }
    
    if (lowerMessage.includes('spike') || lowerMessage.includes('high')) {
      return "⚠️ Post-meal spikes are common but manageable! Try these strategies: eat smaller portions, add a 10-minute walk after eating, drink water before meals, and consider the order you eat your food (protein first). What caused your last spike?";
    }
    
    if (lowerMessage.includes('sleep')) {
      return "😴 Sleep significantly affects glucose control! Poor sleep can increase insulin resistance. Aim for 7-8 hours consistently. I notice irregular sleep patterns can correlate with higher morning glucose. How has your sleep been lately?";
    }
    
    return `That's a great question, ${userName}! Based on your data, I'd recommend focusing on consistent meal timing and regular monitoring. Your recent patterns show good progress. Is there a specific aspect of diabetes management you'd like to explore further?`;
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    addMessage(userMessage);
    setInputMessage("");
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: generateBotResponse(textToSend),
        timestamp: new Date()
      };
      
      addMessage(botMessage);
      setIsLoading(false);
    }, 800 + Math.random() * 1200);
  };

  const handleQuickReply = (quickReply: typeof quickReplies[0]) => {
    sendMessage(quickReply.message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClearChat = () => {
    clearChat();
    toast({
      title: "Chat cleared",
      description: "Your conversation history has been cleared.",
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/b270e330-8a62-4bd9-9ea1-8b69bdb3d6d7.png" 
              alt="GlucoCoach AI" 
              className="w-10 h-10 rounded-full border-2 border-white shadow-lg ring-2 ring-blue-200/50"
            />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">GlucoCoach AI</h1>
              <p className="text-sm text-green-500 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Online
              </p>
            </div>
          </div>
          
          {/* Clear Chat Button */}
          {messages.length > 0 && (
            <Button
              onClick={handleClearChat}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div className={`flex items-end space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div className="flex-shrink-0 mb-1">
                {message.type === 'bot' ? (
                  <img 
                    src="/lovable-uploads/b270e330-8a62-4bd9-9ea1-8b69bdb3d6d7.png" 
                    alt="GlucoCoach AI" 
                    className="w-8 h-8 rounded-full border-2 border-white shadow-lg ring-2 ring-blue-200/50"
                  />
                ) : (
                  <img 
                    src="/lovable-uploads/880f3ea4-efd1-4de5-93a4-d0d91ae981f7.png" 
                    alt="User" 
                    className="w-8 h-8 rounded-full border-2 border-white shadow-lg ring-2 ring-blue-200/50"
                  />
                )}
              </div>
              
              {/* Message Bubble */}
              <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                message.type === 'bot' 
                  ? 'bg-white border border-gray-200' 
                  : 'bg-blue-500 text-white'
              }`}>
                <div className={`text-sm leading-relaxed ${message.type === 'bot' ? 'text-gray-800' : 'text-white'}`}>
                  {message.content}
                </div>
                <div className={`text-xs mt-2 ${
                  message.type === 'bot' ? 'text-gray-500' : 'text-blue-100'
                }`}>
                  {getRelativeTime(message.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-end space-x-2 max-w-[80%]">
              <img 
                src="/lovable-uploads/b270e330-8a62-4bd9-9ea1-8b69bdb3d6d7.png" 
                alt="GlucoCoach AI" 
                className="w-8 h-8 rounded-full border-2 border-white shadow-lg ring-2 ring-blue-200/50"
              />
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">AI Coach is typing...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reply Suggestions */}
      {messages.length <= 1 && !isLoading && (
        <div className="flex-shrink-0 px-4 pb-2">
          <div className="flex space-x-2 overflow-x-auto">
            {quickReplies.map((reply, index) => {
              const Icon = reply.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleQuickReply(reply)}
                  className="flex items-center space-x-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap shadow-sm"
                >
                  <Icon className="w-4 h-4" />
                  <span>{reply.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4 pb-24">
        <div className="flex space-x-3">
          <div className="flex-1">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about meals, glucose trends, or habits..."
              className="border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={() => sendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-2xl transition-colors"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0">
        <BottomNav />
      </div>
    </div>
  );
};

export default Chat;
