import { AdminConfig } from './admin.types';
import { DanmakuConfig, Favorite, IStorage, PlayRecord, SkipConfig, UserStats } from './types';

export class LocalStorageStorage implements IStorage {
  private getKey(prefix: string, userName: string, ...parts: string[]): string {
    return [prefix, userName, ...parts].join(':');
  }

  // ---------- 播放记录 ----------
  async getPlayRecord(userName: string, key: string): Promise<PlayRecord | null> {
    const storageKey = this.getKey('play_record', userName, key);
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : null;
  }

  async setPlayRecord(userName: string, key: string, record: PlayRecord): Promise<void> {
    const storageKey = this.getKey('play_record', userName, key);
    localStorage.setItem(storageKey, JSON.stringify(record));
  }

  async getAllPlayRecords(userName: string): Promise<{ [key: string]: PlayRecord }> {
    const prefix = this.getKey('play_record', userName);
    const records: { [key: string]: PlayRecord } = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix + ':')) {
        const data = localStorage.getItem(key);
        if (data) {
          const storageKey = key.replace(prefix + ':', '');
          records[storageKey] = JSON.parse(data);
        }
      }
    }
    
    return records;
  }

  async deletePlayRecord(userName: string, key: string): Promise<void> {
    const storageKey = this.getKey('play_record', userName, key);
    localStorage.removeItem(storageKey);
  }

  // ---------- 收藏 ----------
  async getFavorite(userName: string, key: string): Promise<Favorite | null> {
    const storageKey = this.getKey('favorite', userName, key);
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : null;
  }

  async setFavorite(userName: string, key: string, favorite: Favorite): Promise<void> {
    const storageKey = this.getKey('favorite', userName, key);
    localStorage.setItem(storageKey, JSON.stringify(favorite));
  }

  async getAllFavorites(userName: string): Promise<{ [key: string]: Favorite }> {
    const prefix = this.getKey('favorite', userName);
    const favorites: { [key: string]: Favorite } = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix + ':')) {
        const data = localStorage.getItem(key);
        if (data) {
          const storageKey = key.replace(prefix + ':', '');
          favorites[storageKey] = JSON.parse(data);
        }
      }
    }
    
    return favorites;
  }

  async deleteFavorite(userName: string, key: string): Promise<void> {
    const storageKey = this.getKey('favorite', userName, key);
    localStorage.removeItem(storageKey);
  }

  async isFavorited(userName: string, source: string, id: string): Promise<boolean> {
    const key = this.getKey('favorite', userName, source, id);
    return localStorage.getItem(key) !== null;
  }

  // ---------- 用户管理 ----------
  async registerUser(userName: string, password: string): Promise<void> {
    const key = this.getKey('user', userName);
    const userData = { password, createdAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(userData));
  }

  async verifyUser(userName: string, password: string): Promise<boolean> {
    const key = this.getKey('user', userName);
    const data = localStorage.getItem(key);
    if (!data) return false;
    
    const userData = JSON.parse(data);
    return userData.password === password;
  }

  async checkUserExist(userName: string): Promise<boolean> {
    const key = this.getKey('user', userName);
    return localStorage.getItem(key) !== null;
  }

  async changePassword(userName: string, newPassword: string): Promise<void> {
    const key = this.getKey('user', userName);
    const data = localStorage.getItem(key);
    if (!data) throw new Error('用户不存在');
    
    const userData = JSON.parse(data);
    userData.password = newPassword;
    localStorage.setItem(key, JSON.stringify(userData));
  }

  async deleteUser(userName: string): Promise<void> {
    // 删除用户相关的所有数据
    const prefixes = ['user', 'play_record', 'favorite', 'search_history', 'user_stats', 'skip_config', 'danmaku_config'];
    
    for (const prefix of prefixes) {
      const keyPrefix = this.getKey(prefix, userName);
      const keysToDelete: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key === keyPrefix || key.startsWith(keyPrefix + ':'))) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => localStorage.removeItem(key));
    }
  }

  // ---------- 搜索历史 ----------
  async getSearchHistory(userName: string): Promise<string[]> {
    const key = this.getKey('search_history', userName);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  async addSearchHistory(userName: string, keyword: string): Promise<void> {
    const history = await this.getSearchHistory(userName);
    const filteredHistory = history.filter(item => item !== keyword);
    filteredHistory.unshift(keyword);
    
    // 限制历史记录数量
    const limitedHistory = filteredHistory.slice(0, 50);
    
    const key = this.getKey('search_history', userName);
    localStorage.setItem(key, JSON.stringify(limitedHistory));
  }

  async deleteSearchHistory(userName: string, keyword?: string): Promise<void> {
    const key = this.getKey('search_history', userName);
    
    if (keyword) {
      const history = await this.getSearchHistory(userName);
      const filteredHistory = history.filter(item => item !== keyword);
      localStorage.setItem(key, JSON.stringify(filteredHistory));
    } else {
      localStorage.removeItem(key);
    }
  }

  // ---------- 管理员配置 ----------
  async getAdminConfig(): Promise<AdminConfig | null> {
    const key = 'admin_config';
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  async setAdminConfig(config: AdminConfig): Promise<void> {
    const key = 'admin_config';
    localStorage.setItem(key, JSON.stringify(config));
  }

  // ---------- 跳过配置 ----------
  async getSkipConfig(userName: string, source: string, id: string): Promise<SkipConfig | null> {
    const key = this.getKey('skip_config', userName, source, id);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  async setSkipConfig(userName: string, source: string, id: string, config: SkipConfig): Promise<void> {
    const key = this.getKey('skip_config', userName, source, id);
    localStorage.setItem(key, JSON.stringify(config));
  }

  async deleteSkipConfig(userName: string, source: string, id: string): Promise<void> {
    const key = this.getKey('skip_config', userName, source, id);
    localStorage.removeItem(key);
  }

  async getAllSkipConfigs(userName: string): Promise<{ [key: string]: SkipConfig }> {
    const prefix = this.getKey('skip_config', userName);
    const configs: { [key: string]: SkipConfig } = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix + ':')) {
        const data = localStorage.getItem(key);
        if (data) {
          const storageKey = key.replace(prefix + ':', '');
          configs[storageKey] = JSON.parse(data);
        }
      }
    }
    
    return configs;
  }

  // ---------- 弹幕配置 ----------
  async getDanmakuConfig(userName: string): Promise<DanmakuConfig | null> {
    const key = this.getKey('danmaku_config', userName);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  async setDanmakuConfig(userName: string, config: DanmakuConfig): Promise<void> {
    const key = this.getKey('danmaku_config', userName);
    localStorage.setItem(key, JSON.stringify(config));
  }

  async deleteDanmakuConfig(userName: string): Promise<void> {
    const key = this.getKey('danmaku_config', userName);
    localStorage.removeItem(key);
  }

  // ---------- 用户统计数据 ----------
  async getUserStats(userName: string): Promise<UserStats | null> {
    const key = this.getKey('user_stats', userName);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  async updateUserStats(userName: string, updateData: {
    watchTime: number;
    movieKey: string;
    timestamp: number;
  }): Promise<void> {
    const key = this.getKey('user_stats', userName);
    let stats = await this.getUserStats(userName);
    
    if (!stats) {
      // 如果没有统计数据，创建新的
      stats = {
        totalWatchTime: updateData.watchTime,
        totalMovies: 1,
        firstWatchDate: updateData.timestamp,
        lastUpdateTime: updateData.timestamp
      };
    } else {
      // 更新现有统计数据
      stats.totalWatchTime += updateData.watchTime;
      stats.lastUpdateTime = updateData.timestamp;
      
      // 检查是否是新影片（基于movieKey）
      const movieStatsKey = this.getKey('movie_stats', userName);
      const movieStatsData = localStorage.getItem(movieStatsKey);
      const movieStats = movieStatsData ? JSON.parse(movieStatsData) : {};
      
      if (!movieStats[updateData.movieKey]) {
        movieStats[updateData.movieKey] = true;
        stats.totalMovies = Object.keys(movieStats).length;
        localStorage.setItem(movieStatsKey, JSON.stringify(movieStats));
      }
    }
    
    localStorage.setItem(key, JSON.stringify(stats));
  }

  async clearUserStats(userName: string): Promise<void> {
    const statsKey = this.getKey('user_stats', userName);
    const movieStatsKey = this.getKey('movie_stats', userName);
    localStorage.removeItem(statsKey);
    localStorage.removeItem(movieStatsKey);
  }

  // ---------- 数据清理 ----------
  async clearAllData(): Promise<void> {
    localStorage.clear();
  }

  // ---------- 获取所有用户 ----------
  async getAllUsers(): Promise<string[]> {
    const users: string[] = [];
    const prefix = 'user:';
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && !key.includes(':', prefix.length)) {
        const userName = key.replace(prefix, '');
        users.push(userName);
      }
    }
    
    return users;
  }
}