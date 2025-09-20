'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Play, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { getAllPlayRecords, clearAllPlayRecords, PlayRecord, subscribeToDataUpdates, generateStorageKey } from '@/lib/db.client';
import VideoCard from '@/components/VideoCard';
import ScrollableRow from '@/components/ScrollableRow';

interface ExtendedPlayRecord extends PlayRecord {
  id: string; // 添加id属性，用于存储generateStorageKey生成的唯一标识符
  hasUpdate?: boolean;
  newEpisodes?: number;
}

export default function MyWatchingPage() {
  const router = useRouter();
  const [playRecords, setPlayRecords] = useState<ExtendedPlayRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [updatedRecords, setUpdatedRecords] = useState<ExtendedPlayRecord[]>([]);
  const [historyRecords, setHistoryRecords] = useState<ExtendedPlayRecord[]>([]);

  useEffect(() => {
    loadPlayRecords();

    // 监听播放记录更新事件
    const unsubscribePlayRecords = subscribeToDataUpdates(
      'playRecordsUpdated',
      () => {
        console.log('播放记录已更新，重新加载数据');
        loadPlayRecords();
      }
    );

    return () => {
      unsubscribePlayRecords();
    };
  }, []);

  const loadPlayRecords = async () => {
    try {
      setIsLoading(true);
      const recordsObj = await getAllPlayRecords();

      // 将Record转换为数组并按时间排序，同时为每个记录添加id
      const records = Object.entries(recordsObj).map(([key, record]) => ({
        ...record,
        id: key
      })).sort((a, b) => b.save_time - a.save_time);

      // 检查每个记录是否有更新
      const recordsWithUpdates = await Promise.all(
        records.map(async (record) => {
          try {
            // 这里可以添加检查更新的逻辑
            // 暂时返回原记录，设置默认的hasUpdate为false
            return {
              ...record,
              hasUpdate: false, // 默认没有更新
              newEpisodes: 0    // 默认没有新剧集
            };
          } catch (error) {
            console.error(`检查更新失败: ${record.title}`, error);
            return {
              ...record,
              hasUpdate: false,
              newEpisodes: 0
            };
          }
        })
      );

      setPlayRecords(recordsWithUpdates);

      // 分离有更新和历史记录
      const updated = recordsWithUpdates.filter(record => record.hasUpdate);
      const history = recordsWithUpdates.filter(record => !record.hasUpdate);

      setUpdatedRecords(updated);
      setHistoryRecords(history);
    } catch (error) {
      console.error('加载播放记录失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayRecord = (record: ExtendedPlayRecord) => {
    const searchParams = new URLSearchParams({
      source: record.source_name,
      title: record.search_title || record.title,
      year: record.year,
      episode: record.index.toString(),
    });

    router.push(`/search?${searchParams.toString()}`);
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      // 这里需要实现删除单个记录的逻辑
      console.log('删除记录:', recordId);
      await loadPlayRecords(); // 重新加载数据
    } catch (error) {
      console.error('删除记录失败:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      setIsClearing(true);
      await clearAllPlayRecords();
      setPlayRecords([]);
      setUpdatedRecords([]);
      setHistoryRecords([]);
      setShowClearConfirm(false);
    } catch (error) {
      console.error('清空记录失败:', error);
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              我的观看
            </h1>
          </div>
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              我的观看
            </h1>
          </div>

          {playRecords.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors sm:gap-2 sm:px-4 sm:py-2 sm:text-base sm:rounded-lg"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              清空所有数据
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
                <ScrollableRow>
                  {updatedRecords.map((record) => (
                    <div key={record.id} className="relative">
                      <VideoCard
                        id={record.id}
                        title={record.title}
                        poster={record.cover}
                        year={record.year}
                        source={record.source_name}
                        onClick={() => handlePlayRecord(record)}
                        showProgress={true}
                        progress={(record.play_time / record.total_time) * 100}
                        currentEpisode={record.index}
                        totalEpisodes={record.total_episodes}
                        className="min-w-[160px] sm:min-w-[200px]"
                      />
                      {record.hasUpdate && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                          新
                        </div>
                      )}
                    </div>
                  ))}
                </ScrollableRow>
              </div>
            )}

            {/* 观看历史 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                观看历史
              </h2>
              <ScrollableRow>
                {historyRecords.map((record) => (
                  <VideoCard
                    key={record.id}
                    id={record.id}
                    title={record.title}
                    poster={record.cover}
                    year={record.year}
                    source={record.source_name}
                    onClick={() => handlePlayRecord(record)}
                    showProgress={true}
                    progress={(record.play_time / record.total_time) * 100}
                    currentEpisode={record.index}
                    totalEpisodes={record.total_episodes}
                    className="min-w-[160px] sm:min-w-[200px]"
                  />
                ))}
              </ScrollableRow>
            </div>
          </div>
        )}

        {/* 清空确认对话框 */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  确认清空
                </h3>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                确定要清空所有观看记录吗？此操作不可撤销。
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  disabled={isClearing}
                >
                  取消
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors disabled:opacity-50"
                  disabled={isClearing}
                >
                  {isClearing ? '清空中...' : '确认清空'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}