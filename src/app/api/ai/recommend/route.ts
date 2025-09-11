import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: '请提供有效的消息内容' },
        { status: 400 }
      );
    }

    const config = await getConfig();
    const aiConfig = config.AIConfig;

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

    // 构建AI推荐的系统提示
    const systemPrompt = `你是NewTV网站里的一个专业的推荐助手。请根据用户的描述，判断用户需要的是影视剧集推荐还是YouTube视频推荐。

#判断规则：
如果用户想要的是：
- 电影、电视剧、动漫、综艺等影视剧集内容 → 推荐影视剧集
- 新闻、教程、解说、音乐、娱乐视频、学习内容等 → 推荐YouTube视频

你的回复必须遵循以下步骤：
1. 首先用自然语言简单回应用户的需求。
2. 然后，另起一行，开始提供具体的推荐列表。
3. 如果用户的聊天内容跟获取推荐方面无关，直接拒绝回答！
4. 根据判断结果，严格按照对应格式提供推荐：

#影视剧集推荐格式：
《片名》 (年份) [类型] - 简短描述

#YouTube视频推荐格式：
【视频标题】 - 简短描述

#影视剧集推荐限制：
- 严禁输出任何Markdown格式。
- "片名"必须是真实存在的影视作品的官方全名。
- "年份"必须是4位数字的公元年份。
- "类型"必须是该影片的主要类型，例如：剧情/悬疑/科幻。
- "简短描述"是对影片的简要介绍。
- 每一部推荐的影片都必须独占一行，并以《》开始。

#YouTube视频推荐限制：
- 只推荐YouTube视频内容，如新闻、教程、解说、音乐、娱乐等
- 不推荐影视剧集内容
- 每次推荐1-4个视频
- 描述要简洁明了
- 必须严格按照指定格式输出，以【】开始

#影视剧集格式示例：
《长长的季节》 (2023) [国产剧/悬疑] - 豆瓣9.4分，一部关于时间和真相的深刻故事。
《繁城之下》 (2023) [古装/悬疑] - 明朝背景下的连环凶杀案，电影级质感。

#YouTube视频格式示例：
【如何学习编程】 - 适合初学者的编程入门教程
【今日新闻速报】 - 最新国际新闻资讯`;

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
    const aiContent = aiData.choices?.[0]?.message?.content || '抱歉，我现在无法为你推荐内容。';

    // 检测是否为YouTube视频推荐
    const isYouTubeRecommendation = aiContent.includes('【') && aiContent.includes('】');
    
    if (isYouTubeRecommendation) {
      // 如果是YouTube视频推荐，调用YouTube推荐API
      try {
        const youtubeResponse = await fetch(`${request.nextUrl.origin}/api/ai/youtube-recommend`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ messages })
        });
        
        if (youtubeResponse.ok) {
          const youtubeData = await youtubeResponse.json();
          return NextResponse.json({
            content: youtubeData.content,
            youtubeVideos: youtubeData.youtubeVideos
          });
        }
      } catch (error) {
        console.error('调用YouTube推荐API失败:', error);
      }
    }

    // 尝试从AI回复中提取影视推荐信息
    const recommendations = extractRecommendations(aiContent);

    return NextResponse.json({
      content: aiContent,
      recommendations
    });

  } catch (error) {
    console.error('AI推荐处理失败:', error);
    return NextResponse.json(
      { error: '推荐服务出现错误，请稍后再试' },
      { status: 500 }
    );
  }
}

// 从AI回复中提取推荐信息的辅助函数
function extractRecommendations(content: string) {
  const recommendations = [];
  const moviePattern = /《([^》]+)》\s*\((\d{4})\)\s*\[([^\]]+)\]\s*-\s*(.*)/;
  const lines = content.split('\n');

  for (const line of lines) {
    if (recommendations.length >= 4) {
      break;
    }
    const match = line.match(moviePattern);
    if (match) {
      const [, title, year, genre, description] = match;
      recommendations.push({
        title: title.trim(),
        year: year.trim(),
        genre: genre.trim(),
        description: description.trim() || 'AI推荐影片',
      });
    }
  }
  return recommendations;
}