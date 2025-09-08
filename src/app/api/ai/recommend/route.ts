import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message || typeof message !== 'string') {
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
    const systemPrompt = `你是一个专业的影视推荐助手。请根据用户的描述，推荐合适的影视作品。

请按照以下格式回复：
1. 首先用自然语言回应用户的需求
2. 然后提供具体的影片推荐

推荐格式要求：
- 每部影片包含：片名、年份、类型、简短描述
- 推荐2-4部相关影片
- 确保推荐的影片真实存在
- 优先推荐知名度较高的作品

用户描述：${message}`;

    // 调用AI服务
    const apiUrl = config.AIConfig.apiUrl.endsWith('/') 
      ? config.AIConfig.apiUrl + 'chat/completions'
      : config.AIConfig.apiUrl + '/chat/completions';
    
    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.AIConfig.apiKey}`
      },
      body: JSON.stringify({
        model: config.AIConfig.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
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
    const aiContent = aiData.choices?.[0]?.message?.content || '抱歉，我现在无法为你推荐影片。';

    // 尝试从AI回复中提取推荐信息
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
  
  // 使用正则表达式尝试提取影片信息
  // 这里使用简单的模式匹配，实际使用中可能需要更复杂的解析逻辑
  const moviePattern = /《([^》]+)》\s*\(?([0-9]{4})?\)?[，。]?\s*([^。，\n]*)/g;
  let match;
  
  while ((match = moviePattern.exec(content)) !== null && recommendations.length < 4) {
    const [, title, year, description] = match;
    if (title && title.trim()) {
      recommendations.push({
        title: title.trim(),
        year: year || undefined,
        description: description ? description.trim() : '推荐影片',
        genre: extractGenre(description || '')
      });
    }
  }
  
  // 如果没有找到标准格式，尝试其他模式
  if (recommendations.length === 0) {
    const alternativePattern = /([《"'][^》"']+[》"'])|(\d{4}年[^，。\n]*)/g;
    let altMatch;
    
    while ((altMatch = alternativePattern.exec(content)) !== null && recommendations.length < 4) {
      const movieText = altMatch[0];
      if (movieText && movieText.length > 2) {
        const cleanTitle = movieText.replace(/[《》"']/g, '').trim();
        if (cleanTitle) {
          recommendations.push({
            title: cleanTitle,
            description: 'AI推荐影片'
          });
        }
      }
    }
  }
  
  return recommendations;
}

// 从描述中提取类型信息的辅助函数
function extractGenre(description: string): string | undefined {
  const genreKeywords = {
    '动作': ['动作', '打斗', '武侠', '功夫'],
    '喜剧': ['喜剧', '搞笑', '幽默', '轻松'],
    '爱情': ['爱情', '浪漫', '恋爱', '情感'],
    '科幻': ['科幻', '未来', '太空', '机器人'],
    '恐怖': ['恐怖', '惊悚', '悬疑', '鬼片'],
    '剧情': ['剧情', '文艺', '深刻', '感人'],
    '动画': ['动画', '卡通', '动漫'],
    '纪录片': ['纪录片', '纪录', '真实']
  };
  
  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    if (keywords.some(keyword => description.includes(keyword))) {
      return genre;
    }
  }
  
  return undefined;
}