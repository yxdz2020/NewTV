/* eslint-disable no-console, @typescript-eslint/no-explicit-any */

import { RedisStorage } from './redis.db';
import { KvrocksStorage } from './kvrocks.db';
import { UpstashRedisStorage } from './upstash.db';

// 缓存接口
interface CacheStorage {
  connect(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<void>;
}

// 缓存管理器类
export class CacheManager {
  private storages: CacheStorage[] = [];
  private primaryStorage: CacheStorage | null = null;

  constructor() {
    this.initializeStorages();
  }

  private initializeStorages() {
    // 按优先级顺序尝试初始化存储
    const storageConfigs = [
      {
        name: 'Redis',
        envVar: 'REDIS_URL',
        createStorage: () => new RedisStorage()
      },
      {
        name: 'KVRocks',
        envVar: 'KVROCKS_URL',
        createStorage: () => new KvrocksStorage()
      },
      {
        name: 'Upstash',
        envVar: 'UPSTASH_REDIS_REST_URL',
        createStorage: () => new UpstashRedisStorage()
      }
    ];

    for (const config of storageConfigs) {
      if (process.env[config.envVar]) {
        try {
          const storage = config.createStorage();
          this.storages.push(storage);
          if (!this.primaryStorage) {
            this.primaryStorage = storage;
            console.log(`使用 ${config.name} 作为主缓存存储`);
          }
        } catch (error) {
          console.warn(`初始化 ${config.name} 失败:`, error);
        }
      }
    }

    if (this.storages.length === 0) {
      console.warn('没有可用的缓存存储，缓存功能将被禁用');
    }
  }

  async connect(): Promise<void> {
    if (this.primaryStorage) {
      try {
        await this.primaryStorage.connect();
      } catch (error) {
        console.error('连接主缓存存储失败:', error);
      }
    }
  }

  async get(key: string): Promise<any> {
    if (!this.primaryStorage) {
      return null;
    }

    try {
      const value = await this.primaryStorage.get(key);
      if (value === null) {
        return null;
      }
      
      // 尝试解析JSON，如果失败则返回原始字符串
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('从缓存读取数据失败:', error);
      return null;
    }
  }

  async set(key: string, value: any, expirationSeconds?: number): Promise<void> {
    if (!this.primaryStorage) {
      return;
    }

    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      const options = expirationSeconds ? { EX: expirationSeconds } : undefined;
      
      await this.primaryStorage.set(key, serializedValue, options);
      
      // 如果有多个存储，尝试同步到其他存储（可选）
      if (this.storages.length > 1) {
        const otherStorages = this.storages.filter(s => s !== this.primaryStorage);
        await Promise.allSettled(
          otherStorages.map(storage => 
            storage.set(key, serializedValue, options).catch(err => 
              console.warn('同步到备用缓存失败:', err)
            )
          )
        );
      }
    } catch (error) {
      console.error('写入缓存失败:', error);
    }
  }

  isAvailable(): boolean {
    return this.primaryStorage !== null;
  }
}

// 单例实例
let cacheManagerInstance: CacheManager | null = null;

export function getCacheManager(): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager();
  }
  return cacheManagerInstance;
}