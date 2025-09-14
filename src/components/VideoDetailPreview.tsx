'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

import { SearchResult, DoubanItem } from '@/lib/types';
import { processImageUrl } from '@/lib/utils';

interface VideoDetailPreviewProps {
  detail: SearchResult | null;
  isVisible: boolean;
  onClose: () => void;
  onTimeout: () => void;
  duration?: number; // 展示时长，默认5秒
}

const VideoDetailPreview: React.FC<VideoDetailPreviewProps> = ({
  detail,
  isVisible,
  onClose,
  onTimeout,
  duration = 5000,
}) => {
  const [countdown, setCountdown] = useState(duration / 1000);
  const [isAnimating, setIsAnimating] = useState(false);
  const [doubanDetail, setDoubanDetail] = useState<DoubanItem | null>(null);
  const [loading, setLoading] = useState(false);

  // 获取豆瓣详情
  const fetchDoubanDetail = async (doubanId: number) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/douban/details?id=${doubanId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('豆瓣API返回数据:', data); // 调试日志
        if (data.code === 200) {
          setDoubanDetail(data.data);
        }
      }
    } catch (error) {
      console.error('获取豆瓣详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible && detail) {
      setIsAnimating(true);
      setCountdown(duration / 1000);
      
      // 如果有豆瓣ID，获取详细信息
      if (detail.douban_id) {
        fetchDoubanDetail(detail.douban_id);
      } else {
        setDoubanDetail(null);
      }
      
      // 倒计时
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // 自动关闭定时器
      const timeoutId = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => {
          onTimeout();
        }, 300); // 等待淡出动画完成
      }, duration);

      return () => {
      clearInterval(countdownInterval);
      clearTimeout(timeoutId);
      setDoubanDetail(null);
    };
    }
  }, [isVisible, detail, duration, onTimeout]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // 等待淡出动画完成
  };

  if (!isVisible || !detail) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-300 ${
      isAnimating ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden transform transition-all duration-300 ${
        isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors duration-200"
        >
          <X size={20} />
        </button>

        {/* 倒计时显示 */}
        <div className="absolute top-4 left-4 z-10 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          {countdown}s 后自动播放
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* 海报图片 */}
          <div className="lg:w-1/3 w-full aspect-[16/9] lg:aspect-[3/4] relative bg-gray-200 dark:bg-gray-700 flex-shrink-0">
            {(doubanDetail?.poster || detail.poster) ? (
              <Image
                src={processImageUrl(doubanDetail?.poster || detail.poster)}
                alt={doubanDetail?.title || detail.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-4xl">🎬</span>
              </div>
            )}
          </div>

          {/* 详情信息 */}
          <div className="lg:w-2/3 w-full p-4 lg:p-6 space-y-4 overflow-y-auto max-h-[70vh] lg:max-h-none">
            {/* 标题 */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white line-clamp-2">
              {doubanDetail?.title || detail.title}
            </h2>
            
            {/* 评分 */}
            {doubanDetail?.rate && (
              <div className="flex items-center gap-2">
                <span className="text-yellow-500 text-lg">⭐</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">{doubanDetail.rate}</span>
                <span className="text-sm text-gray-500">豆瓣评分</span>
              </div>
            )}

            {/* 基本信息网格布局 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 text-sm">
              {(doubanDetail?.year || detail.year) && (
                <div className="space-y-2">
                  <div className="text-gray-400">年份</div>
                  <div className="text-gray-900 dark:text-white">{doubanDetail?.year || detail.year}</div>
                </div>
              )}
              {detail.source_name && (
                <div className="space-y-2">
                  <div className="text-gray-400">来源</div>
                  <div className="text-gray-900 dark:text-white">{detail.source_name}</div>
                </div>
              )}
              {(doubanDetail?.genres?.length || detail.type_name) && (
                <div className="space-y-2">
                  <div className="text-gray-400">类型</div>
                  <div className="text-gray-900 dark:text-white">
                    {doubanDetail?.genres?.join('、') || detail.type_name}
                  </div>
                </div>
              )}
              {(doubanDetail?.countries?.length || detail.class) && (
                <div className="space-y-2">
                  <div className="text-gray-400">地区</div>
                  <div className="text-gray-900 dark:text-white">
                    {doubanDetail?.countries?.join('、') || detail.class}
                  </div>
                </div>
              )}
            </div>

            {/* 扩展信息网格 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 text-sm">
              {(doubanDetail?.episodes || (detail.episodes && detail.episodes.length > 0)) && (
                <div className="space-y-2">
                  <div className="text-gray-400">集数</div>
                  <div className="text-gray-900 dark:text-white">
                    共 {doubanDetail?.episodes || detail.episodes.length} 集
                    {doubanDetail?.episode_length && (
                      <span className="text-gray-500 ml-2">({doubanDetail.episode_length}分钟/集)</span>
                    )}
                  </div>
                </div>
              )}
              {doubanDetail?.directors && doubanDetail.directors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-gray-400">导演</div>
                  <div className="text-gray-900 dark:text-white">{doubanDetail.directors.join('、')}</div>
                </div>
              )}
              {doubanDetail?.cast && doubanDetail.cast.length > 0 && (
                <div className="space-y-2">
                  <div className="text-gray-400">主演</div>
                  <div className="text-gray-900 dark:text-white line-clamp-2">
                    {doubanDetail.cast.slice(0, 6).join('、')}
                    {doubanDetail.cast.length > 6 && '等'}
                  </div>
                </div>
              )}
              {doubanDetail?.first_aired && (
                <div className="space-y-2">
                  <div className="text-gray-400">首播</div>
                  <div className="text-gray-900 dark:text-white">{doubanDetail.first_aired}</div>
                </div>
              )}
              {doubanDetail?.screenwriters && doubanDetail.screenwriters.length > 0 && (
                <div className="space-y-2">
                  <div className="text-gray-400">编剧</div>
                  <div className="text-gray-900 dark:text-white line-clamp-2">
                    {doubanDetail.screenwriters.slice(0, 4).join('、')}
                    {doubanDetail.screenwriters.length > 4 && '等'}
                  </div>
                </div>
              )}
              {doubanDetail?.languages && doubanDetail.languages.length > 0 && (
                <div className="space-y-2">
                  <div className="text-gray-400">语言</div>
                  <div className="text-gray-900 dark:text-white">{doubanDetail.languages.join('、')}</div>
                </div>
              )}
            </div>

            {/* 简介 */}
            {(doubanDetail?.plot_summary || detail.desc) && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">简介</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {doubanDetail?.plot_summary || detail.desc}
                </p>
              </div>
            )}
            
            {/* 加载状态 */}
            {loading && detail.douban_id && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>正在获取详细信息...</span>
              </div>
            )}

            {/* 进度条 */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">自动播放进度</span>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {Math.round(((duration / 1000 - countdown) / (duration / 1000)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${((duration / 1000 - countdown) / (duration / 1000)) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-3 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 text-center"
              >
                立即播放
              </button>
              <button
                onClick={handleClose}
                className="flex-1 sm:flex-none px-4 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 text-center"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetailPreview;