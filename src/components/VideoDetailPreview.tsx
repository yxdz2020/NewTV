'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

import { SearchResult } from '@/lib/types';
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

  useEffect(() => {
    if (isVisible && detail) {
      setIsAnimating(true);
      setCountdown(duration / 1000);
      
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
      <div className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden transform transition-all duration-300 ${
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

        <div className="flex flex-col md:flex-row">
          {/* 海报图片 */}
          <div className="md:w-1/3 aspect-[3/4] relative bg-gray-200 dark:bg-gray-700">
            {detail.poster ? (
              <Image
                src={processImageUrl(detail.poster)}
                alt={detail.title}
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
          <div className="md:w-2/3 p-6 space-y-4">
            {/* 标题 */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white line-clamp-2">
              {detail.title}
            </h2>

            {/* 基本信息 */}
            <div className="flex flex-wrap gap-2 text-sm">
              {detail.year && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                  {detail.year}
                </span>
              )}
              {detail.type_name && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                  {detail.type_name}
                </span>
              )}
              {detail.source_name && (
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                  {detail.source_name}
                </span>
              )}
            </div>

            {/* 集数信息 */}
            {detail.episodes && detail.episodes.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">总集数：</span>
                <span className="text-blue-600 dark:text-blue-400">{detail.episodes.length} 集</span>
              </div>
            )}

            {/* 简介 */}
            {detail.desc && (
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900 dark:text-white">剧情简介</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4">
                  {detail.desc}
                </p>
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
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200"
              >
                立即播放
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
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