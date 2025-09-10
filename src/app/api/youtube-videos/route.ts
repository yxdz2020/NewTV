import { NextRequest, NextResponse } from 'next/server';
import { getCacheManager } from '@/lib/cache-manager';

// YouTube Data API v3 的基础URL
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// 模拟的YouTube API Key（实际使用时需要配置真实的API Key）
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'demo_key';

const cacheManager = getCacheManager();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const maxResults = searchParams.get('maxResults') || '6';

    if (!channelId) {
      return NextResponse.json(
        { error: '频道ID不能为空' },
        { status: 400 }
      );
    }

    // 如果没有配置真实的API Key，则返回空数据
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'demo_key') {
      console.warn('YouTube API Key未配置，返回空视频列表。');
      return NextResponse.json({ videos: [] });
    }

    const cacheKey = `youtube-videos:${channelId}:${maxResults}`;

    try {
      const cachedVideos = await cacheManager.get(cacheKey);

      if (cachedVideos) {
        console.log('从缓存中获取YouTube视频数据');
        return NextResponse.json({ videos: cachedVideos });
      }
    } catch (e) {
      console.error('获取缓存失败，将直接从API获取', e);
    }


    // 使用真实的YouTube API
    const response = await fetch(
      `${YOUTUBE_API_BASE}/search?` +
      `key=${YOUTUBE_API_KEY}&` +
      `channelId=${channelId}&` +
      `part=snippet&` +
      `order=date&` +
      `maxResults=${maxResults}&` +
      `type=video`
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`YouTube API请求失败: ${response.status}`, errorBody);
      throw new Error(`YouTube API请求失败: ${response.status}`);
    }

    const data = await response.json();
    const videos = data.items || [];

    try {
      // 缓存1小时
      await cacheManager.set(cacheKey, videos, 3600);
    } catch (e) {
      console.error('YouTube视频数据写入缓存失败', e);
    }

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('获取YouTube视频失败:', error);

    // 如果API调用失败，返回空数组
    return NextResponse.json({ videos: [] });
  }
}