import { NextRequest, NextResponse } from 'next/server';
import { getAuthInfoFromCookie } from '@/lib/auth';
import { getConfig } from '@/lib/config';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 从 cookie 获取用户信息
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await getConfig();
    if (authInfo.username !== process.env.ADMIN_USERNAME) {
      // 非站长，检查用户存在或被封禁
      const user = config.UserConfig.Users.find(
        (u) => u.username === authInfo.username
      );
      if (!user) {
        return NextResponse.json({ error: '用户不存在' }, { status: 401 });
      }
      if (user.banned) {
        return NextResponse.json({ error: '用户已被封禁' }, { status: 401 });
      }
    }

    const stats = await db.getUserStats(authInfo.username);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('获取用户统计数据失败:', error);
    return NextResponse.json(
      { error: '获取用户统计数据失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 从 cookie 获取用户信息
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await getConfig();
    if (authInfo.username !== process.env.ADMIN_USERNAME) {
      // 非站长，检查用户存在或被封禁
      const user = config.UserConfig.Users.find(
        (u) => u.username === authInfo.username
      );
      if (!user) {
        return NextResponse.json({ error: '用户不存在' }, { status: 401 });
      }
      if (user.banned) {
        return NextResponse.json({ error: '用户已被封禁' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { watchTime, movieKey, timestamp } = body;

    if (typeof watchTime !== 'number' || !movieKey || !timestamp) {
      return NextResponse.json(
        { error: '参数错误：需要 watchTime, movieKey, timestamp' },
        { status: 400 }
      );
    }

    await db.updateUserStats(authInfo.username, {
      watchTime,
      movieKey,
      timestamp
    });

    // 获取更新后的用户统计数据并返回
    const updatedStats = await db.getUserStats(authInfo.username);

    return NextResponse.json({ 
      success: true,
      userStats: updatedStats
    });
  } catch (error) {
    console.error('更新用户统计数据失败:', error);
    return NextResponse.json(
      { error: '更新用户统计数据失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 从 cookie 获取用户信息
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await getConfig();
    if (authInfo.username !== process.env.ADMIN_USERNAME) {
      // 非站长，检查用户存在或被封禁
      const user = config.UserConfig.Users.find(
        (u) => u.username === authInfo.username
      );
      if (!user) {
        return NextResponse.json({ error: '用户不存在' }, { status: 401 });
      }
      if (user.banned) {
        return NextResponse.json({ error: '用户已被封禁' }, { status: 401 });
      }
    }

    await db.clearUserStats(authInfo.username);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('清除用户统计数据失败:', error);
    return NextResponse.json(
      { error: '清除用户统计数据失败' },
      { status: 500 }
    );
  }
}