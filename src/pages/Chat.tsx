
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
  const [hasInitialized, setHasInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { messages, setMessages, addMessage, clearChat } = useChatHistory(userId);

  const quickReplies = [
    { icon: TrendingUp, text: "Show my trend", message: "Show me my glucose trend" },
    { icon: Utensils, text: "Meal ideas", message: "Can you recommend a healthy meal?" },
    { icon: HelpCircle, text: "Ask question", message: "I have a question about diabetes management" }
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
        }
        
        setHasInitialized(true);
      }
    };

    fetchUserProfile();
  }, []);

  // Set initial welcome message only after user profile is loaded and if no chat history exists
  useEffect(() => {
    if (hasInitialized && userId && messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        type: 'bot',
        content: `Hi ${userName}! I'm GlucoCoach AI, your personal diabetes management assistant. I can help you understand your glucose patterns, provide meal suggestions, and answer questions about your wellness journey. How can I assist you today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [hasInitialized, userId, messages.length, userName, setMessages]);

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

  const generateBotResponse = async (userMessage: string): Promise<string> => {
    try {
      // Gather user context from recent data
      const userContext = await gatherUserContext();
      
      // Prepare conversation history (last 10 messages)
      const conversationHistory = messages.slice(-10).map(msg => ({
        type: msg.type,
        content: msg.content
      }));

      // Call the AI chat function
      console.log('Calling ai-chat function with context:', {
        messageLength: userMessage.length,
        conversationLength: conversationHistory.length,
        hasGlucoseData: userContext.recentGlucose?.length > 0,
        hasMealData: userContext.recentMeals?.length > 0,
        hasExerciseData: userContext.recentExercises?.length > 0
      });

      const { data, error } = await supabase.functions.invoke('ai-chat-standalone', {
        body: {
          message: userMessage,
          conversationHistory,
          userContext
        }
      });

      if (error) {
        console.error('AI chat error:', error);
        console.log('Using fallback response due to AI chat error');
        // Fallback to simple response
        return generateFallbackResponse(userMessage);
      }

      console.log('AI chat response received:', {
        hasResponse: !!data?.response,
        source: data?.source || 'unknown',
        responseLength: data?.response?.length || 0
      });

      return data.response || 'I apologize, but I could not process your request right now. Please try again.';
    } catch (error) {
      console.error('Error calling AI chat:', error);
      return generateFallbackResponse(userMessage);
    }
  };

  const gatherUserContext = async () => {
    if (!userId) return {};

    try {
      // Get recent glucose readings
      const { data: recentGlucose } = await supabase
        .from('glucose_readings')
        .select('value, timestamp')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(20);

      // Get recent meals
      const { data: recentMeals } = await supabase
        .from('meals')
        .select('meal_name, meal_type, timestamp, total_calories')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(10);

      // Get recent exercises
      const { data: recentExercises } = await supabase
        .from('exercises')
        .select('exercise_name, exercise_type, duration_minutes, timestamp')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(10);

      return {
        recentGlucose: recentGlucose || [],
        recentMeals: recentMeals || [],
        recentExercises: recentExercises || []
      };
    } catch (error) {
      console.error('Error gathering user context:', error);
      return {};
    }
  };

  const generateFallbackResponse = (userMessage: string): string => {
    console.log('Using fallback response for message:', userMessage);
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
      return `Hi ${userName}! I'm here to help with your diabetes management. How can I assist you today?`;
    }
    
    if (lowerMessage.includes('glucose') || lowerMessage.includes('blood sugar') || lowerMessage.includes('trend')) {
      return "I can help you understand your glucose patterns! Start logging some readings so I can provide personalized insights about your trends and management strategies.";
    }
    
    if (lowerMessage.includes('food') || lowerMessage.includes('meal') || lowerMessage.includes('eat')) {
      return "For better glucose control, focus on balanced meals with protein, fiber, and complex carbs. Eating protein first can help reduce glucose spikes. What specific foods would you like to know about?";
    }
    
    if (lowerMessage.includes('exercise') || lowerMessage.includes('workout')) {
      return "Exercise is excellent for glucose management! Try a 10-15 minute walk after meals to help reduce glucose spikes. What type of activities do you enjoy?";
    }
    
    return `That's a great question, ${userName}! I'm here to help with diabetes management, including glucose trends, meal planning, and exercise timing. What specific aspect would you like to explore?`;
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

    try {
      // Get AI response
      const aiResponse = await generateBotResponse(textToSend);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: aiResponse,
        timestamp: new Date()
      };
      
      addMessage(botMessage);
    } catch (error) {
      console.error('Error generating response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date()
      };
      
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
    <div 
      className="flex flex-col h-screen bg-gray-50"
      style={{ 
        paddingTop: 'max(3rem, env(safe-area-inset-top))',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 0.75rem)'
      }}
    >
      {/* Header - Apple HIG compliant */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative">
              <img 
                src="/lovable-uploads/b270e330-8a62-4bd9-9ea1-8b69bdb3d6d7.png" 
                alt="GlucoCoach AI" 
                className="w-8 h-8 rounded-full border-2 border-white shadow-lg ring-2 ring-blue-200/50"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-gray-900 truncate">GlucoCoach AI</h1>
              <p className="text-xs text-muted-foreground">Your personal health assistant</p>
            </div>
          </div>
          
          {/* Clear Chat Button */}
          {messages.length > 0 && (
            <Button
              onClick={handleClearChat}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-red-500 w-11 h-11"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area - Apple HIG compliant */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div className={`flex items-end gap-3 max-w-[75%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
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
              <div className={`rounded-xl px-4 py-2 shadow-sm animate-fade-in ${
                message.type === 'bot' 
                  ? 'bg-white border border-gray-200 shadow-md' 
                  : 'bg-blue-500 text-white'
              }`}>
                <div className={`text-sm leading-relaxed ${message.type === 'bot' ? 'text-gray-800' : 'text-white'}`}>
                  {message.content.includes('142 mg/dL') ? (
                    message.content.replace('142 mg/dL', '**142 mg/dL**')
                  ) : message.content}
                </div>
                <div className={`text-xs text-muted-foreground mt-1 ${
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
            <div className="flex items-end gap-2 max-w-[80%]">
              <img 
                src="/lovable-uploads/b270e330-8a62-4bd9-9ea1-8b69bdb3d6d7.png" 
                alt="GlucoCoach AI" 
                className="w-8 h-8 rounded-full border-2 border-white shadow-lg ring-2 ring-blue-200/50"
              />
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
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

      {/* Quick Reply Suggestions - Apple HIG compliant */}
      {messages.length <= 1 && !isLoading && (
        <div className="flex-shrink-0 px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto">
            {quickReplies.map((reply, index) => {
              const Icon = reply.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleQuickReply(reply)}
                  className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap shadow-sm min-h-11"
                >
                  <Icon className="w-4 h-4" />
                  <span>{reply.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Area - Apple HIG compliant */}
      <div 
        className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-4"
        style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about meals, glucose trends, or habits..."
              className="border border-gray-300 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base shadow-sm"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={() => sendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-primary text-primary-foreground p-2.5 rounded-full shadow-sm hover:bg-primary/90 transition-colors"
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
