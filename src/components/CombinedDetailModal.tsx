import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { DoubanDetail, SearchResult } from '@/lib/types';
import { processImageUrl } from '@/lib/utils';

interface CombinedDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlay: () => void;
  doubanDetail: DoubanDetail | null;
  videoDetail: SearchResult | null;
  isLoading: boolean;
  poster: string;
  title: string;
}

const CombinedDetailModal: React.FC<CombinedDetailModalProps> = ({
  isOpen,
  onClose,
  onPlay,
  doubanDetail,
  videoDetail,
  isLoading,
  poster,
  title,
}) => {
  const [countdown, setCountdown] = useState(5);
  const [progress, setProgress] = useState(0);

  const posterUrl = useMemo(() => {
    // 优先使用豆瓣海报，但如果豆瓣海报无效则回退到原始海报
    const doubanPoster = doubanDetail?.poster;
    // 检查豆瓣海报是否有效（不为空且不是无效URL）
    const isDoubanPosterValid = doubanPoster && 
      doubanPoster.trim() !== '' && 
      doubanPoster !== 'undefined' && 
      doubanPoster !== 'null' &&
      !doubanPoster.includes('default') &&
      !doubanPoster.includes('placeholder');
    
    const url = isDoubanPosterValid ? doubanPoster : poster;
    return processImageUrl(url);
  }, [doubanDetail, poster]);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      setProgress(0);
      return;
    }

    if (doubanDetail && !isLoading) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onPlay();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const progressInterval = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return oldProgress + 100 / 50; // 5s * 10 frames/s
        });
      }, 100); // update progress every 100ms

      return () => {
        clearInterval(timer);
        clearInterval(progressInterval);
      };
    }
  }, [isOpen, doubanDetail, isLoading, onPlay]);

  if (!isOpen) {
    return null;
  }

  const renderDetailItem = (label: string, value?: string | string[] | null) => {
    if (!value) return null;
    const displayValue = Array.isArray(value) ? value.join(' / ') : value;
    return (
      <div className="flex text-sm mb-2">
        <span className="text-gray-400 w-24 flex-shrink-0">{label}</span>
        <span className="text-white flex-grow">{displayValue}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 bg-opacity-90 rounded-lg shadow-lg w-full max-w-4xl h-auto max-h-[80vh] flex overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
        >
          <X size={24} />
        </button>

        <div className="w-1/3 flex-shrink-0 relative">
          <Image
            src={posterUrl}
            alt={title}
            layout="fill"
            objectFit="cover"
            className="rounded-l-lg"
          />
        </div>

        <div className="w-2/3 p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">{doubanDetail?.title || title}</h2>

            {isLoading && !doubanDetail ? (
              <div className="flex items-center justify-center h-full">
                <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                  {renderDetailItem('年份', doubanDetail?.year)}
                  {renderDetailItem('豆瓣评分', doubanDetail?.rate)}
                  {renderDetailItem('类型', doubanDetail?.genres)}
                  {renderDetailItem('制片国家/地区', doubanDetail?.countries)}
                  {renderDetailItem('语言', doubanDetail?.languages)}
                  {videoDetail?.source_name && renderDetailItem('来源', videoDetail.source_name)}
                </div>

                <h3 className="text-lg font-semibold text-white mt-6 mb-2">简介</h3>
                <p className="text-gray-300 text-sm leading-relaxed max-h-48 overflow-y-auto">
                  {doubanDetail?.plot_summary}
                </p>
              </>
            )}
          </div>

          <div className="mt-8">
            {doubanDetail && !isLoading && (
              <div className="w-full mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{countdown}s 后自动播放</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
            <div className="flex space-x-4">
              <button
                onClick={onPlay}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
              >
                立即播放
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .loader {
          border-top-color: #3498db;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default CombinedDetailModal;