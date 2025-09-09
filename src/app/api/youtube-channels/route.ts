import { NextRequest, NextResponse } from 'next/server';
import { getAuthInfoFromCookie } from '@/lib/auth';

// 简单的内存存储，实际项目中应该使用数据库
let channels: { id: string; name: string; channelId: string; addedAt: string }[] = [
  {
    id: '1',
    name: 'YouTube官方频道',
    channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    addedAt: new Date().toISOString()
  },
  {
    id: '2', 
    name: 'Google Developers',
    channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    addedAt: new Date().toISOString()
  }
];

export async function GET() {
  try {
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

    const newChannel = {
      id: Date.now().toString(),
      name,
      channelId,
      addedAt: new Date().toISOString()
    };

    channels.push(newChannel);

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

    const initialLength = channels.length;
    channels = channels.filter(channel => channel.id !== channelId);
    
    if (channels.length === initialLength) {
      return NextResponse.json(
        { error: '频道不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: '频道删除成功' });
  } catch (error) {
    console.error('删除YouTube频道失败:', error);
    return NextResponse.json(
      { error: '删除频道失败' },
      { status: 500 }
    );
  }
}