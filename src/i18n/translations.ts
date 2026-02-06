// Internationalization - English and Russian translations

export type Language = 'en' | 'ru';

export interface Translations {
  // Menu Bar
  file: string;
  edit: string;
  selection: string;
  view: string;
  go: string;
  run: string;
  terminal: string;
  help: string;
  
  // File Menu
  newFile: string;
  openFile: string;
  openFolder: string;
  save: string;
  saveAs: string;
  saveAll: string;
  closeEditor: string;
  closeFolder: string;
  
  // Edit Menu
  undo: string;
  redo: string;
  cut: string;
  copy: string;
  paste: string;
  find: string;
  replace: string;
  
  // View Menu
  commandPalette: string;
  explorer: string;
  search: string;
  sourceControl: string;
  extensions: string;
  toggleTerminal: string;
  toggleAI: string;
  
  // Terminal
  newTerminal: string;
  splitTerminal: string;
  clearTerminal: string;
  
  // Status Bar
  problems: string;
  warnings: string;
  errors: string;
  line: string;
  column: string;
  spaces: string;
  
  // Explorer
  openEditors: string;
  noOpenEditors: string;
  refresh: string;
  newFolder: string;
  collapseAll: string;
  
  // Context Menu
  openPreview: string;
  openToSide: string;
  openWith: string;
  revealInExplorer: string;
  openInTerminal: string;
  cutFile: string;
  copyFile: string;
  copyPath: string;
  copyRelativePath: string;
  rename: string;
  delete: string;
  
  // AI Panel
  aiAssistant: string;
  askAI: string;
  clearChat: string;
  codeMode: string;
  askMode: string;
  planMode: string;
  
  // Settings
  settings: string;
  general: string;
  editor: string;
  appearance: string;
  language: string;
  theme: string;
  fontSize: string;
  tabSize: string;
  
  // Common
  cancel: string;
  ok: string;
  yes: string;
  no: string;
  apply: string;
  close: string;
  loading: string;
  error: string;
  success: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Menu Bar
    file: 'File',
    edit: 'Edit',
    selection: 'Selection',
    view: 'View',
    go: 'Go',
    run: 'Run',
    terminal: 'Terminal',
    help: 'Help',
    
    // File Menu
    newFile: 'New File',
    openFile: 'Open File',
    openFolder: 'Open Folder',
    save: 'Save',
    saveAs: 'Save As',
    saveAll: 'Save All',
    closeEditor: 'Close Editor',
    closeFolder: 'Close Folder',
    
    // Edit Menu
    undo: 'Undo',
    redo: 'Redo',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    find: 'Find',
    replace: 'Replace',
    
    // View Menu
    commandPalette: 'Command Palette',
    explorer: 'Explorer',
    search: 'Search',
    sourceControl: 'Source Control',
    extensions: 'Extensions',
    toggleTerminal: 'Toggle Terminal',
    toggleAI: 'Toggle AI Panel',
    
    // Terminal
    newTerminal: 'New Terminal',
    splitTerminal: 'Split Terminal',
    clearTerminal: 'Clear Terminal',
    
    // Status Bar
    problems: 'Problems',
    warnings: 'Warnings',
    errors: 'Errors',
    line: 'Ln',
    column: 'Col',
    spaces: 'Spaces',
    
    // Explorer
    openEditors: 'Open Editors',
    noOpenEditors: 'No open editors',
    refresh: 'Refresh Explorer',
    newFolder: 'New Folder',
    collapseAll: 'Collapse All',
    
    // Context Menu
    openPreview: 'Open Preview',
    openToSide: 'Open to the Side',
    openWith: 'Open With...',
    revealInExplorer: 'Reveal in File Explorer',
    openInTerminal: 'Open in Integrated Terminal',
    cutFile: 'Cut',
    copyFile: 'Copy',
    copyPath: 'Copy Path',
    copyRelativePath: 'Copy Relative Path',
    rename: 'Rename',
    delete: 'Delete',
    
    // AI Panel
    aiAssistant: 'AI Assistant',
    askAI: 'Ask NAME STUDIO AI...',
    clearChat: 'Clear Chat',
    codeMode: 'Code',
    askMode: 'Ask',
    planMode: 'Plan',
    
    // Settings
    settings: 'Settings',
    general: 'General',
    editor: 'Editor',
    appearance: 'Appearance',
    language: 'Language',
    theme: 'Theme',
    fontSize: 'Font Size',
    tabSize: 'Tab Size',
    
    // Common
    cancel: 'Cancel',
    ok: 'OK',
    yes: 'Yes',
    no: 'No',
    apply: 'Apply',
    close: 'Close',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
  
  ru: {
    // Menu Bar
    file: 'Файл',
    edit: 'Правка',
    selection: 'Выделение',
    view: 'Вид',
    go: 'Переход',
    run: 'Запуск',
    terminal: 'Терминал',
    help: 'Справка',
    
    // File Menu
    newFile: 'Новый файл',
    openFile: 'Открыть файл',
    openFolder: 'Открыть папку',
    save: 'Сохранить',
    saveAs: 'Сохранить как',
    saveAll: 'Сохранить все',
    closeEditor: 'Закрыть редактор',
    closeFolder: 'Закрыть папку',
    
    // Edit Menu
    undo: 'Отменить',
    redo: 'Повторить',
    cut: 'Вырезать',
    copy: 'Копировать',
    paste: 'Вставить',
    find: 'Найти',
    replace: 'Заменить',
    
    // View Menu
    commandPalette: 'Палитра команд',
    explorer: 'Проводник',
    search: 'Поиск',
    sourceControl: 'Система контроля версий',
    extensions: 'Расширения',
    toggleTerminal: 'Переключить терминал',
    toggleAI: 'Переключить панель ИИ',
    
    // Terminal
    newTerminal: 'Новый терминал',
    splitTerminal: 'Разделить терминал',
    clearTerminal: 'Очистить терминал',
    
    // Status Bar
    problems: 'Проблемы',
    warnings: 'Предупреждения',
    errors: 'Ошибки',
    line: 'Стр',
    column: 'Стлб',
    spaces: 'Пробелы',
    
    // Explorer
    openEditors: 'Открытые редакторы',
    noOpenEditors: 'Нет открытых редакторов',
    refresh: 'Обновить проводник',
    newFolder: 'Новая папка',
    collapseAll: 'Свернуть все',
    
    // Context Menu
    openPreview: 'Открыть предпросмотр',
    openToSide: 'Открыть сбоку',
    openWith: 'Открыть с помощью...',
    revealInExplorer: 'Показать в проводнике',
    openInTerminal: 'Открыть в терминале',
    cutFile: 'Вырезать',
    copyFile: 'Копировать',
    copyPath: 'Копировать путь',
    copyRelativePath: 'Копировать относительный путь',
    rename: 'Переименовать',
    delete: 'Удалить',
    
    // AI Panel
    aiAssistant: 'ИИ Ассистент',
    askAI: 'Спросить NAME STUDIO AI...',
    clearChat: 'Очистить чат',
    codeMode: 'Код',
    askMode: 'Вопрос',
    planMode: 'План',
    
    // Settings
    settings: 'Настройки',
    general: 'Общие',
    editor: 'Редактор',
    appearance: 'Внешний вид',
    language: 'Язык',
    theme: 'Тема',
    fontSize: 'Размер шрифта',
    tabSize: 'Размер табуляции',
    
    // Common
    cancel: 'Отмена',
    ok: 'ОК',
    yes: 'Да',
    no: 'Нет',
    apply: 'Применить',
    close: 'Закрыть',
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
  }
};

// Language Store
class LanguageStore {
  private currentLanguage: Language = 'ru'; // Default to Russian
  
  constructor() {
    this.loadLanguage();
  }
  
  private loadLanguage(): void {
    const saved = localStorage.getItem('app_language');
    if (saved === 'en' || saved === 'ru') {
      this.currentLanguage = saved;
    }
  }
  
  setLanguage(lang: Language): void {
    this.currentLanguage = lang;
    localStorage.setItem('app_language', lang);
    // Trigger re-render
    window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
  }
  
  getLanguage(): Language {
    return this.currentLanguage;
  }
  
  t(key: keyof Translations): string {
    return translations[this.currentLanguage][key];
  }
}

export const languageStore = new LanguageStore();

// Hook for React components
export function useTranslation() {
  const [language, setLanguage] = React.useState(languageStore.getLanguage());
  
  React.useEffect(() => {
    const handleLanguageChange = (e: CustomEvent) => {
      setLanguage(e.detail);
    };
    
    window.addEventListener('languageChange', handleLanguageChange as EventListener);
    return () => window.removeEventListener('languageChange', handleLanguageChange as EventListener);
  }, []);
  
  return {
    t: (key: keyof Translations) => translations[language][key],
    language,
    setLanguage: (lang: Language) => languageStore.setLanguage(lang)
  };
}

// Import React for the hook
import React from 'react';
