import { NextRequest, NextResponse } from 'next/server';

// YouTube Data API v3 的基础URL
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// 模拟的YouTube API Key（实际使用时需要配置真实的API Key）
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'demo_key';

// 模拟视频数据（当没有真实API Key时使用）
const mockVideos = [
  {
    id: { videoId: 'dQw4w9WgXcQ' },
    snippet: {
      title: 'Rick Astley - Never Gonna Give You Up (Official Video)',
      description: 'The official video for "Never Gonna Give You Up" by Rick Astley',
      thumbnails: {
        medium: {
          url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
          width: 320,
          height: 180
        }
      },
      channelTitle: 'Rick Astley',
      publishedAt: '2009-10-25T06:57:33Z'
    }
  },
  {
    id: { videoId: 'L_jWHffIx5E' },
    snippet: {
      title: 'Smash Mouth - All Star (Official Music Video)',
      description: 'Official music video for Smash Mouth - All Star',
      thumbnails: {
        medium: {
          url: 'https://i.ytimg.com/vi/L_jWHffIx5E/mqdefault.jpg',
          width: 320,
          height: 180
        }
      },
      channelTitle: 'Smash Mouth',
      publishedAt: '2010-02-11T23:29:09Z'
    }
  },
  {
    id: { videoId: '9bZkp7q19f0' },
    snippet: {
      title: 'PSY - GANGNAM STYLE(강남스타일) M/V',
      description: 'PSY - GANGNAM STYLE(강남스타일) M/V',
      thumbnails: {
        medium: {
          url: 'https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg',
          width: 320,
          height: 180
        }
      },
      channelTitle: 'officialpsy',
      publishedAt: '2012-07-15T08:34:21Z'
    }
  },
  {
    id: { videoId: 'kJQP7kiw5Fk' },
    snippet: {
      title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
      description: 'Luis Fonsi - Despacito ft. Daddy Yankee',
      thumbnails: {
        medium: {
          url: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg',
          width: 320,
          height: 180
        }
      },
      channelTitle: 'LuisFonsiVEVO',
      publishedAt: '2017-01-12T19:06:32Z'
    }
  },
  {
    id: { videoId: 'fJ9rUzIMcZQ' },
    snippet: {
      title: 'Queen – Bohemian Rhapsody (Official Video Remastered)',
      description: 'Queen – Bohemian Rhapsody (Official Video Remastered)',
      thumbnails: {
        medium: {
          url: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/mqdefault.jpg',
          width: 320,
          height: 180
        }
      },
      channelTitle: 'Queen Official',
      publishedAt: '2008-08-01T14:54:09Z'
    }
  },
  {
    id: { videoId: 'JGwWNGJdvx8' },
    snippet: {
      title: 'Ed Sheeran - Shape of You (Official Music Video)',
      description: 'Ed Sheeran - Shape of You (Official Music Video)',
      thumbnails: {
        medium: {
          url: 'https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg',
          width: 320,
          height: 180
        }
      },
      channelTitle: 'Ed Sheeran',
      publishedAt: '2017-01-30T10:52:15Z'
    }
  }
];

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

    // 如果没有配置真实的API Key，返回基于频道ID的模拟数据
    if (YOUTUBE_API_KEY === 'demo_key') {
      // 根据频道ID返回不同的模拟视频数据
      const videos = mockVideos.slice(0, parseInt(maxResults)).map(video => ({
        ...video,
        snippet: {
          ...video.snippet,
          channelTitle: `频道 ${channelId.substring(0, 8)}...`
        }
      }));
      return NextResponse.json({ videos });
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
      throw new Error(`YouTube API请求失败: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({ videos: data.items || [] });
  } catch (error) {
    console.error('获取YouTube视频失败:', error);
    
    // 如果API调用失败，返回模拟数据作为备用
    const videos = mockVideos.slice(0, 6);
    return NextResponse.json({ videos });
  }
}