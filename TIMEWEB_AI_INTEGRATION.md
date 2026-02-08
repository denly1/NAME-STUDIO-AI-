# Timeweb Cloud AI Integration

## Обзор

Интегрирован **Timeweb Cloud AI** (DeepSeek V3.2) как альтернативный AI провайдер наряду с Artemox AI.

---

## 🔧 Реализованные компоненты

### 1. Конфигурация провайдеров (`src/config/aiProviders.ts`)

```typescript
export type AIProvider = 'artemox' | 'timeweb';

export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
  artemox: {
    name: 'Artemox AI',
    baseUrl: 'https://api.artemox.com/v1',
    models: ['gpt-4o', 'gpt-5', 'gpt-5.1-codex', ...]
  },
  timeweb: {
    name: 'Timeweb Cloud AI',
    baseUrl: 'https://agent.timeweb.cloud/api/v1/cloud-ai/agents/...',
    models: ['deepseek-v3.2', 'gpt-4o-2024-08-06']
  }
};
```

### 2. Обновленный aiService (`src/services/aiService.ts`)

**Функции:**
- `setAIProvider(provider)` - переключение провайдера
- `getAIProvider()` - получение текущего провайдера
- `getAvailableModels()` - список моделей для текущего провайдера

**Автоматическая маршрутизация:**
```typescript
if (currentProvider === 'timeweb') {
  requestData.provider = 'timeweb';
  requestData.agentAccessId = TIMEWEB_CONFIG.agentAccessId;
} else {
  requestData.provider = 'artemox';
  requestData.apiKey = provider.apiKey;
}
```

### 3. Electron IPC Handler (`electron/main.ts`)

**Поддержка двух провайдеров:**

**Artemox:**
```javascript
hostname: 'api.artemox.com'
path: '/v1/chat/completions'
headers: { Authorization: 'Bearer sk-...' }
```

**Timeweb:**
```javascript
hostname: 'agent.timeweb.cloud'
path: '/api/v1/cloud-ai/agents/{agentAccessId}/v1/chat/completions'
headers: { 'x-proxy-source': 'neurodesk-ide' }
```

### 4. UI для выбора провайдера (`src/components/AIProviderSettings.tsx`)

**Функционал:**
- Визуальный выбор между Artemox и Timeweb
- Отображение доступных моделей
- Индикация активного провайдера
- Показ возможностей (Streaming, Vision, Audio)

---

## 📊 Сравнение провайдеров

| Характеристика | Artemox AI | Timeweb Cloud AI |
|---------------|------------|------------------|
| **Модель** | GPT-4o, GPT-5, Codex | DeepSeek V3.2 |
| **Специализация** | Универсальная | Coding & Reasoning |
| **Количество моделей** | 13+ | 2 |
| **Streaming** | ✅ | ✅ |
| **Vision** | ✅ | ✅ |
| **Audio** | ✅ | ✅ |
| **API Key** | Требуется | Не требуется |
| **Endpoint** | OpenAI-compatible | OpenAI-compatible |

---

## 🚀 Использование

### Переключение провайдера в коде:

```typescript
import { setAIProvider } from './services/aiService';

// Переключиться на Timeweb
setAIProvider('timeweb');

// Переключиться на Artemox
setAIProvider('artemox');
```

### Переключение через UI:

1. Открыть настройки приложения
2. Перейти в раздел "AI Provider"
3. Выбрать нужный провайдер (Artemox или Timeweb)
4. Изменения применяются мгновенно

---

## 🔑 Конфигурация Timeweb

### Agent Access ID:
```
17860839-deaa-48e6-a827-741ad4ce7e6e
```

### Endpoints:

**Chat Completions:**
```
POST https://agent.timeweb.cloud/api/v1/cloud-ai/agents/{agentAccessId}/v1/chat/completions
```

**Models List:**
```
GET https://agent.timeweb.cloud/api/v1/cloud-ai/agents/{agentAccessId}/v1/models
```

### Headers:
```json
{
  "Content-Type": "application/json",
  "x-proxy-source": "neurodesk-ide"
}
```

### Request Body:
```json
{
  "model": "deepseek-v3.2",
  "messages": [
    {
      "role": "user",
      "content": "Hello"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 8000
}
```

---

## 🛠️ Технические детали

### Retry логика

Оба провайдера поддерживают автоматические повторные попытки:
- **Максимум попыток:** 3
- **Задержки:** 1s → 2s → 4s (экспоненциальная)
- **Условия:** ETIMEDOUT, ECONNREFUSED, ENOTFOUND

### Обработка ошибок

**HTTP коды:**
- `401/403` - Ошибка авторизации
- `404` - Агент не найден (только Timeweb)
- `429` - Превышен лимит запросов
- `502` - Сервер недоступен
- `503` - Сервис перегружен

### Логирование

```javascript
console.log(`AI API Request to ${provider}:`, { hostname, path });
console.log(`${provider} API Response Status:`, res.statusCode);
console.log(`${provider} API Parsed Response:`, parsed);
```

---

## 📝 Модели

### Artemox AI:
- gpt-4o (рекомендуется)
- gpt-4o-mini
- gpt-4, gpt-4-turbo
- gpt-3.5-turbo
- gpt-5, gpt-5-mini, gpt-5.1, gpt-5.2
- gpt-5.1-codex, gpt-5.1-codex-mini, gpt-5.1-codex-max
- o3-mini, o4-mini

### Timeweb Cloud AI:
- deepseek-v3.2 (основная)
- gpt-4o-2024-08-06

---

## 🎯 Преимущества DeepSeek V3.2

1. **Оптимизация для кода** - специализированная модель для программирования
2. **Продвинутое рассуждение** - улучшенная логика и анализ
3. **Без API ключа** - использует Agent Access ID
4. **Стабильность** - выделенный агент на Timeweb Cloud

---

## 🔄 Миграция с Artemox на Timeweb

```typescript
// Старый код (только Artemox)
const response = await aiService.chat(message);

// Новый код (с выбором провайдера)
setAIProvider('timeweb'); // Переключиться на Timeweb
const response = await aiService.chat(message);
```

**Никаких изменений в коде не требуется!** API остается совместимым.

---

## 📦 Файлы

```
src/
├── config/
│   └── aiProviders.ts              ✅ Конфигурация провайдеров
├── services/
│   └── aiService.ts                ✅ Обновлен для мульти-провайдера
├── components/
│   └── AIProviderSettings.tsx      ✅ UI выбора провайдера
electron/
└── main.ts                         ✅ IPC handler для обоих API
```

---

## 🧪 Тестирование

### Проверка Artemox:
```typescript
setAIProvider('artemox');
const response = await aiService.chat('Hello');
console.log(response); // Должен работать
```

### Проверка Timeweb:
```typescript
setAIProvider('timeweb');
const response = await aiService.chat('Hello');
console.log(response); // Должен работать
```

### Проверка переключения:
```typescript
setAIProvider('artemox');
const response1 = await aiService.chat('Test 1');

setAIProvider('timeweb');
const response2 = await aiService.chat('Test 2');
// Оба должны работать корректно
```

---

## ✅ Готово к использованию

Приложение теперь поддерживает два AI провайдера:
1. **Artemox AI** - по умолчанию, множество моделей
2. **Timeweb Cloud AI** - DeepSeek V3.2 для кода

Переключение между провайдерами происходит мгновенно через UI или программно.

---

## 📞 Поддержка

**Artemox AI:**
- Dashboard: https://artemox.com/ui
- Email: z2076wfx296ge02ijsxytwj@artemox.com

**Timeweb Cloud AI:**
- Server: https://agent.timeweb.cloud
- Agent ID: 17860839-deaa-48e6-a827-741ad4ce7e6e
