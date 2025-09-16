// 调试YouTube配置问题的脚本
const fs = require('fs');
const path = require('path');

// 模拟环境变量
process.env.NEXT_PUBLIC_STORAGE_TYPE = 'redis';

async function debugYouTubeConfig() {
  try {
    // 动态导入配置模块
    const configModule = await import('./src/lib/config.ts');
    const { getConfig, clearConfigCache } = configModule;
    
    console.log('=== YouTube配置调试 ===');
    
    // 清除缓存，强制从数据库读取
    clearConfigCache();
    
    // 获取当前配置
    const config = await getConfig();
    
    console.log('当前YouTube配置:');
    console.log('- 类型:', typeof config.YouTubeChannels);
    console.log('- 是否为数组:', Array.isArray(config.YouTubeChannels));
    console.log('- 长度:', config.YouTubeChannels ? config.YouTubeChannels.length : 'undefined');
    console.log('- 内容:', JSON.stringify(config.YouTubeChannels, null, 2));
    
    // 检查配置的其他部分
    console.log('\n其他配置检查:');
    console.log('- SourceConfig长度:', config.SourceConfig ? config.SourceConfig.length : 'undefined');
    console.log('- CustomCategories长度:', config.CustomCategories ? config.CustomCategories.length : 'undefined');
    console.log('- LiveConfig长度:', config.LiveConfig ? config.LiveConfig.length : 'undefined');
    
  } catch (error) {
    console.error('调试过程中出错:', error);
  }
}

// 运行调试
debugYouTubeConfig();