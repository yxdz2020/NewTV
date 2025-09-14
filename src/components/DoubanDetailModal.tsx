'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

import { processImageUrl } from '@/lib/utils';

interface DoubanDetailModalProps {
  detail: any | null;
  isVisible: boolean;
  onClose: () => void;
  onTimeout: () => void;
  duration?: number; // ahow time, default 5s
}

const DoubanDetailModal: React.FC<DoubanDetailModalProps> = ({
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
      
      // countdown
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // auto close timer
      const timeoutId = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => {
          onTimeout();
        }, 300); // wait for fade out animation to complete
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
    }, 300); // wait for fade out animation to complete
  };

  if (!isVisible || !detail) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div 
         className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-hidden transform transition-all duration-300 ${
           isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
         }`}
         onClick={(e) => e.stopPropagation()}
       >
        {/* close button */}\
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors duration-200"
        >
          <X size={20} />
        </button>

        {/* countdown display */}\
        <div className="absolute top-4 left-4 z-10 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          {countdown}s
        </div>

        <div className="flex flex-col sm:flex-row h-full">
          {/* poster image */}\
          <div className="sm:w-1/3 w-full aspect-[16/9] sm:aspect-[3/4] relative bg-gray-200 dark:bg-gray-700 flex-shrink-0 max-h-[30vh] sm:max-h-none">
            {detail.poster ? (
              <Image
                src={processImageUrl(detail.poster)}
                alt={detail.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-4xl">🎬</span>
              </div>
            )}
          </div>

          {/* detail info */}\
          <div className="sm:w-2/3 w-full p-3 sm:p-6 space-y-2 sm:space-y-4 overflow-y-auto flex-1 min-h-0">
            {/* title */}\
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white line-clamp-2">
              {detail.title}
            </h2>

            {/* basic info grid layout */}\
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
              {detail.year && (
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="text-gray-400">年份</div>
                  <div className="text-gray-900 dark:text-white">{detail.year}</div>
                </div>
              )}
              {detail.rate && (
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="text-gray-400">豆瓣评分</div>
                  <div className="text-gray-900 dark:text-white">{detail.rate}</div>
                </div>
              )}
              {detail.genres && detail.genres.length > 0 && (
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="text-gray-400">类型</div>
                  <div className="text-gray-900 dark:text-white">{detail.genres.join(' / ')}</div>
                </div>
              )}
              {detail.countries && detail.countries.length > 0 && (
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="text-gray-400">制片国家/地区</div>
                  <div className="text-gray-900 dark:text-white">{detail.countries.join(' / ')}</div>
                </div>
              )}
              {detail.languages && detail.languages.length > 0 && (
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="text-gray-400">语言</div>
                  <div className="text-gray-900 dark:text-white">{detail.languages.join(' / ')}</div>
                </div>
              )}
              {detail.episodes && (
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="text-gray-400">集数</div>
                  <div className="text-gray-900 dark:text-white">{detail.episodes}</div>
                </div>
              )}
            </div>

            {/* summary */}\
            {detail.plot_summary && (
              <div className="space-y-1 sm:space-y-2">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">简介</h3>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-4 sm:line-clamp-5">
                  {detail.plot_summary}
                </p>
              </div>
            )}

            {/* progress bar */}\
            <div className="mt-2 sm:mt-4">
              <div className="flex justify-between items-center mb-1 sm:mb-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">auto play progress</span>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  {Math.round(((duration / 1000 - countdown) / (duration / 1000)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
                <div 
                  className="bg-blue-500 h-1.5 sm:h-2 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${((duration / 1000 - countdown) / (duration / 1000)) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* action buttons */}\
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-3">
              <button
                onClick={() => {
                  setIsAnimating(false);
                  setTimeout(() => {
                    onTimeout();
                  }, 300);
                }}
                className="flex-1 px-3 py-2 sm:px-4 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 text-center text-sm"
              >
                立即播放
              </button>
              <button
                onClick={handleClose}
                className="flex-1 sm:flex-none px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 text-center text-sm"
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

export default DoubanDetailModal;