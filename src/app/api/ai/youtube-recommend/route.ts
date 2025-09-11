import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { 
          error: '请提供有效的消息内容',
          youtubeVideos: []
        },
        { status: 400 }
      );
    }

    const config = await getConfig();

    // 检查AI配置
    if (!config.AIConfig?.enabled) {
      return NextResponse.json(
        { error: 'AI推荐功能未启用' },
        { status: 400 }
      );
    }

    if (!config.AIConfig?.apiUrl || !config.AIConfig?.apiKey) {
      return NextResponse.json(
        { error: 'AI配置不完整' },
        { status: 500 }
      );
    }

    // 检查YouTube API配置
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'demo_key') {
      return NextResponse.json(
        { error: 'YouTube API Key未配置' },
        { status: 500 }
      );
    }

    // 构建YouTube视频推荐的系统提示
    const systemPrompt = `你是NewTV网站里的一个专业的YouTube视频推荐助手。请根据用户的描述，推荐1-4个合适的YouTube视频。

你的回复必须遵循以下步骤：
1. 首先用自然语言简单回应用户的需求。
2. 然后，另起一行，开始提供具体的YouTube视频推荐列表。
3. 如果用户的聊天内容跟获取YouTube视频推荐方面无关，直接拒绝回答！如果与YouTube视频推荐方面有关，请先分析用户需求后再回答
4. 对于推荐列表中的每一个视频，你必须严格按照以下格式提供，不得有任何偏差：
【视频标题】 - 简短描述

#限制：
- 只推荐YouTube视频内容，如新闻、教程、解说、音乐、娱乐等
- 不推荐影视剧集内容
- 每次推荐1-4个视频
- 描述要简洁明了
- 必须严格按照指定格式输出

#示例格式：
【如何学习编程】 - 适合初学者的编程入门教程
【今日新闻速报】 - 最新国际新闻资讯
【游戏解说精选】 - 热门游戏通关攻略
【轻音乐合集】 - 放松心情的背景音乐`;

    // 调用AI服务
    const apiUrl = config.AIConfig.apiUrl.endsWith('/')
      ? config.AIConfig.apiUrl + 'chat/completions'
      : config.AIConfig.apiUrl + '/chat/completions';

    const apiMessages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...messages.map((msg: { role: string, content: string }) => ({
        role: msg.role === 'ai' ? 'assistant' : msg.role,
        content: msg.content
      }))
    ];

    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.AIConfig.apiKey}`
      },
      body: JSON.stringify({
        model: config.AIConfig.model,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!aiResponse.ok) {
      console.error('AI API调用失败:', aiResponse.status, aiResponse.statusText);
      return NextResponse.json(
        { error: 'AI服务暂时不可用，请稍后再试' },
        { status: 502 }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '抱歉，我现在无法为你推荐YouTube视频。';

    // 从AI回复中提取推荐的搜索关键词
    const searchKeywords = extractSearchKeywords(aiContent);
    
    // 使用YouTube API搜索视频
    const youtubeVideos = await searchYouTubeVideos(searchKeywords);

    if (youtubeVideos.length === 0) {
      return NextResponse.json({
        content: aiContent + '\n\n抱歉，没有找到相关的YouTube视频，请尝试其他关键词。',
        youtubeVideos: []
      });
    }

    return NextResponse.json({
      content: aiContent + `\n\n为您推荐以下${youtubeVideos.length}个YouTube视频：`,
      youtubeVideos
    });

  } catch (error) {
    console.error('YouTube视频推荐处理失败:', error);
    return NextResponse.json(
      { error: '推荐服务出现错误，请稍后再试' },
      { status: 500 }
    );
  }
}

// 从AI回复中提取搜索关键词的辅助函数
function extractSearchKeywords(content: string): string[] {
  const keywords: string[] = [];
  const videoPattern = /【([^】]+)】/g;
  let match;

  while ((match = videoPattern.exec(content)) !== null && keywords.length < 4) {
    keywords.push(match[1].trim());
  }

  return keywords;
}

// 使用YouTube API搜索视频的辅助函数
async function searchYouTubeVideos(keywords: string[]) {
  const videos = [];

  for (const keyword of keywords) {
    if (videos.length >= 4) break;

    try {
      const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
      searchUrl.searchParams.set('key', YOUTUBE_API_KEY!);
      searchUrl.searchParams.set('q', keyword);
      searchUrl.searchParams.set('part', 'snippet');
      searchUrl.searchParams.set('type', 'video');
      searchUrl.searchParams.set('maxResults', '1');
      searchUrl.searchParams.set('order', 'relevance');

      const response = await fetch(searchUrl.toString());
      
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const video = data.items[0];
          videos.push({
            id: video.id.videoId,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnail: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
            channelTitle: video.snippet.channelTitle,
            publishedAt: video.snippet.publishedAt
          });
        }
      }
    } catch (error) {
      console.error(`搜索关键词 "${keyword}" 失败:`, error);
    }
  }

  return videos;
}