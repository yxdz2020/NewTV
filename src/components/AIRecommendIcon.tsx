'use client';

import { Bot } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface AIConfig {
  enabled: boolean;
  apiUrl: string;
  hasApiKey: boolean;
}

const AIRecommendIcon = () => {
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAIConfig = async () => {
      try {
        const response = await fetch('/api/ai/config');
        if (response.ok) {
          const config = await response.json();
          setAiConfig(config);
        }
      } catch (error) {
        console.error('Failed to fetch AI config:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAIConfig();
  }, []);

  // 如果正在加载、配置不存在、或者AI功能未启用，则不显示图标
  if (loading || !aiConfig || !aiConfig.enabled || !aiConfig.apiUrl || !aiConfig.hasApiKey) {
    return null;
  }

  return (
    <Link
      href="/ai-chat"
      className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
      title="AI推荐影片"
    >
      <Bot className="w-5 h-5 text-gray-600 dark:text-gray-400" />
    </Link>
  );
};

export default AIRecommendIcon;