''''use client';

import { useEffect, useState } from 'react';
import PageLayout from '@/components/PageLayout';
import YouTubeVideoCard from '@/components/YouTubeVideoCard';

// 接口定义保持不变
interface YouTubeVideo {
  id: { videoId: string };
  snippet: {
    title: string;
    description?: string;
    thumbnails: {
      medium: {
        url: string;
        width?: number;
        height?: number;
      };
    };
    channelTitle: string;
    publishedAt: string;
  };
  embedPlayer?: string;
}

interface Channel {
  id: string;
  name: string;
  channelId: string;
  addedAt: string;
  latestVideo?: YouTubeVideo;
}

const YouTubePage = () => {
  // --- 状态管理 ---
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const scrollToTop = () => {
    try {
      document.body.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      console.error("Failed to scroll to top:", error);
      // Fallback for older browsers
      document.body.scrollTop = 0;
    }
  };

  useEffect(() => {
    const checkScrollPosition = () => {
      if (document.body.scrollTop > 300) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
    };

    document.body.addEventListener('scroll', checkScrollPosition);

    return () => {
      document.body.removeEventListener('scroll', checkScrollPosition);
    };
  }, []);

  return (
    <PageLayout>
      <div className="h-full flex flex-col">
        {/* Header and Search Bar */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">YouTube</h1>
            </div>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={handleKeyPress} placeholder="搜索YouTube视频..." className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <button onClick={handleSearch} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingVideos && !initialLoadComplete ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">正在加载视频...</p>
              </div>
            </div>
          ) : channels.length > 0 ? (
            <div>
              {/* 频道播放列表区域 */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">频道播放列表</h2>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{channels.length} 个频道</div>
                </div>

                {/* 频道标签页 (唯一过滤控件) */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleChannelSelect(null)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedChannelId === null ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                      全部
                    </button>
                    {channels.map((channel) => (
                      <button key={channel.id} onClick={() => handleChannelSelect(channel.channelId)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedChannelId === channel.channelId ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                        {channel.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {channels.map((channel) => {
                    const pseudoVideo = {
                      id: { videoId: channel.channelId },
                      snippet: {
                        title: channel.latestVideo?.snippet.title || channel.name,
                        thumbnails: channel.latestVideo?.snippet.thumbnails || { medium: { url: `https://yt3.ggpht.com/ytc/default_user=s240-c-k-c0x00ffffff-no-rj` } },
                        channelTitle: channel.name,
                        publishedAt: channel.latestVideo?.snippet.publishedAt || channel.addedAt,
                      },
                      embedPlayer: `https://www.youtube.com/embed/videoseries?list=${convertChannelIdToPlaylistId(channel.channelId)}&autoplay=1`,
                    };
                    return <YouTubeVideoCard key={channel.id} video={pseudoVideo} showActions={false} onPlay={handleVideoPlay} />;
                  })}
                </div>
              </div>

              {/* 推荐视频区域 */}
              <div id="recommended-videos" className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">推荐视频</h2>

                {/* 优化：移除了此处的第二组过滤按钮 */}

                {/* 视频展示区域 */}
                {selectedChannelId === null ? (
                  /* 显示所有频道，按频道分组 */
                  <div className="space-y-8">
                    {channels.map((channel) => {
                      // 优化：直接从 `videosByChannel` 对象获取视频，无需过滤
                      const channelVideos = videosByChannel[channel.channelId] || [];
                      return (
                        <div key={channel.channelId} id={`channel-${channel.channelId}`} className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {channel.name}
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({channelVideos.length} 个视频)</span>
                          </h3>
                          {channelVideos.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {channelVideos.map((video) => (
                                <YouTubeVideoCard key={video.id.videoId} video={video} onPlay={handleVideoPlay} showActions={false} />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400"><p>该频道暂无视频数据</p></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* 显示选中频道的视频 */
                  (() => {
                    const selectedChannel = channels.find(c => c.channelId === selectedChannelId);
                    if (!selectedChannel) {
                      return <div className="text-center py-8 text-gray-500 dark:text-gray-400"><p>未找到选中的频道</p></div>;
                    }
                    // 优化：直接从 `videosByChannel` 对象获取视频
                    const channelVideos = videosByChannel[selectedChannelId] || [];

                    // 修正：确保整个内容块都在一个父 `div` 中
                    return (
                      <div id={`channel-${selectedChannelId}`} className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {selectedChannel.name}
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({channelVideos.length} 个视频)</span>
                        </h3>
                        {channelVideos.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {channelVideos.map((video) => (
                              <YouTubeVideoCard key={video.id.videoId} video={video} onPlay={handleVideoPlay} showActions={false} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400"><p>该频道暂无视频数据</p></div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          ) : (
            /* 无频道数据时的占位符 */
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">暂无视频</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">请在管理后台添加YouTube频道，即可显示视频内容</p>
                <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                  访问YouTube官网
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Back to Top Button */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-red-600 hover:bg-red-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-opacity duration-300"
          aria-label="返回顶部"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      )}
    </PageLayout>
  );
};

export default YouTubePage;