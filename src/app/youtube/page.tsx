'use client';

import { useEffect, useState } from 'react';
import PageLayout from '@/components/PageLayout';

const YouTubePage = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkYouTubeAccess = async () => {
      try {
        const response = await fetch('/api/youtube-check');
        if (response.ok) {
          setIsOnline(true);
        } else {
          setIsOnline(false);
        }
      } catch (proxyError) {
        setIsOnline(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkYouTubeAccess();
  }, []);

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
      <div className="absolute inset-0 -m-4">
        <iframe
          src="/youtube-proxy/"
          className="w-full h-full border-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          title="YouTube"
        />
      </div>
    </PageLayout>
  );
};

export default YouTubePage;