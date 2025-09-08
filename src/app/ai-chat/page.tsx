'use client';

import { Bot, Send, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

import PageLayout from '@/components/PageLayout';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  recommendations?: MovieRecommendation[];
}

interface MovieRecommendation {
  title: string;
  year?: string;
  genre?: string;
  description: string;
  poster?: string;
}

const AIChatPage = () => {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: '你好！我是AI影片推荐助手，可以根据你的喜好为你推荐精彩的影视作品。请告诉我你想看什么类型的影片，或者描述一下你的心情和偏好吧！',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage.content
        })
      });

      if (!response.ok) {
        throw new Error('推荐请求失败');
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.content || '抱歉，我现在无法为你推荐影片，请稍后再试。',
        timestamp: new Date(),
        recommendations: data.recommendations || []
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI推荐失败:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '抱歉，推荐服务暂时不可用，请稍后再试。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMovieSelect = (movie: MovieRecommendation) => {
    // 跳转到搜索页面并搜索该影片
    const searchQuery = encodeURIComponent(movie.title);
    router.push(`/search?q=${searchQuery}`);
  };

  return (
    <PageLayout>
      <div className="flex flex-col h-full">

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'ai' && (
                <div className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
              )}
              
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
                <div
                  className={`p-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white ml-auto'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
                
                {/* 推荐影片卡片 */}
                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.recommendations.map((movie, index) => (
                      <div
                        key={index}
                        onClick={() => handleMovieSelect(movie)}
                        className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          {movie.poster && (
                            <img
                              src={movie.poster}
                              alt={movie.title}
                              className="w-12 h-16 object-cover rounded flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                              {movie.title}
                              {movie.year && (
                                <span className="text-gray-500 dark:text-gray-400 ml-1">({movie.year})</span>
                              )}
                            </h4>
                            {movie.genre && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{movie.genre}</p>
                            )}
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {movie.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-gray-400 mt-2">
                  {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              
              {message.type === 'user' && (
                <div className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 输入框 */}
        <div className="fixed bottom-16 left-0 right-0 p-3 border-t border-gray-200 dark:border-gray-700 md:relative md:bottom-auto backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
          <div className="flex gap-2 items-center max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="描述你想看的影片类型或心情..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AIChatPage;