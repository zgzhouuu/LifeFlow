/**
 * DeepSeek API Service
 * DeepSeek API 服务
 */
class DeepSeekService {
    constructor() {
        this.apiKey = 'sk-3e9ea6e416b1483aa2cef4cf8f9412a2'; // 默认API Key
        this.baseURL = 'https://api.deepseek.com/v1';
        this.model = 'deepseek-chat';
        this.conversationHistory = [];
        this.maxHistoryLength = 10; // 保留最近10条对话
    }

    /**
     * 设置API Key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        // 保存到localStorage（加密存储）
        localStorage.setItem('lifeflow_ai_api_key', btoa(apiKey));
    }

    /**
     * 获取API Key
     */
    getApiKey() {
        if (this.apiKey) return this.apiKey;
        
        // 从localStorage读取
        const stored = localStorage.getItem('lifeflow_ai_api_key');
        if (stored) {
            this.apiKey = atob(stored);
            return this.apiKey;
        }
        
        return null;
    }

    /**
     * 初始化系统提示词
     */
    initSystemPrompt(userData) {
        // 构建详细的用户数据描述
        let dataDescription = `你是LifeFlow智能助手🐬，友好专业。

用户今日数据：

📝 生活任务（${userData.lifeTasks || 0}个）：`;
        
        if (userData.lifeTasksList && userData.lifeTasksList.length > 0) {
            userData.lifeTasksList.forEach(task => {
                const status = task.completed ? '✅' : '⏳';
                dataDescription += `\n  ${status} ${task.text}`;
            });
        } else {
            dataDescription += '\n  暂无任务';
        }
        
        dataDescription += `\n\n💪 运动记录（${userData.exerciseToday || 0}分钟，连续${userData.exerciseStreak || 0}天）：`;
        
        if (userData.exerciseList && userData.exerciseList.length > 0) {
            userData.exerciseList.forEach(ex => {
                dataDescription += `\n  • ${ex.name}：${ex.duration}分钟`;
                if (ex.notes) {
                    dataDescription += ` - ${ex.notes}`;
                }
            });
        } else {
            dataDescription += '\n  今天还没有运动记录';
        }
        
        dataDescription += `\n\n📚 学习记录（${userData.learningToday || 0}分钟，连续${userData.learningStreak || 0}天）：`;
        
        if (userData.learningList && userData.learningList.length > 0) {
            userData.learningList.forEach(learn => {
                dataDescription += `\n  • ${learn.name}：${learn.duration}分钟`;
                if (learn.notes) {
                    dataDescription += ` - ${learn.notes}`;
                }
            });
        } else {
            dataDescription += '\n  今天还没有学习记录';
        }
        
        dataDescription += `\n\n回答规则：
- 控制在80-100字左右
- 根据用户的具体活动给出针对性建议
- 可以提到用户做了什么运动、学习了什么
- 适当使用emoji增加亲和力
- 语气温和鼓励，像朋友一样`;

        this.conversationHistory = [
            { role: 'system', content: dataDescription }
        ];
    }

    /**
     * 发送消息到DeepSeek
     */
    async sendMessage(userMessage, userData = {}) {
        console.log('=== DeepSeek sendMessage 开始 ===');
        console.log('用户消息:', userMessage);
        console.log('用户数据:', userData);
        
        if (!this.getApiKey()) {
            console.error('❌ API Key未设置');
            throw new Error('请先设置API Key');
        }

        console.log('✅ API Key已验证');

        // 如果是第一条消息，初始化系统提示词
        if (this.conversationHistory.length === 0) {
            console.log('初始化系统提示词...');
            this.initSystemPrompt(userData);
        }

        // 添加用户消息到历史
        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        console.log('对话历史长度:', this.conversationHistory.length);

        try {
            console.log('🐬 发送请求到DeepSeek...', {
                url: `${this.baseURL}/chat/completions`,
                model: this.model,
                messageCount: this.conversationHistory.length,
                apiKey: this.apiKey.substring(0, 10) + '...'
            });
            
            // 添加超时控制
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.error('⏰ 请求超时，中止请求');
                controller.abort();
            }, 30000); // 30秒超时
            
            const requestBody = {
                model: this.model,
                messages: this.conversationHistory,
                temperature: 0.7,
                max_tokens: 300,  // 增加到300 tokens，约100字
                stream: false
            };
            
            console.log('请求体:', JSON.stringify(requestBody, null, 2));
            
            const fetchStartTime = Date.now();
            console.log('⏱️ 开始 fetch 请求...');
            
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                signal: controller.signal,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            const fetchDuration = Date.now() - fetchStartTime;
            console.log(`⏱️ fetch 完成，耗时: ${fetchDuration}ms`);

            clearTimeout(timeoutId);
            console.log('📡 收到响应:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API错误响应:', errorText);
                let errorMessage = `API请求失败 (${response.status})`;
                try {
                    const error = JSON.parse(errorText);
                    errorMessage = error.error?.message || errorMessage;
                } catch (e) {
                    errorMessage = errorText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            console.log('⏱️ 开始解析 JSON...');
            const data = await response.json();
            console.log('✅ API响应成功:', data);
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error('❌ 响应格式错误:', data);
                throw new Error('API响应格式错误');
            }
            
            const assistantMessage = data.choices[0].message.content;
            console.log('💬 AI回复:', assistantMessage);

            // 添加AI回复到历史
            this.conversationHistory.push({
                role: 'assistant',
                content: assistantMessage
            });

            // 限制历史长度
            this.trimHistory();

            console.log('=== DeepSeek sendMessage 成功结束 ===');

            return {
                success: true,
                message: assistantMessage,
                usage: data.usage
            };

        } catch (error) {
            console.error('❌ DeepSeek API Error:', error);
            console.error('错误类型:', error.name);
            console.error('错误消息:', error.message);
            console.error('错误堆栈:', error.stack);
            
            let errorMessage = error.message;
            
            // 特殊错误处理
            if (error.name === 'AbortError') {
                errorMessage = '请求超时（30秒），请检查网络连接';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = '网络请求失败，可能原因：\n1. 网络连接问题\n2. 需要科学上网\n3. CORS跨域限制';
            } else if (error.message.includes('401')) {
                errorMessage = 'API Key无效或已过期';
            } else if (error.message.includes('429')) {
                errorMessage = '请求过于频繁，请稍后再试';
            } else if (error.message.includes('insufficient_quota')) {
                errorMessage = 'API余额不足，请充值';
            }
            
            console.error('错误详情:', {
                message: errorMessage,
                originalError: error.message,
                stack: error.stack
            });
            
            console.log('=== DeepSeek sendMessage 失败结束 ===');
            
            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * 流式响应（打字机效果）
     */
    async sendMessageStream(userMessage, userData = {}, onChunk) {
        if (!this.getApiKey()) {
            throw new Error('请先设置API Key');
        }

        if (this.conversationHistory.length === 0) {
            this.initSystemPrompt(userData);
        }

        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        try {
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: this.conversationHistory,
                    temperature: 0.7,
                    max_tokens: 150,
                    stream: true
                })
            });

            if (!response.ok) {
                throw new Error('API请求失败');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullMessage = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const json = JSON.parse(data);
                            const content = json.choices[0]?.delta?.content || '';
                            if (content) {
                                fullMessage += content;
                                onChunk(content);
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }
            }

            // 添加完整消息到历史
            this.conversationHistory.push({
                role: 'assistant',
                content: fullMessage
            });

            this.trimHistory();

            return {
                success: true,
                message: fullMessage
            };

        } catch (error) {
            console.error('DeepSeek Stream Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 限制对话历史长度
     */
    trimHistory() {
        // 保留系统提示词 + 最近的对话
        if (this.conversationHistory.length > this.maxHistoryLength + 1) {
            this.conversationHistory = [
                this.conversationHistory[0], // 系统提示词
                ...this.conversationHistory.slice(-(this.maxHistoryLength))
            ];
        }
    }

    /**
     * 清空对话历史
     */
    clearHistory() {
        this.conversationHistory = [];
    }

    /**
     * 获取对话历史
     */
    getHistory() {
        return this.conversationHistory.filter(msg => msg.role !== 'system');
    }

    /**
     * 生成特定类型的建议
     */
    async generateSuggestion(type, userData) {
        const prompts = {
            exercise: `根据我的运动数据（今日${userData.exerciseToday}分钟，连续${userData.exerciseStreak}天），给我一些运动建议和拉伸指导。`,
            learning: `根据我的学习数据（今日${userData.learningToday}分钟，连续${userData.learningStreak}天），给我一些学习方法和效率提升建议。`,
            life: `根据我今天有${userData.lifeTasks}个待办任务，给我一些时间管理和效率提升的建议。`,
            summary: `帮我总结今天的整体情况：运动${userData.exerciseToday}分钟，学习${userData.learningToday}分钟，${userData.lifeTasks}个任务。`
        };

        return await this.sendMessage(prompts[type] || prompts.summary, userData);
    }

    /**
     * 测试API连接
     */
    async testConnection() {
        try {
            const response = await this.sendMessage('你好');
            return response.success;
        } catch (error) {
            return false;
        }
    }
}

// 创建全局实例
const deepseekService = new DeepSeekService();
