// Prompt Manager - Template Management and Variable Substitution

export interface PromptTemplate {
  id: string;
  name: string;
  category: 'autocode' | 'refactor' | 'debug' | 'document' | 'test' | 'custom';
  content: string;
  variables: string[];
  description: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

export class PromptManager {
  private templates: Map<string, PromptTemplate> = new Map();
  private customTemplates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
    this.loadCustomTemplates();
  }

  // Initialize default templates
  private initializeDefaultTemplates(): void {
    const defaultTemplates: PromptTemplate[] = [
      {
        id: 'autocode',
        name: 'Автогенерация кода',
        category: 'autocode',
        content: `Сгенерируй {{functionality}} для проекта {{project_name}} на языке {{language}}.

Контекст проекта:
- Файлы: {{project_files}}
- Зависимости: {{dependencies}}
- Текущий файл: {{current_file}}
- Фреймворк: {{framework}}

Требования:
- Следуй стилю кода проекта
- Добавь подробные комментарии
- Используй существующие паттерны и конвенции
- Обработай возможные ошибки
- Добавь типизацию (если применимо)

Сгенерируй полный рабочий код с объяснениями.`,
        variables: ['functionality', 'project_name', 'language', 'project_files', 'dependencies', 'current_file', 'framework'],
        description: 'Генерация нового функционала с учетом контекста проекта',
        icon: '✨',
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0
      },
      {
        id: 'refactor',
        name: 'Рефакторинг кода',
        category: 'refactor',
        content: `Оптимизируй и улучши читаемость следующего кода:

\`\`\`{{language}}
{{selected_code}}
\`\`\`

Файл: {{current_file}}
Проект: {{project_name}}

Требования:
- Сохрани всю функциональность
- Улучши производительность
- Упрости сложные участки
- Добавь типизацию (если применимо)
- Следуй best practices для {{language}}
- Улучши названия переменных и функций
- Добавь комментарии к сложным участкам

Объясни какие улучшения были сделаны и почему.`,
        variables: ['selected_code', 'language', 'current_file', 'project_name'],
        description: 'Оптимизация и улучшение существующего кода',
        icon: '🔧',
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0
      },
      {
        id: 'debug',
        name: 'Исправление ошибок',
        category: 'debug',
        content: `Найди и исправь ошибки в следующем коде:

\`\`\`{{language}}
{{code_with_error}}
\`\`\`

Ошибка:
\`\`\`
{{error_message}}
\`\`\`

Стек вызовов:
\`\`\`
{{stack_trace}}
\`\`\`

Контекст:
- Файл: {{current_file}}
- Строка: {{line_number}}
- Проект: {{project_name}}

Требования:
- Объясни причину ошибки простым языком
- Предложи исправленный код
- Добавь проверки для предотвращения подобных ошибок
- Предложи улучшения для повышения надежности
- Объясни как избежать таких ошибок в будущем`,
        variables: ['code_with_error', 'error_message', 'stack_trace', 'language', 'current_file', 'line_number', 'project_name'],
        description: 'Поиск и исправление ошибок с объяснениями',
        icon: '🐛',
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0
      },
      {
        id: 'document',
        name: 'Документация',
        category: 'document',
        content: `Создай подробную документацию для следующего кода:

\`\`\`{{language}}
{{code_block}}
\`\`\`

Файл: {{current_file}}
Тип: {{code_type}}

Требования:
- Используй {{doc_format}} формат (JSDoc/docstring/etc.)
- Опиши назначение и функциональность
- Опиши все параметры с типами
- Опиши возвращаемое значение
- Добавь примеры использования
- Опиши возможные исключения/ошибки
- Добавь примечания о производительности (если важно)
- Укажи связанные функции/классы

Сделай документацию понятной для других разработчиков.`,
        variables: ['code_block', 'language', 'current_file', 'code_type', 'doc_format'],
        description: 'Создание подробной документации для кода',
        icon: '📚',
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0
      },
      {
        id: 'test',
        name: 'Генерация тестов',
        category: 'test',
        content: `Создай unit-тесты для следующего кода:

\`\`\`{{language}}
{{code_to_test}}
\`\`\`

Файл: {{current_file}}
Проект: {{project_name}}
Тестовый фреймворк: {{test_framework}}

Требования:
- Покрой все функции и методы
- Протестируй граничные случаи
- Протестируй обработку ошибок
- Используй {{test_framework}}
- Используй понятные названия тестов
- Добавь комментарии к сложным тестам
- Проверь различные сценарии использования
- Добавь тесты для edge cases

Создай полный набор тестов с хорошим покрытием.`,
        variables: ['code_to_test', 'language', 'current_file', 'project_name', 'test_framework'],
        description: 'Создание unit-тестов с полным покрытием',
        icon: '🧪',
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0
      },
      {
        id: 'explain',
        name: 'Объяснение кода',
        category: 'custom',
        content: `Объясни подробно что делает этот код:

\`\`\`{{language}}
{{code_to_explain}}
\`\`\`

Файл: {{current_file}}

Требования:
- Объясни общую логику
- Разбери построчно сложные участки
- Объясни используемые паттерны
- Укажи потенциальные проблемы
- Предложи возможные улучшения
- Используй простой язык

Объясни так, чтобы было понятно даже начинающему разработчику.`,
        variables: ['code_to_explain', 'language', 'current_file'],
        description: 'Подробное объяснение кода',
        icon: '💡',
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0
      },
      {
        id: 'optimize',
        name: 'Оптимизация производительности',
        category: 'refactor',
        content: `Оптимизируй производительность следующего кода:

\`\`\`{{language}}
{{code_to_optimize}}
\`\`\`

Файл: {{current_file}}
Проблема: {{performance_issue}}

Требования:
- Найди узкие места
- Предложи оптимизации
- Сохрани читаемость
- Объясни улучшения производительности
- Добавь комментарии о сложности алгоритмов
- Предложи альтернативные подходы

Сделай код быстрее, но сохрани его понятность.`,
        variables: ['code_to_optimize', 'language', 'current_file', 'performance_issue'],
        description: 'Оптимизация производительности кода',
        icon: '⚡',
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0
      },
      {
        id: 'convert',
        name: 'Конвертация языка',
        category: 'custom',
        content: `Конвертируй следующий код из {{source_language}} в {{target_language}}:

\`\`\`{{source_language}}
{{code_to_convert}}
\`\`\`

Требования:
- Сохрани всю функциональность
- Используй идиоматичный код для {{target_language}}
- Адаптируй под особенности {{target_language}}
- Добавь комментарии о важных изменениях
- Используй стандартные библиотеки {{target_language}}

Создай эквивалентный код на {{target_language}}.`,
        variables: ['code_to_convert', 'source_language', 'target_language'],
        description: 'Конвертация кода между языками программирования',
        icon: '🔄',
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Template Management
  getTemplate(id: string): PromptTemplate | null {
    return this.templates.get(id) || this.customTemplates.get(id) || null;
  }

  listTemplates(category?: PromptTemplate['category']): PromptTemplate[] {
    const allTemplates = [
      ...Array.from(this.templates.values()),
      ...Array.from(this.customTemplates.values())
    ];

    if (category) {
      return allTemplates.filter(t => t.category === category);
    }

    return allTemplates.sort((a, b) => b.usageCount - a.usageCount);
  }

  saveTemplate(template: PromptTemplate): void {
    template.updatedAt = new Date();
    
    if (this.templates.has(template.id)) {
      this.templates.set(template.id, template);
    } else {
      this.customTemplates.set(template.id, template);
      this.saveCustomTemplates();
    }
  }

  deleteTemplate(id: string): boolean {
    // Can't delete default templates
    if (this.templates.has(id)) {
      return false;
    }

    const deleted = this.customTemplates.delete(id);
    if (deleted) {
      this.saveCustomTemplates();
    }
    return deleted;
  }

  // Variable Substitution
  renderPrompt(templateId: string, variables: Record<string, any>): string {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    let rendered = template.content;

    // Replace all variables
    template.variables.forEach(varName => {
      const value = variables[varName] || '';
      const regex = new RegExp(`{{${varName}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    });

    // Track usage
    template.usageCount++;
    this.saveTemplate(template);

    return rendered;
  }

  extractVariables(content: string): string[] {
    const regex = /{{(\w+)}}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  // Custom Prompts
  createCustomPrompt(
    name: string,
    content: string,
    category: PromptTemplate['category'] = 'custom',
    description: string = '',
    icon: string = '📝'
  ): PromptTemplate {
    const id = `custom_${Date.now()}`;
    const variables = this.extractVariables(content);

    const template: PromptTemplate = {
      id,
      name,
      category,
      content,
      variables,
      description,
      icon,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    };

    this.customTemplates.set(id, template);
    this.saveCustomTemplates();

    return template;
  }

  editPrompt(id: string, updates: Partial<PromptTemplate>): boolean {
    const template = this.customTemplates.get(id);
    if (!template) {
      return false;
    }

    Object.assign(template, updates, {
      updatedAt: new Date()
    });

    // Re-extract variables if content changed
    if (updates.content) {
      template.variables = this.extractVariables(updates.content);
    }

    this.saveCustomTemplates();
    return true;
  }

  // Quick Actions
  getQuickActions(): Array<{ id: string; name: string; icon: string; description: string }> {
    return [
      { id: 'autocode', name: 'Генерация кода', icon: '✨', description: 'Создать новый функционал' },
      { id: 'refactor', name: 'Рефакторинг', icon: '🔧', description: 'Улучшить код' },
      { id: 'debug', name: 'Исправить ошибки', icon: '🐛', description: 'Найти и исправить баги' },
      { id: 'document', name: 'Документация', icon: '📚', description: 'Создать документацию' },
      { id: 'test', name: 'Тесты', icon: '🧪', description: 'Сгенерировать тесты' },
      { id: 'explain', name: 'Объяснить', icon: '💡', description: 'Объяснить код' },
      { id: 'optimize', name: 'Оптимизация', icon: '⚡', description: 'Улучшить производительность' },
      { id: 'convert', name: 'Конвертация', icon: '🔄', description: 'Конвертировать язык' }
    ];
  }

  // Persistence
  private saveCustomTemplates(): void {
    try {
      const data = Array.from(this.customTemplates.entries());
      localStorage.setItem('ai_custom_templates', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save custom templates:', error);
    }
  }

  private loadCustomTemplates(): void {
    try {
      const data = localStorage.getItem('ai_custom_templates');
      if (data) {
        const entries = JSON.parse(data);
        this.customTemplates = new Map(entries);
      }
    } catch (error) {
      console.error('Failed to load custom templates:', error);
    }
  }

  // Export/Import
  exportTemplates(): string {
    const allTemplates = [
      ...Array.from(this.customTemplates.values())
    ];
    return JSON.stringify(allTemplates, null, 2);
  }

  importTemplates(json: string): number {
    try {
      const templates: PromptTemplate[] = JSON.parse(json);
      let imported = 0;

      templates.forEach(template => {
        // Generate new ID to avoid conflicts
        template.id = `imported_${Date.now()}_${imported}`;
        template.createdAt = new Date();
        template.updatedAt = new Date();
        
        this.customTemplates.set(template.id, template);
        imported++;
      });

      this.saveCustomTemplates();
      return imported;
    } catch (error) {
      console.error('Failed to import templates:', error);
      return 0;
    }
  }

  // Statistics
  getStatistics(): {
    totalTemplates: number;
    customTemplates: number;
    totalUsage: number;
    mostUsed: PromptTemplate | null;
  } {
    const allTemplates = [
      ...Array.from(this.templates.values()),
      ...Array.from(this.customTemplates.values())
    ];

    const totalUsage = allTemplates.reduce((sum, t) => sum + t.usageCount, 0);
    const mostUsed = allTemplates.reduce((max, t) => 
      t.usageCount > (max?.usageCount || 0) ? t : max, 
      null as PromptTemplate | null
    );

    return {
      totalTemplates: allTemplates.length,
      customTemplates: this.customTemplates.size,
      totalUsage,
      mostUsed
    };
  }
}

// Singleton instance
export const promptManager = new PromptManager();
