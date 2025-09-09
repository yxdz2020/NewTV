'use client';

import { useEffect, useState } from 'react';

import PageLayout from '@/components/PageLayout';

const YouTubePage = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkYouTube = async () => {
      try {
        const response = await fetch('/api/youtube-check');
        if (!response.ok) {
          throw new Error('YouTube is not reachable');
        }
        setIsOnline(true);
      } catch (error) {
        setIsOnline(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkYouTube();
  }, []);

  return (
    <PageLayout>
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p>正在检查 YouTube 可访问性...</p>
          </div>
        </div>
      ) : isOnline ? (
        <iframe
          src="/youtube-proxy/"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">无法访问 YouTube</h1>
            <p className="text-gray-500">请检查您的网络连接或代理设置。</p>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default YouTubePage;