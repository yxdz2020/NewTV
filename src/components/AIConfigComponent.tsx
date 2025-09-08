'use client';

import { AlertCircle, Check, Save } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AIConfig {
  enabled: boolean;
  api_url: string;
  api_key: string;
  model: string;
  customModel?: string;
}

export default function AIConfigComponent() {
  const [config, setConfig] = useState<AIConfig>({
    enabled: false,
    api_url: '',
    api_key: '',
    model: 'gpt-3.5-turbo',
    customModel: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 加载配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/admin/config');
        if (response.ok) {
          const data = await response.json();
          const modelValue = data.Config?.AIConfig?.model || 'gpt-3.5-turbo';
          const isKnownModel = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'qwen-turbo', 'qwen-plus', 'qwen-max', 'ernie-4.0-8k', 'ernie-3.5-8k', 'glm-4', 'glm-3-turbo'].includes(modelValue);
          setConfig({
            enabled: data.Config?.AIConfig?.enabled || false,
            api_url: data.Config?.AIConfig?.apiUrl || '',
            api_key: data.Config?.AIConfig?.apiKey || '',
            model: isKnownModel ? modelValue : 'custom',
            customModel: isKnownModel ? '' : modelValue
          });
        }
      } catch (error) {
        console.error('Failed to load AI config:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // 保存配置
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          AIConfig: {
            enabled: config.enabled,
            apiUrl: config.api_url,
            apiKey: config.api_key,
            model: config.model === 'custom' ? (config.customModel || '') : config.model
          }
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'AI配置保存成功' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      setMessage({ type: 'error', text: '保存AI配置失败，请重试' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        {/* 启用开关 */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="ai-enabled"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label htmlFor="ai-enabled" className="text-sm font-medium text-gray-900 dark:text-gray-100">
            启用AI推荐功能
          </label>
        </div>

        {/* API URL */}
        <div>
          <label htmlFor="api-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            API地址
          </label>
          <input
            type="url"
            id="api-url"
            value={config.api_url}
            onChange={(e) => setConfig({ ...config, api_url: e.target.value })}
            placeholder="https://api.openai.com/v1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            输入OpenAI API的基础地址，系统会自动添加/chat/completions
          </p>
        </div>

        {/* API Key */}
        <div>
          <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            API密钥
          </label>
          <input
            type="password"
            id="api-key"
            value={config.api_key}
            onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
            placeholder="sk-..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            请输入有效的API密钥
          </p>
        </div>

        {/* AI Model */}
        <div>
          <label htmlFor="ai-model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            AI模型
          </label>
          <select
            id="ai-model"
            value={config.model === 'custom' || !['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'qwen-turbo', 'qwen-plus', 'qwen-max', 'ernie-4.0-8k', 'ernie-3.5-8k', 'glm-4', 'glm-3-turbo'].includes(config.model) ? 'custom' : config.model}
            onChange={(e) => {
              if (e.target.value === 'custom') {
                setConfig({ ...config, model: 'custom', customModel: config.model !== 'custom' ? '' : config.customModel || '' });
              } else {
                setConfig({ ...config, model: e.target.value });
              }
            }}
            className="max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <optgroup label="OpenAI">
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </optgroup>
            <optgroup label="Anthropic">
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
              <option value="claude-3-opus-20240229">Claude 3 Opus</option>
            </optgroup>
            <optgroup label="阿里云">
              <option value="qwen-turbo">通义千问 Turbo</option>
              <option value="qwen-plus">通义千问 Plus</option>
              <option value="qwen-max">通义千问 Max</option>
            </optgroup>
            <optgroup label="百度">
              <option value="ernie-4.0-8k">文心一言 4.0</option>
              <option value="ernie-3.5-8k">文心一言 3.5</option>
            </optgroup>
            <optgroup label="智谱AI">
              <option value="glm-4">GLM-4</option>
              <option value="glm-3-turbo">GLM-3 Turbo</option>
            </optgroup>
            <optgroup label="其他">
              <option value="custom">自定义模型</option>
            </optgroup>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            选择要使用的AI模型，确保API支持所选模型
          </p>
        </div>

        {/* 自定义模型输入 */}
        {(config.model === 'custom' || !['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'qwen-turbo', 'qwen-plus', 'qwen-max', 'ernie-4.0-8k', 'ernie-3.5-8k', 'glm-4', 'glm-3-turbo'].includes(config.model)) && (
          <div>
            <label htmlFor="custom-model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              自定义模型名称
            </label>
            <input
              type="text"
              id="custom-model"
              value={config.model === 'custom' ? (config.customModel || '') : config.model}
              placeholder="输入自定义模型名称"
              onChange={(e) => setConfig({ ...config, customModel: e.target.value })}
              className="max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        )}
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`flex items-center space-x-2 p-3 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
            : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
        }`}>
          {message.type === 'success' ? (
            <Check className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? '保存中...' : '保存配置'}</span>
        </button>
      </div>

      {/* 使用说明 */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">使用说明</h4>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• 启用后，用户可以在移动端看到AI推荐图标</li>
          <li>• 支持OpenAI、Claude、通义千问等兼容API</li>
          <li>• API地址示例：https://api.openai.com/v1</li>
          <li>• 选择合适的AI模型，不同模型效果和费用不同</li>
          <li>• 确保API密钥有足够的调用额度</li>
        </ul>
      </div>
    </div>
  );
}