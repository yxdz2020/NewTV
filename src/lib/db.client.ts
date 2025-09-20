'use client';

import { SkipConfig } from './types';
import { getAuthInfoFromBrowserCookie } from './auth';

// ---- 错误处理 ----
function triggerGlobalError(message: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('globalError', {
        detail: { message },
      })
    );
  }
}

// ---- 播放记录类型 ----
export interface PlayRecord {
  title: string;
  source_name: string;
  year: string;
  cover: string;
  index: number; // 第几集
  total_episodes: number; // 总集数
  play_time: number; // 播放进度（秒）
  total_time: number; // 总进度（秒）
  save_time: number; // 记录保存时间（时间戳）
  search_title?: string; // 搜索时使用的标题
}

// ---- 收藏类型 ----
export interface Favorite {
  title: string;
  source_name: string;
  year: string;
  cover: string;
  total_episodes: number;
  save_time: number;
  search_title?: string;
  origin?: 'vod' | 'live';
}

// ---- 缓存数据结构 ----
interface CacheData<T> {
  data: T;
  timestamp: number;
  version: string;
}

interface UserCacheStore {
  playRecords?: CacheData<Record<string, PlayRecord>>;
  favorites?: CacheData<Record<string, Favorite>>;
  searchHistory?: CacheData<string[]>;
  skipConfigs?: CacheData<Record<string, SkipConfig>>;
  doubanDetails?: CacheData<Record<string, any>>;
  doubanLists?: CacheData<Record<string, any>>;
}

// ---- 常量定义 ----
const PLAY_RECORDS_KEY = 'moontv_play_records';
const FAVORITES_KEY = 'moontv_favorites';
const SEARCH_HISTORY_KEY = 'moontv_search_history';

const CACHE_PREFIX = 'moontv_cache_';
const CACHE_VERSION = '1.0.0';
const CACHE_EXPIRE_TIME = 60 * 60 * 1000; // 一小时缓存过期

const DOUBAN_CACHE_EXPIRE = {
  details: 4 * 60 * 60 * 1000,  // 详情4小时（变化较少）
  lists: 2 * 60 * 60 * 1000,   // 列表2小时（更新频繁）
};

const STORAGE_TYPE = (() => {
  if (typeof window === 'undefined') return 'memory';
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return 'localStorage';
  } catch {
    return 'memory';
  }
})();

const SEARCH_HISTORY_LIMIT = 20;

// ---- 缓存管理器 ----
class HybridCacheManager {
  private static instance: HybridCacheManager;

  static getInstance(): HybridCacheManager {
    if (!HybridCacheManager.instance) {
      HybridCacheManager.instance = new HybridCacheManager();
    }
    return HybridCacheManager.instance;
  }

  private getCurrentUsername(): string | null {
    return getAuthInfoFromBrowserCookie()?.username || null;
  }

  private getUserCacheKey(username: string): string {
    return `${CACHE_PREFIX}${username}`;
  }

  private getUserCache(username: string): UserCacheStore {
    if (STORAGE_TYPE === 'memory') return {};
    
    try {
      const cacheKey = this.getUserCacheKey(username);
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }

  private saveUserCache(username: string, cache: UserCacheStore): void {
    if (STORAGE_TYPE === 'memory') return;
    
    try {
      const cacheKey = this.getUserCacheKey(username);
      this.cleanOldCache(cache);
      localStorage.setItem(cacheKey, JSON.stringify(cache));
    } catch (error) {
      console.warn('保存用户缓存失败:', error);
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        try {
          this.clearAllCache();
          localStorage.setItem(this.getUserCacheKey(username), JSON.stringify(cache));
        } catch {
          console.error('清理缓存后仍无法保存');
        }
      }
    }
  }

  private cleanOldCache(cache: UserCacheStore): void {
    const now = Date.now();
    
    if (cache.playRecords && !this.isCacheValid(cache.playRecords)) {
      delete cache.playRecords;
    }
    
    if (cache.favorites && !this.isCacheValid(cache.favorites)) {
      delete cache.favorites;
    }
    
    if (cache.searchHistory && !this.isCacheValid(cache.searchHistory)) {
      delete cache.searchHistory;
    }
    
    if (cache.skipConfigs && !this.isCacheValid(cache.skipConfigs)) {
      delete cache.skipConfigs;
    }
  }

  private clearAllCache(): void {
    if (STORAGE_TYPE === 'memory') return;
    
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('清理缓存失败:', error);
    }
  }

  private isCacheValid<T>(cache: CacheData<T>): boolean {
    const now = Date.now();
    return cache.version === CACHE_VERSION && 
           (now - cache.timestamp) < CACHE_EXPIRE_TIME;
  }

  private createCacheData<T>(data: T): CacheData<T> {
    return {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION
    };
  }

  getCachedPlayRecords(): Record<string, PlayRecord> | null {
    const username = this.getCurrentUsername();
    if (!username) return null;
    
    const userCache = this.getUserCache(username);
    const cached = userCache.playRecords;
    
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }
    
    return null;
  }

  cachePlayRecords(data: Record<string, PlayRecord>): void {
    const username = this.getCurrentUsername();
    if (username) {
      const userCache = this.getUserCache(username);
      userCache.playRecords = this.createCacheData(data);
      this.saveUserCache(username, userCache);
    }
  }

  getCachedFavorites(): Record<string, Favorite> | null {
    const username = this.getCurrentUsername();
    if (!username) return null;
    
    const userCache = this.getUserCache(username);
    const cached = userCache.favorites;
    
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }
    
    return null;
  }

  cacheFavorites(data: Record<string, Favorite>): void {
    const username = this.getCurrentUsername();
    if (username) {
      const userCache = this.getUserCache(username);
      userCache.favorites = this.createCacheData(data);
      this.saveUserCache(username, userCache);
    }
  }

  getCachedSearchHistory(): string[] | null {
    const username = this.getCurrentUsername();
    if (!username) return null;
    
    const userCache = this.getUserCache(username);
    const cached = userCache.searchHistory;
    
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }
    
    return null;
  }

  cacheSearchHistory(data: string[]): void {
    const username = this.getCurrentUsername();
    if (username) {
      const userCache = this.getUserCache(username);
      userCache.searchHistory = this.createCacheData(data);
      this.saveUserCache(username, userCache);
    }
  }

  getCachedSkipConfigs(): Record<string, SkipConfig> | null {
    const username = this.getCurrentUsername();
    if (!username) return null;
    
    const userCache = this.getUserCache(username);
    const cached = userCache.skipConfigs;
    
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }
    
    return null;
  }

  cacheSkipConfigs(data: Record<string, SkipConfig>): void {
    const username = this.getCurrentUsername();
    if (username) {
      const userCache = this.getUserCache(username);
      userCache.skipConfigs = this.createCacheData(data);
      this.saveUserCache(username, userCache);
    }
  }

  clearUserCache(username?: string): void {
    if (STORAGE_TYPE === 'memory') return;
    
    const targetUsername = username || this.getCurrentUsername();
    if (targetUsername) {
      try {
        const cacheKey = this.getUserCacheKey(targetUsername);
        localStorage.removeItem(cacheKey);
      } catch (error) {
        console.warn('清除用户缓存失败:', error);
      }
    }
  }

  clearExpiredCaches(): void {
    if (STORAGE_TYPE === 'memory') return;
    
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
          try {
            const cached = JSON.parse(localStorage.getItem(key) || '{}');
            let hasValidCache = false;
            
            for (const cacheKey of ['playRecords', 'favorites', 'searchHistory', 'skipConfigs']) {
              if (cached[cacheKey] && this.isCacheValid(cached[cacheKey])) {
                hasValidCache = true;
                break;
              }
            }
            
            if (!hasValidCache) {
              localStorage.removeItem(key);
            }
          } catch {
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn('清理过期缓存失败:', error);
    }
  }

  // 豆瓣缓存相关方法
  private isDoubanCacheValid<T>(cache: CacheData<T>, type: 'details' | 'lists'): boolean {
    const now = Date.now();
    const expireTime = DOUBAN_CACHE_EXPIRE[type];
    return cache.version === CACHE_VERSION && 
           (now - cache.timestamp) < expireTime;
  }

  getDoubanDetails(id: string): any | null {
    const username = this.getCurrentUsername();
    if (!username) return null;
    
    const userCache = this.getUserCache(username);
    const cached = userCache.doubanDetails;
    
    if (cached && this.isDoubanCacheValid(cached, 'details')) {
      return cached.data[id] || null;
    }
    
    return null;
  }

  setDoubanDetails(id: string, data: any): void {
    const username = this.getCurrentUsername();
    if (username) {
      const userCache = this.getUserCache(username);
      
      if (!userCache.doubanDetails || !this.isDoubanCacheValid(userCache.doubanDetails, 'details')) {
        userCache.doubanDetails = this.createCacheData({});
      }
      
      userCache.doubanDetails.data[id] = data;
      userCache.doubanDetails.timestamp = Date.now();
      
      this.saveUserCache(username, userCache);
    }
  }

  getDoubanList(cacheKey: string): any | null {
    const username = this.getCurrentUsername();
    if (!username) return null;
    
    const userCache = this.getUserCache(username);
    const cached = userCache.doubanLists;
    
    if (cached && this.isDoubanCacheValid(cached, 'lists')) {
      return cached.data[cacheKey] || null;
    }
    
    return null;
  }

  setDoubanList(cacheKey: string, data: any): void {
    const username = this.getCurrentUsername();
    if (username) {
      const userCache = this.getUserCache(username);
      
      if (!userCache.doubanLists || !this.isDoubanCacheValid(userCache.doubanLists, 'lists')) {
        userCache.doubanLists = this.createCacheData({});
      }
      
      userCache.doubanLists.data[cacheKey] = data;
      userCache.doubanLists.timestamp = Date.now();
      
      this.saveUserCache(username, userCache);
    }
  }

  static generateDoubanListKey(type: string, tag: string, pageStart: number, pageSize: number): string {
    return `${type}_${tag}_${pageStart}_${pageSize}`;
  }

  clearDoubanCache(): void {
    const username = this.getCurrentUsername();
    if (username) {
      const userCache = this.getUserCache(username);
      delete userCache.doubanDetails;
      delete userCache.doubanLists;
      this.saveUserCache(username, userCache);
    }
  }
}

const cacheManager = HybridCacheManager.getInstance();

// ---- 错误处理函数 ----
async function handleDatabaseOperationFailure(
  dataType: 'playRecords' | 'favorites' | 'searchHistory',
  error: any
): Promise<void> {
  console.error(`${dataType} 操作失败:`, error);
  
  if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
    triggerGlobalError('用户认证失败，请重新登录');
    return;
  }
  
  if (error?.message?.includes('403') || error?.message?.includes('Forbidden')) {
    triggerGlobalError('权限不足，无法执行此操作');
    return;
  }
  
  if (error?.message?.includes('500')) {
    triggerGlobalError('服务器内部错误，请稍后重试');
    return;
  }
  
  if (error?.message?.includes('Network')) {
    triggerGlobalError('网络连接失败，请检查网络设置');
    return;
  }
  
  triggerGlobalError(`${dataType} 操作失败，请稍后重试`);
}

// 清理过期缓存
if (typeof window !== 'undefined') {
  cacheManager.clearExpiredCaches();
}

// ---- 网络请求函数 ----
async function fetchWithAuth(
  url: string,
  options?: RequestInit,
  retryCount = 0
): Promise<Response> {
  const maxRetries = 3;
  const retryDelay = 1000 * Math.pow(2, retryCount); // 指数退避

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
    });

    if (response.status === 401) {
      throw new Error('Unauthorized');
    }

    if (!response.ok && response.status >= 500 && retryCount < maxRetries) {
      console.warn(`请求失败，${retryDelay}ms 后重试 (${retryCount + 1}/${maxRetries}):`, response.status);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchWithAuth(url, options, retryCount + 1);
    }

    return response;
  } catch (error) {
    if (retryCount < maxRetries && error instanceof Error && 
        (error.message.includes('fetch') || error.message.includes('network'))) {
      console.warn(`网络错误，${retryDelay}ms 后重试 (${retryCount + 1}/${maxRetries}):`, error.message);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchWithAuth(url, options, retryCount + 1);
    }
    throw error;
  }
}

async function fetchFromApi<T>(path: string): Promise<T> {
  const response = await fetchWithAuth(path);
  return response.json();
}

// ---- 工具函数 ----
export function generateStorageKey(source: string, id: string): string {
  return `${source}:${id}`;
}

// ---- 播放记录相关函数 ----
export async function getAllPlayRecords(): Promise<Record<string, PlayRecord>> {
  try {
    // 先尝试从缓存获取
    const cached = cacheManager.getCachedPlayRecords();
    if (cached) {
      return cached;
    }

    // 从服务器获取
    const response = await fetchWithAuth('/api/play-records');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const records = data.records || {};

    // 缓存数据
    cacheManager.cachePlayRecords(records);

    return records;
  } catch (error) {
    console.error('获取播放记录失败:', error);
    await handleDatabaseOperationFailure('playRecords', error);
    
    // 返回缓存数据或空对象
    return cacheManager.getCachedPlayRecords() || {};
  }
}

export async function savePlayRecord(
  source: string,
  id: string,
  record: PlayRecord
): Promise<void> {
  try {
    const key = generateStorageKey(source, id);
    
    // 先更新本地缓存
    const cachedRecords = cacheManager.getCachedPlayRecords() || {};
    cachedRecords[key] = record;
    cacheManager.cachePlayRecords(cachedRecords);

    // 发送到服务器
    const response = await fetchWithAuth('/api/play-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key,
        record,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 触发播放记录更新事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('playRecordsUpdated', {
          detail: cachedRecords,
        })
      );
    }

  } catch (error) {
    console.error('保存播放记录失败:', error);
    await handleDatabaseOperationFailure('playRecords', error);
    throw error;
  }
}

export async function deletePlayRecord(
  source: string,
  id: string
): Promise<void> {
  try {
    const key = generateStorageKey(source, id);
    
    // 先更新本地缓存
    const cachedRecords = cacheManager.getCachedPlayRecords() || {};
    delete cachedRecords[key];
    cacheManager.cachePlayRecords(cachedRecords);

    // 发送到服务器
    const response = await fetchWithAuth('/api/play-records', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 触发播放记录更新事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('playRecordsUpdated', {
          detail: cachedRecords,
        })
      );
    }

  } catch (error) {
    console.error('删除播放记录失败:', error);
    await handleDatabaseOperationFailure('playRecords', error);
    throw error;
  }
}

// ---- 搜索历史相关函数 ----
export async function getSearchHistory(): Promise<string[]> {
  try {
    // 先尝试从缓存获取
    const cached = cacheManager.getCachedSearchHistory();
    if (cached) {
      return cached;
    }

    // 从服务器获取
    const response = await fetchWithAuth('/api/search-history');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const history = data.history || [];

    // 缓存数据
    cacheManager.cacheSearchHistory(history);

    return history;
  } catch (error) {
    console.error('获取搜索历史失败:', error);
    await handleDatabaseOperationFailure('searchHistory', error);
    
    // 返回缓存数据或空数组
    return cacheManager.getCachedSearchHistory() || [];
  }
}

export async function addSearchHistory(keyword: string): Promise<void> {
  try {
    // 先更新本地缓存
    const cachedHistory = cacheManager.getCachedSearchHistory() || [];
    const newHistory = [keyword, ...cachedHistory.filter(h => h !== keyword)].slice(0, SEARCH_HISTORY_LIMIT);
    cacheManager.cacheSearchHistory(newHistory);

    // 发送到服务器
    const response = await fetchWithAuth('/api/search-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keyword }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 触发搜索历史更新事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('searchHistoryUpdated', {
          detail: newHistory,
        })
      );
    }

  } catch (error) {
    console.error('添加搜索历史失败:', error);
    await handleDatabaseOperationFailure('searchHistory', error);
    throw error;
  }
}

export async function clearSearchHistory(): Promise<void> {
  try {
    // 先更新本地缓存
    cacheManager.cacheSearchHistory([]);

    // 发送到服务器
    const response = await fetchWithAuth('/api/search-history', {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 触发搜索历史更新事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('searchHistoryUpdated', {
          detail: [],
        })
      );
    }

  } catch (error) {
    console.error('清除搜索历史失败:', error);
    await handleDatabaseOperationFailure('searchHistory', error);
    throw error;
  }
}

export async function deleteSearchHistory(keyword: string): Promise<void> {
  try {
    // 先更新本地缓存
    const cachedHistory = cacheManager.getCachedSearchHistory() || [];
    const newHistory = cachedHistory.filter(h => h !== keyword);
    cacheManager.cacheSearchHistory(newHistory);

    // 发送到服务器
    const response = await fetchWithAuth('/api/search-history', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keyword }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 触发搜索历史更新事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('searchHistoryUpdated', {
          detail: newHistory,
        })
      );
    }

  } catch (error) {
    console.error('删除搜索历史失败:', error);
    await handleDatabaseOperationFailure('searchHistory', error);
    throw error;
  }
}

// ---- 收藏相关函数 ----
export async function getAllFavorites(): Promise<Record<string, Favorite>> {
  try {
    // 先尝试从缓存获取
    const cached = cacheManager.getCachedFavorites();
    if (cached) {
      return cached;
    }

    // 从服务器获取
    const response = await fetchWithAuth('/api/favorites');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const favorites = data.favorites || {};

    // 缓存数据
    cacheManager.cacheFavorites(favorites);

    return favorites;
  } catch (error) {
    console.error('获取收藏失败:', error);
    await handleDatabaseOperationFailure('favorites', error);
    
    // 返回缓存数据或空对象
    return cacheManager.getCachedFavorites() || {};
  }
}

export async function saveFavorite(
  source: string,
  id: string,
  favorite: Favorite
): Promise<void> {
  try {
    const key = generateStorageKey(source, id);
    
    // 先更新本地缓存
    const cachedFavorites = cacheManager.getCachedFavorites() || {};
    cachedFavorites[key] = favorite;
    cacheManager.cacheFavorites(cachedFavorites);

    // 发送到服务器
    const response = await fetchWithAuth('/api/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key,
        favorite,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 触发收藏更新事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('favoritesUpdated', {
          detail: cachedFavorites,
        })
      );
    }

  } catch (error) {
    console.error('保存收藏失败:', error);
    await handleDatabaseOperationFailure('favorites', error);
    throw error;
  }
}

export async function deleteFavorite(
  source: string,
  id: string
): Promise<void> {
  try {
    const key = generateStorageKey(source, id);
    
    // 先更新本地缓存
    const cachedFavorites = cacheManager.getCachedFavorites() || {};
    delete cachedFavorites[key];
    cacheManager.cacheFavorites(cachedFavorites);

    // 发送到服务器
    const response = await fetchWithAuth('/api/favorites', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 触发收藏更新事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('favoritesUpdated', {
          detail: cachedFavorites,
        })
      );
    }

  } catch (error) {
    console.error('删除收藏失败:', error);
    await handleDatabaseOperationFailure('favorites', error);
    throw error;
  }
}

export async function isFavorited(
  source: string,
  id: string
): Promise<boolean> {
  try {
    const key = generateStorageKey(source, id);
    const favorites = await getAllFavorites();
    return key in favorites;
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    return false;
  }
}

// ---- 数据清理函数 ----
export async function clearAllPlayRecords(): Promise<void> {
  try {
    // 先更新本地缓存
    cacheManager.cachePlayRecords({});

    // 发送到服务器
    const response = await fetchWithAuth('/api/play-records/clear', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 触发播放记录更新事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('playRecordsUpdated', {
          detail: {},
        })
      );
    }

  } catch (error) {
    console.error('清除所有播放记录失败:', error);
    await handleDatabaseOperationFailure('playRecords', error);
    throw error;
  }
}

export async function clearAllFavorites(): Promise<void> {
  try {
    // 先更新本地缓存
    cacheManager.cacheFavorites({});

    // 发送到服务器
    const response = await fetchWithAuth('/api/favorites/clear', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 触发收藏更新事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('favoritesUpdated', {
          detail: {},
        })
      );
    }

  } catch (error) {
    console.error('清除所有收藏失败:', error);
    await handleDatabaseOperationFailure('favorites', error);
    throw error;
  }
}

// ---- 缓存管理函数 ----
export function clearUserCache(): void {
  cacheManager.clearUserCache();
}

export async function refreshAllCache(): Promise<void> {
  try {
    // 清除所有缓存
    clearUserCache();
    
    // 重新加载数据
    await Promise.all([
      getAllPlayRecords(),
      getAllFavorites(),
      getSearchHistory(),
      getAllSkipConfigs(),
    ]);
    
    console.log('所有缓存已刷新');
  } catch (error) {
    console.error('刷新缓存失败:', error);
    throw error;
  }
}

export async function preloadUserData(): Promise<void> {
  try {
    await Promise.all([
      getAllPlayRecords(),
      getAllFavorites(),
      getSearchHistory(),
    ]);
    console.log('用户数据预加载完成');
  } catch (error) {
    console.error('预加载用户数据失败:', error);
  }
}

// ---- 跳过配置相关函数 ----
export async function getSkipConfig(
  source: string,
  id: string
): Promise<SkipConfig | null> {
  try {
    const key = generateStorageKey(source, id);
    
    // 先尝试从缓存获取
    const cached = cacheManager.getCachedSkipConfigs();
    if (cached && cached[key]) {
      return cached[key];
    }

    // 从服务器获取
    const response = await fetchWithAuth(`/api/skip-configs?key=${encodeURIComponent(key)}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const config = data.config;

    // 更新缓存
    const cachedConfigs = cached || {};
    if (config) {
      cachedConfigs[key] = config;
    }
    cacheManager.cacheSkipConfigs(cachedConfigs);

    return config;
  } catch (error) {
    console.error('获取跳过配置失败:', error);
    return null;
  }
}

export async function saveSkipConfig(
  source: string,
  id: string,
  config: SkipConfig
): Promise<void> {
  try {
    const key = generateStorageKey(source, id);
    
    // 先更新本地缓存
    const cachedConfigs = cacheManager.getCachedSkipConfigs() || {};
    cachedConfigs[key] = config;
    cacheManager.cacheSkipConfigs(cachedConfigs);

    // 发送到服务器
    const response = await fetchWithAuth('/api/skip-configs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key,
        config,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 触发跳过配置更新事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('skipConfigsUpdated', {
          detail: cachedConfigs,
        })
      );
    }

  } catch (error) {
    console.error('保存跳过配置失败:', error);
    throw error;
  }
}

export async function getAllSkipConfigs(): Promise<Record<string, SkipConfig>> {
  try {
    // 先尝试从缓存获取
    const cached = cacheManager.getCachedSkipConfigs();
    if (cached) {
      return cached;
    }

    // 从服务器获取
    const response = await fetchWithAuth('/api/skip-configs');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const configs = data.configs || {};

    // 缓存数据
    cacheManager.cacheSkipConfigs(configs);

    return configs;
  } catch (error) {
    console.error('获取所有跳过配置失败:', error);
    
    // 返回缓存数据或空对象
    return cacheManager.getCachedSkipConfigs() || {};
  }
}

export async function deleteSkipConfig(
  source: string,
  id: string
): Promise<void> {
  try {
    const key = generateStorageKey(source, id);
    
    // 先更新本地缓存
    const cachedConfigs = cacheManager.getCachedSkipConfigs() || {};
    delete cachedConfigs[key];
    cacheManager.cacheSkipConfigs(cachedConfigs);

    // 发送到服务器
    const response = await fetchWithAuth('/api/skip-configs', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 触发跳过配置更新事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('skipConfigsUpdated', {
          detail: cachedConfigs,
        })
      );
    }

  } catch (error) {
    console.error('删除跳过配置失败:', error);
    throw error;
  }
}

// ---- 豆瓣缓存相关函数 ----
export function getDoubanDetailsCache(id: string): any | null {
  return cacheManager.getDoubanDetails(id);
}

export function setDoubanDetailsCache(id: string, data: any): void {
  cacheManager.setDoubanDetails(id, data);
}

export function getDoubanListCache(type: string, tag: string, pageStart: number, pageSize: number): any | null {
  const cacheKey = HybridCacheManager.generateDoubanListKey(type, tag, pageStart, pageSize);
  return cacheManager.getDoubanList(cacheKey);
}

export function setDoubanListCache(type: string, tag: string, pageStart: number, pageSize: number, data: any): void {
  const cacheKey = HybridCacheManager.generateDoubanListKey(type, tag, pageStart, pageSize);
  cacheManager.setDoubanList(cacheKey, data);
}

export function clearDoubanCache(): void {
  cacheManager.clearDoubanCache();
}

// ---- 缓存状态函数 ----
export function getCacheStatus(): {
  hasPlayRecords: boolean;
  hasFavorites: boolean;
  hasSearchHistory: boolean;
  hasSkipConfigs: boolean;
  username: string | null;
} {
  const username = getAuthInfoFromBrowserCookie()?.username || null;
  
  return {
    hasPlayRecords: !!cacheManager.getCachedPlayRecords(),
    hasFavorites: !!cacheManager.getCachedFavorites(),
    hasSearchHistory: !!cacheManager.getCachedSearchHistory(),
    hasSkipConfigs: !!cacheManager.getCachedSkipConfigs(),
    username,
  };
}

// ---- 事件类型定义 ----
export type CacheUpdateEvent =
  | 'playRecordsUpdated'
  | 'favoritesUpdated'
  | 'searchHistoryUpdated'
  | 'skipConfigsUpdated';

// ---- 事件订阅函数 ----
export function subscribeToDataUpdates<T>(
  eventType: CacheUpdateEvent,
  callback: (data: T) => void
): () => void {
  const handleEvent = (event: CustomEvent) => {
    callback(event.detail);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(eventType, handleEvent as EventListener);
    
    return () => {
      window.removeEventListener(eventType, handleEvent as EventListener);
    };
  }
  
  // Return empty cleanup function for server-side rendering
  return () => {
    // No cleanup needed when window is not available
  };
}
