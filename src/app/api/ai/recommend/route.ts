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
    const systemPrompt = `你是NewTV网站里的一个专业的影视推荐助手。请根据用户的描述，推荐1-4部合适的影视作品。


你的回复必须遵循以下步骤：
1.  首先用自然语言简单回应用户的需求。
2.  然后，另起一行，开始提供具体的影片推荐列表。
3.  如果用户的聊天内容跟获取影视推荐方面无关，直接拒绝回答！如果与影视推荐方面有关，请先使用搜索功能后再回答
4.  对于推荐列表中的每一部影片，你必须严格按照以下格式提供，不得有任何偏差：
《片名》 (年份) [类型] - 简短描述

#限制：
- 严禁输出任何Markdown格式。
- “片名”必须是真实存在的影视作品的官方全名。
- “年份”必须是4位数字的公元年份。
- “类型”必须是该影片的主要类型，例如：剧情/悬疑/科幻。
- “简短描述”是对影片的简要介绍。
- 每一部推荐的影片都必须独占一行，并以《》开始。

#格式示例：
《长长的季节》 (2023) [国产剧/悬疑] - 豆瓣9.4分，一部关于时间和真相的深刻故事。
《繁城之下》 (2023) [古装/悬疑] - 明朝背景下的连环凶杀案，电影级质感。
《尘封十三载》 (2023) [刑侦/悬疑] - 跨越十三年的双雄探案，情节扣人心弦。
《黑暗荣耀》 (2022) [韩剧/复仇] - 精心策划的复仇大计，引人入胜。`;

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