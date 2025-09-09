'use client';

import PageLayout from '@/components/PageLayout';

const YouTubePage = () => {
  return (
    <PageLayout>
      <div className="h-full w-full">
        <iframe
          src="https://invidious.io.lol/search"
          className="w-full h-full border-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </PageLayout>
  );
};

export default YouTubePage;