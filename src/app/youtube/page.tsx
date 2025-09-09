'use client';

import { useEffect, useState } from 'react';
import PageLayout from '@/components/PageLayout';

const YouTubePage = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const checkYouTubeAccess = async () => {
      try {
        // 尝试访问YouTube的favicon来检测连通性
        const response = await fetch('https://www.youtube.com/favicon.ico', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache'
        });
        setIsOnline(true);
      } catch (error) {
        // 如果直接访问失败，尝试通过代理检测
        try {
          const proxyResponse = await fetch('/api/youtube-check');
          if (proxyResponse.ok) {
            setIsOnline(true);
          } else {
            setIsOnline(false);
          }
        } catch (proxyError) {
          setIsOnline(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkYouTubeAccess();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`, '_blank');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">正在检测YouTube连通性...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (isOnline === false) {
    return (
      <PageLayout>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">无法访问YouTube</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              抱歉，您的网络暂不支持访问YouTube。请检查您的网络连接或代理设置。
            </p>
            <div className="space-y-2">
              <button 
                onClick={() => window.location.reload()} 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors block w-full"
              >
                重新检测
              </button>
              <a 
                href="https://www.youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors block w-full text-center"
              >
                在新标签页打开YouTube
              </a>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col h-full">
          {/* YouTube Header */}
          <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">YouTube</h1>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="搜索YouTube视频..."
                  className="w-full px-4 py-3 pr-12 text-gray-900 bg-gray-50 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-red-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-lg">
              <div className="mb-8">
                <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">欢迎来到YouTube</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  由于浏览器安全限制，无法直接在此处嵌入YouTube。您可以使用上方的搜索框搜索视频，或点击下方按钮在新标签页中打开YouTube。
                </p>
              </div>
              
              <div className="space-y-4">
                <a 
                  href="https://www.youtube.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  打开YouTube官网
                </a>
                
                <div className="grid grid-cols-2 gap-4">
                  <a 
                    href="https://www.youtube.com/feed/trending" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-center"
                  >
                    热门视频
                  </a>
                  <a 
                    href="https://music.youtube.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-center"
                  >
                    YouTube Music
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default YouTubePage;