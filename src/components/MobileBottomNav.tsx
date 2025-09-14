/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { Cat, Clapperboard, Clover, Cloud, Ellipsis, Film, Home, Radio, Star, Tv, Youtube } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface MobileBottomNavProps {
  /**
   * 主动指定当前激活的路径。当未提供时，自动使用 usePathname() 获取的路径。
   */
  activePath?: string;
}

const MobileBottomNav = ({ activePath }: MobileBottomNavProps) => {
  const pathname = usePathname();

  // 当前激活路径：优先使用传入的 activePath，否则回退到浏览器地址
  const currentActive = activePath ?? pathname;

  const [navItems, setNavItems] = useState([
    { icon: Home, label: '首页', href: '/' },
    { icon: Film, label: '电影', href: '/douban?type=movie' },
    { icon: Tv, label: '剧集', href: '/douban?type=tv' },
    { icon: Radio, label: '直播', href: '/live' },
    { icon: Youtube, label: 'YouTube', href: '/youtube' },
    { icon: Ellipsis, label: '更多', href: '#more' },
  ]);

  const [showMore, setShowMore] = useState(false);
  const [hasCustom, setHasCustom] = useState(false);
  const [hasCloudDisk, setHasCloudDisk] = useState(false);
  const [cloudDiskName, setCloudDiskName] = useState('网盘');

  useEffect(() => {
    const runtimeConfig = (window as any).RUNTIME_CONFIG;
    setHasCustom(!!(runtimeConfig?.CUSTOM_CATEGORIES?.length > 0));
    setHasCloudDisk(!!(runtimeConfig?.CLOUD_DISK_CONFIG?.enabled));
    if (runtimeConfig?.CLOUD_DISK_CONFIG?.name) {
      setCloudDiskName(runtimeConfig.CLOUD_DISK_CONFIG.name);
    }
  }, []);

  const isActive = (href: string) => {
    // 解码URL以进行正确的比较
    const decodedActive = decodeURIComponent(currentActive);
    const decodedItemHref = decodeURIComponent(href);

    // 首页完全匹配
    if (href === '/' && decodedActive === '/') {
      return true;
    }

    // 直播页面匹配
    if (href === '/live' && decodedActive.startsWith('/live')) {
      return true;
    }

    // YouTube页面匹配
    if (href === '/youtube' && decodedActive.startsWith('/youtube')) {
      return true;
    }

    // 处理豆瓣类型页面的匹配
    if (href.startsWith('/douban?type=')) {
      const typeMatch = href.match(/type=([^&]+)/)?.[1];
      if (typeMatch && decodedActive.startsWith('/douban')) {
        // 使用更简单可靠的方法：直接解析查询字符串
        const queryString = decodedActive.split('?')[1];
        if (queryString) {
          const params = new URLSearchParams(queryString);
          const activeType = params.get('type');
          return activeType === typeMatch;
        }
        // 如果没有查询字符串，回退到字符串包含检查
        return decodedActive.includes(`type=${typeMatch}`);
      }
    }

    return false;
  };

  const moreActive =
    currentActive.includes('type=anime') ||
    currentActive.includes('type=show') ||
    currentActive.includes('type=short-drama') ||
    currentActive.includes('type=custom') ||
    currentActive.includes('/cloud-disk');

  return (
    <nav
      className='md:hidden fixed left-0 right-0 z-[600] glass-nav border-t border-white/20 overflow-visible dark:border-white/10'
      style={{
        /* 紧贴视口底部，同时在内部留出安全区高度 */
        bottom: 0,
        paddingBottom: 'env(safe-area-inset-bottom)',
        minHeight: 'calc(3.5rem + env(safe-area-inset-bottom))',
      }}
    >
      <ul className='grid grid-cols-6 w-full'>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <li
              key={item.href}
              className='flex justify-center items-center'
            >
              {item.label !== '更多' ? (
                <Link
                  href={item.href}
                  className='flex flex-col items-center justify-center w-full h-14 gap-1 text-xs transition-all duration-200 hover:bg-white/10 dark:hover:bg-white/5 rounded-lg'
                >
                  <item.icon
                    className={`h-6 w-6 transition-colors duration-200 ${active
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400'
                      }`}
                  />
                  <span
                    className={`transition-colors duration-200 ${active
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300'
                      } ${item.label === 'YouTube' ? 'text-[10px]' : 'text-xs'}`}
                  >
                    {item.label}
                  </span>
                </Link>
              ) : (
                <button
                  type='button'
                  onClick={() => setShowMore((v) => !v)}
                  className='flex flex-col items-center justify-center w-full h-14 gap-1 text-xs transition-all duration-200 hover:bg-white/10 dark:hover:bg-white/5 rounded-lg'
                >
                  <item.icon
                    className={`h-6 w-6 transition-colors duration-200 ${moreActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400'
                      }`}
                  />
                  <span className={`transition-colors duration-200 ${moreActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'} text-xs`}>
                    更多
                  </span>
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {showMore && (
        <div className='absolute bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.5rem)] left-0 right-0 z-[650] px-4'>
          <div className='mx-auto max-w-sm glass-strong border border-white/20 dark:border-white/10 shadow-floating rounded-apple-xl'>
            <div className='flex divide-x divide-gray-200/60 dark:divide-gray-700/60'>
              <Link
                href='/douban?type=short-drama'
                className='flex-1 px-2 py-3 flex items-center justify-center gap-1 text-xs text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                onClick={() => setShowMore(false)}
              >
                <Clapperboard className='h-4 w-4' /> 短剧
              </Link>
              <Link
                href='/douban?type=anime'
                className='flex-1 px-2 py-3 flex items-center justify-center gap-1 text-xs text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                onClick={() => setShowMore(false)}
              >
                <Cat className='h-4 w-4' /> 动漫
              </Link>
              <Link
                href='/douban?type=show'
                className='flex-1 px-2 py-3 flex items-center justify-center gap-1 text-xs text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                onClick={() => setShowMore(false)}
              >
                <Clover className='h-4 w-4' /> 综艺
              </Link>
              {hasCustom && (
                <Link
                  href='/douban?type=custom'
                  className='flex-1 px-2 py-3 flex items-center justify-center gap-1 text-xs text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                  onClick={() => setShowMore(false)}
                >
                  <Star className='h-4 w-4' /> 纪录
                </Link>
              )}
              {hasCloudDisk && (
                <Link
                  href='/cloud-disk'
                  className='flex-1 px-2 py-3 flex items-center justify-center gap-1 text-xs text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                  onClick={() => setShowMore(false)}
                >
                  <Cloud className='h-4 w-4' /> {cloudDiskName}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default MobileBottomNav;
