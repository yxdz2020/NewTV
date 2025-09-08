/* eslint-disable @typescript-eslint/no-explicit-any, no-console */

// 从 next 包中导入 NextRequest 和 NextResponse 类型
import type { NextRequest } from 'next';
import { NextResponse } from 'next';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { clearConfigCache, getConfig } from '@/lib/config';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // 身份验证
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { username } = authInfo;
    const { enabled, apiUrl, apiKey } = await request.json();

    // 参数验证
    if (
      typeof enabled !== 'boolean' ||
      typeof apiUrl !== 'string' ||
      typeof apiKey !== 'string'
    ) {
      return NextResponse.json({ error: '参数格式错误' }, { status: 400 });
    }

    const adminConfig = await getConfig();

    // 权限校验
    if (username !== process.env.USERNAME) {
      // 管理员
      const user = adminConfig.UserConfig.Users.find(
        (u) => u.username === username
      );
      if (!user || user.role !== 'admin' || user.banned) {
        return NextResponse.json({ error: '权限不足' }, { status: 401 });
      }
    }

    // 更新AI配置
    adminConfig.AIConfig = {
      enabled,
      apiUrl,
      apiKey,
    };

    // 写入数据库
    await db.saveAdminConfig(adminConfig);
    
    // 清除配置缓存
    clearConfigCache();

    return NextResponse.json(
      { ok: true },
      {
        headers: {
          'Cache-Control': 'no-store', // 不缓存结果
        },
      }
    );
  } catch (error) {
    console.error('更新AI配置失败:', error);
    return NextResponse.json(
      {
        error: '更新AI配置失败',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}