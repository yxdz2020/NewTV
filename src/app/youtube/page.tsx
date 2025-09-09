'use client';

import { useEffect, useState } from 'react';
import PageLayout from '@/components/PageLayout';

const YouTubePage = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // We check against our own proxy endpoint.
    // If the proxy can't reach YouTube, it will return an error status.
    fetch('/api/youtube')
      .then(res => {
        // We consider any response from the proxy (even errors) as the proxy itself being online.
        // The iframe will handle the actual error page from YouTube if it can't be reached.
        // A 5xx error from our proxy would indicate a problem with the proxy itself.
        if (res.status >= 500) {
          throw new Error('Proxy service error');
        }
        setIsOnline(true);
      })
      .catch(() => {
        // This catch block will only trigger if the fetch to our own /api/youtube fails,
        // which means the Next.js app itself is not working correctly.
        setIsOnline(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <PageLayout>
      <div className="w-full h-full">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p>正在加载 YouTube...</p>
          </div>
        ) : isOnline ? (
          <iframe
            src="/api/youtube"
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-presentation"
          ></iframe>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">无法访问 YouTube</h1>
              <p className="text-gray-500">抱歉，您的网络似乎无法访问 YouTube。请检查您的网络连接或代理设置。</p>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default YouTubePage;