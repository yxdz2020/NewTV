import { NextRequest, NextResponse } from 'next/server';
import { getAuthInfoFromCookie } from '@/lib/auth';
import { getStorage } from '@/lib/db';

// YouTube频道数据类型
interface YouTubeChannel {
  id: string;
  name: string;
  channelId: string;
  addedAt: string;
}

// 数据库键名
const YOUTUBE_CHANNELS_KEY = 'youtube:channels';

// 获取所有频道
async function getChannels(): Promise<YouTubeChannel[]> {
  try {
    const storage = getStorage();
    if (!storage) {
      // 如果没有数据库存储，返回空数组
      return [];
    }

    const adminConfig = await storage.getAdminConfig();
    return (adminConfig as any)?.YouTubeChannels || [];
  } catch (error) {
    console.error('获取YouTube频道失败:', error);
    return [];
  }
}

// 保存所有频道
async function saveChannels(channels: YouTubeChannel[]): Promise<void> {
  try {
    const storage = getStorage();
    if (!storage) {
      throw new Error('数据库存储不可用');
    }

    const adminConfig = await storage.getAdminConfig() || {} as any;
    adminConfig.YouTubeChannels = channels;
    await storage.setAdminConfig(adminConfig);
  } catch (error) {
    console.error('保存YouTube频道失败:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const channels = await getChannels();
    return NextResponse.json({ channels });
  } catch (error) {
    console.error('获取YouTube频道列表失败:', error);
    return NextResponse.json(
      { error: '获取频道列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const { name, channelId } = await request.json();

    if (!name || !channelId) {
      return NextResponse.json(
        { error: '频道名称和ID不能为空' },
        { status: 400 }
      );
    }

    const channels = await getChannels();

    const newChannel: YouTubeChannel = {
      id: Date.now().toString(),
      name,
      channelId,
      addedAt: new Date().toISOString()
    };

    channels.push(newChannel);
    await saveChannels(channels);

    return NextResponse.json({ channel: newChannel });
  } catch (error) {
    console.error('添加YouTube频道失败:', error);
    return NextResponse.json(
      { error: '添加频道失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('id');

    if (!channelId) {
      return NextResponse.json(
        { error: '频道ID不能为空' },
        { status: 400 }
      );
    }

    const channels = await getChannels();
    const initialLength = channels.length;
    const filteredChannels = channels.filter(channel => channel.id !== channelId);

    if (filteredChannels.length === initialLength) {
      return NextResponse.json(
        { error: '频道不存在' },
        { status: 404 }
      );
    }

    await saveChannels(filteredChannels);
    return NextResponse.json({ message: '频道删除成功' });
  } catch (error) {
    console.error('删除YouTube频道失败:', error);
    return NextResponse.json(
      { error: '删除频道失败' },
      { status: 500 }
    );
  }
}