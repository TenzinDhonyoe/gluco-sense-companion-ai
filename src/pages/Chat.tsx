
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Bot, User } from "lucide-react";
import BottomNav from "@/components/BottomNav";

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hi! I'm your AI diabetes coach. I can help you understand your glucose patterns, suggest meal improvements, and answer questions about managing your diabetes. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('glucose') || lowerMessage.includes('blood sugar')) {
      return "Based on your recent readings, I notice your glucose levels have been mostly in range. To maintain good control, try to eat balanced meals with protein, fiber, and healthy fats. Would you like specific meal suggestions?";
    }
    
    if (lowerMessage.includes('exercise') || lowerMessage.includes('workout')) {
      return "Great question! Exercise is excellent for glucose management. I see you've been logging workouts regularly. Try to exercise 30-60 minutes after meals for the best glucose response. Even a 10-minute walk can help reduce post-meal spikes.";
    }
    
    if (lowerMessage.includes('food') || lowerMessage.includes('meal') || lowerMessage.includes('eat')) {
      return "For better glucose control, focus on: 1) Eating protein first, then vegetables, then carbs 2) Choosing complex carbs over simple sugars 3) Adding fiber to slow glucose absorption. What specific foods are you curious about?";
    }
    
    if (lowerMessage.includes('spike') || lowerMessage.includes('high')) {
      return "Post-meal spikes are common but manageable! Try these strategies: eat smaller portions, add a 10-minute walk after eating, drink water before meals, and consider the order you eat your food (protein first). What caused your last spike?";
    }
    
    if (lowerMessage.includes('sleep')) {
      return "Sleep significantly affects glucose control! Poor sleep can increase insulin resistance. Aim for 7-8 hours consistently. I notice irregular sleep patterns can correlate with higher morning glucose. How has your sleep been lately?";
    }
    
    return "That's a great question! Based on your data, I'd recommend focusing on consistent meal timing and regular monitoring. Your recent patterns show good progress. Is there a specific aspect of diabetes management you'd like to explore further?";
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: generateBotResponse(inputMessage),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      <div className="p-6 flex flex-col h-screen">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">AI Coach</h1>
          <p className="text-gray-600">Get personalized diabetes management advice</p>
        </div>

        {/* Messages Container */}
        <Card className="flex-1 bg-white/70 backdrop-blur-sm border-0 shadow-lg mb-4 flex flex-col">
          <CardContent className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === 'bot' && <Bot className="w-4 h-4 mt-1 text-blue-500" />}
                      <div className="flex-1">
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      {message.type === 'user' && <User className="w-4 h-4 mt-1 text-blue-100" />}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4 text-blue-500" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Input Area */}
        <div className="flex space-x-2 pb-20">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about your glucose, meals, exercise..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Chat;
