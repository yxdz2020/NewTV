'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Play, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { getAllPlayRecords, clearAllPlayRecords, PlayRecord } from '@/lib/db.client';
import VideoCard from '@/components/VideoCard';

interface ExtendedPlayRecord extends PlayRecord {
  hasUpdate?: boolean;
  newEpisodes?: number;
}

export default function MyWatchingPage() {
  const router = useRouter();
  const [playRecords, setPlayRecords] = useState<ExtendedPlayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedRecords, setUpdatedRecords] = useState<ExtendedPlayRecord[]>([]);
  const [historyRecords, setHistoryRecords] = useState<ExtendedPlayRecord[]>([]);

  useEffect(() => {
    loadPlayRecords();
  }, []);

  const loadPlayRecords = async () => {
    try {
      setLoading(true);
      const recordsObj = await getAllPlayRecords();
      
      // 将Record转换为数组并按时间排序
      const records = Object.values(recordsObj).sort((a, b) => b.save_time - a.save_time);
      
      // 检查剧集更新
      const recordsWithUpdates = await checkForUpdates(records);
      
      // 实现更新剧集优先排序：有更新的剧集排在前面，然后按时间排序
      const sortedRecords = recordsWithUpdates.sort((a, b) => {
        // 首先按是否有更新排序（有更新的在前）
        if (a.hasUpdate && !b.hasUpdate) return -1;
        if (!a.hasUpdate && b.hasUpdate) return 1;
        
        // 如果都有更新或都没有更新，则按保存时间排序（最新的在前）
        return b.save_time - a.save_time;
      });
      
      // 分离有更新的记录和历史记录
      const updated = sortedRecords.filter(record => record.hasUpdate);
      const history = sortedRecords.filter(record => !record.hasUpdate);
      
      setUpdatedRecords(updated);
      setHistoryRecords(history);
      setPlayRecords(sortedRecords);
    } catch (error) {
      console.error('加载播放记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 检查剧集更新的函数
  const checkForUpdates = async (records: PlayRecord[]): Promise<ExtendedPlayRecord[]> => {
    if (!records.length) return [];
    
    const updatedRecords: ExtendedPlayRecord[] = [];
    
    for (const record of records) {
      try {
        // 从记录的search_title或title中提取可能的ID信息
        // 由于PlayRecord没有直接的id字段，我们需要从其他字段推断
        // 这里暂时跳过更新检查，直接返回原记录
        updatedRecords.push({
          ...record,
          hasUpdate: false,
          newEpisodes: 0
        });
      } catch (error) {
        console.error(`检查更新失败 - ${record.title}:`, error);
        updatedRecords.push({
          ...record,
          hasUpdate: false,
          newEpisodes: 0
        });
      }
    }
    
    return updatedRecords;
  };

  const handleClearAll = async () => {
    if (confirm('确定要清空所有观看记录吗？此操作不可撤销。')) {
      try {
        await clearAllPlayRecords();
        setPlayRecords([]);
        setUpdatedRecords([]);
        setHistoryRecords([]);
      } catch (error) {
        console.error('清空播放记录失败:', error);
      }
    }
  };

  const handlePlayVideo = (record: PlayRecord) => {
    const params = new URLSearchParams({
      title: record.title,
      source: record.source_name,
      year: record.year?.toString() || '',
      index: record.index?.toString() || '1',
      time: record.play_time?.toString() || '0'
    });
    
    router.push(`/play?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 dark:text-gray-400">加载中...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* 页面头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              我的观看
            </h1>
          </div>
          
          {playRecords.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              清空记录
            </button>
          )}
        </div>

        {playRecords.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              暂无观看记录
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              开始观看影片后，记录会显示在这里
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 有更新的剧集 */}
            {updatedRecords.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    有新集数
                  </h2>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-red-500 font-medium">
                      {updatedRecords.length}部剧集有更新
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {updatedRecords.map((record, index) => (
                    <div key={`updated-${index}`} className="relative">
                      <VideoCard
                        title={record.title}
                        poster={record.cover}
                        year={record.year}
                        from="playrecord"
                        progress={record.total_time ? (record.play_time / record.total_time) * 100 : 0}
                        currentEpisode={record.index}
                        episodes={record.total_episodes}
                        source_name={record.source_name}
                      />
                      {record.hasUpdate && record.newEpisodes && record.newEpisodes > 0 && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full shadow-lg animate-bounce">
                          +{record.newEpisodes}集
                        </div>
                      )}
                      {/* 新集数提示光环效果 */}
                      {record.hasUpdate && (
                        <div className="absolute inset-0 rounded-lg ring-2 ring-red-400 ring-opacity-50 animate-pulse pointer-events-none"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 历史观看记录 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {updatedRecords.length > 0 ? '历史观看' : '观看记录'}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {historyRecords.map((record, index) => (
                  <VideoCard
                    key={`history-${index}`}
                    title={record.title}
                    poster={record.cover}
                    year={record.year}
                    from="playrecord"
                    progress={record.total_time ? (record.play_time / record.total_time) * 100 : 0}
                    currentEpisode={record.index}
                    episodes={record.total_episodes}
                    source_name={record.source_name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}