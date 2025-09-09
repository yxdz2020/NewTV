'use client';

import { useEffect, useState } from 'react';
import PageLayout from '@/components/PageLayout';
import YouTubeVideoCard from '@/components/YouTubeVideoCard';

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
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());
  const [videosByChannel, setVideosByChannel] = useState<{ [key: string]: YouTubeVideo[] }>({});

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

    const loadChannelsAndVideos = async () => {
      try {
        const channelsResponse = await fetch('/api/youtube-channels');
        if (channelsResponse.ok) {
          const channelsData = await channelsResponse.json();
          const loadedChannels = channelsData.channels || [];

          if (loadedChannels.length > 0) {
            const allVideos: YouTubeVideo[] = [];
            const updatedChannels = await Promise.all(
              loadedChannels.map(async (channel: Channel) => {
                try {
                  const videosResponse = await fetch(
                    `/api/youtube-videos?channelId=${channel.channelId}&maxResults=6`
                  );
                  if (videosResponse.ok) {
                    const videosData = await videosResponse.json();
                    const channelVideos = videosData.videos || [];
                    if (channelVideos.length > 0) {
                      allVideos.push(...channelVideos);
                      return { ...channel, latestVideo: channelVideos[0] };
                    }
                  }
                } catch (error) {
                  console.error(`获取频道 ${channel.name} 的视频失败:`, error);
                }
                return channel;
              })
            );
            setChannels(updatedChannels);
            setVideos(allVideos);
          }
        }
      } catch (error) {
        console.error('加载频道和视频失败:', error);
      } finally {
        setLoadingVideos(false);
        setInitialLoadComplete(true);
      }
    };

    checkYouTubeAccess();
    loadChannelsAndVideos();
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

  const handleVideoPlay = (videoId: string) => {
    console.log('播放视频:', videoId);
  };

  // 将频道ID转换为播放列表ID（UC -> UU）
  const convertChannelIdToPlaylistId = (channelId: string) => {
    if (channelId.startsWith('UC')) {
      return 'UU' + channelId.substring(2);
    }
    return channelId;
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
      <div className="h-full flex flex-col">
        {/* YouTube Header */}
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

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="搜索YouTube视频..."
                className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={handleSearch}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Videos Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingVideos && !initialLoadComplete ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">正在加载视频...</p>
              </div>
            </div>
          ) : videos.length > 0 || channels.length > 0 ? (
            <div>
              {/* 频道播放列表区域 */}
              {channels.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      频道播放列表
                    </h2>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {channels.length} 个频道
                    </div>
                  </div>

                  {/* 频道标签页 */}
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setSelectedChannelId(null);
                          // 滑动到推荐视频区域
                          setTimeout(() => {
                            const element = document.getElementById('recommended-videos');
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }, 100);
                        }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedChannelId === null
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                      >
                        全部
                      </button>
                      {channels.map((channel) => (
                        <button
                          key={channel.id}
                          onClick={() => {
                            setSelectedChannelId(channel.channelId);
                            // 滑动到对应频道视频区域
                            setTimeout(() => {
                              const element = document.getElementById(`channel-${channel.channelId}`);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }, 100);
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedChannelId === channel.channelId
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                          {channel.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {channels.map((channel) => {
                      const videoData = channel.latestVideo || {
                        snippet: {
                          title: channel.name,
                          thumbnails: {
                            medium: {
                              url: `https://yt3.ggpht.com/ytc/default_user=s240-c-k-c0x00ffffff-no-rj`,
                            },
                          },
                          channelTitle: channel.name,
                          publishedAt: channel.addedAt,
                        },
                      };

                      const pseudoVideo = {
                        id: { videoId: channel.channelId }, // This will be used for play action
                        snippet: {
                          ...videoData.snippet,
                          title: videoData.snippet.title, // latest video title
                          channelTitle: channel.name, // channel name
                        },
                        embedPlayer: `https://www.youtube.com/embed/videoseries?list=${convertChannelIdToPlaylistId(
                          channel.channelId
                        )}&autoplay=1`,
                      };

                      return (
                        <YouTubeVideoCard
                          key={channel.id}
                          video={pseudoVideo}
                          showActions={false}
                          onPlay={handleVideoPlay}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 推荐视频区域 */}
              <div id="recommended-videos" className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  推荐视频
                </h2>

                {/* 推荐视频频道标签 */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => setSelectedChannelId(null)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedChannelId === null
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                  >
                    全部
                  </button>
                  {/* 显示所有添加的频道 */}
                  {channels.map((channel) => {
                    return (
                      <button
                        key={channel.channelId}
                        onClick={() => setSelectedChannelId(channel.channelId)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedChannelId === channel.channelId
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                      >
                        {channel.name}
                      </button>
                    );
                  })
                  }
                </div>

                {/* 视频展示区域 */}
                {selectedChannelId === null ? (
                  /* 显示所有频道，按频道分组 */
                  <div className="space-y-8">
                    {channels.map((channel) => {
                      const channelVideos = videos.filter(video =>
                        video.snippet.channelTitle === channel.name
                      ).slice(0, 6);

                      return (
                        <div key={channel.channelId} id={`channel-${channel.channelId}`} className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {channel.name}
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                              ({channelVideos.length} 个视频)
                            </span>
                          </h3>
                          {channelVideos.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {channelVideos.map((video) => (
                                <YouTubeVideoCard
                                  key={video.id.videoId}
                                  video={video}
                                  onPlay={handleVideoPlay}
                                  showActions={false}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                              <p>该频道暂无视频数据</p>
                            </div>
                          )}
                        </div>
                      );
                    })
                    }
                  </div>
                ) : (
                  /* 显示选中频道的视频 */
                  <div>
                    {(() => {
                      const selectedChannel = channels.find(c => c.channelId === selectedChannelId);

                      if (!selectedChannel) {
                        return (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <p>未找到选中的频道</p>
                          </div>
                        );
                      }

                      const channelVideos = videos.filter(video =>
                        video.snippet.channelTitle === selectedChannel.name
                      );

                      return (
                        <div id={`channel-${selectedChannelId}`} className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {selectedChannel.name}
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                              ({channelVideos.length} 个视频)
                            </span>
                          </h3>
                          {channelVideos.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {channelVideos.map((video) => (
                                <YouTubeVideoCard
                                  key={video.id.videoId}
                                  video={video}
                                  onPlay={handleVideoPlay}
                                  showActions={false}
                                />
                              ))}
                            </div>
                        </div>
                      );
                    })()
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">暂无视频</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  请在管理后台添加YouTube频道，即可显示视频内容
                </p>
                <a
                  href="https://www.youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  访问YouTube官网
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default YouTubePage;