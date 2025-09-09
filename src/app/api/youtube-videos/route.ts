import { NextRequest, NextResponse } from 'next/server';

// YouTube Data API v3 的基础URL
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// 模拟的YouTube API Key（实际使用时需要配置真实的API Key）
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'demo_key';

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
    
    return NextResponse.json({ videos: data.items || [] });
  } catch (error) {
    console.error('获取YouTube视频失败:', error);
    
    // 如果API调用失败，返回空数组
    return NextResponse.json({ videos: [] });
  }
}