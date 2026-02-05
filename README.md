# 🚀 NAME STUDIO AI

**Your Premium AI-Powered Development Studio**

Professional IDE with advanced AI assistant, beautiful modern interface, and powerful development tools. Built for developers who demand the best.

![NAME STUDIO AI](photo_2024-11-29_14-16-41.jpg)

## ✨ Features

### 🤖 **Advanced AI Assistant**
- **Multiple Chat Tabs** - Work on multiple conversations simultaneously
- **Chat History** - Auto-save and restore conversations per project
- **Quick Actions** - Fix errors, refactor, explain, generate tests, analyze code
- **Autonomous Mode** - Let AI work independently on complex tasks
- **Streaming Responses** - Real-time AI responses with progress tracking
- **Diff Viewer** - Color-coded code changes with apply/reject options
- **Context-Aware** - AI understands your entire project structure

### 🎨 **Beautiful Code Editor**
- **Monaco Editor** - Same engine as VS Code
- **Syntax Highlighting** - Support for all major languages
- **IntelliSense** - Smart code completion
- **Multiple Tabs** - Work on multiple files simultaneously
- **Minimap** - Quick navigation through large files
- **Code Folding** - Collapse/expand code blocks
- **Bracket Pair Colorization** - Visual bracket matching

### 📁 **File Management**
- **Project Explorer** - Tree view of your project
- **Quick File Creation** - Right-click context menu
- **Drag & Drop** - Reorganize files easily
- **Search** - Find files and content across project
- **Git Integration** - Built-in version control

### 💻 **Integrated Terminal**
- **Multiple Terminals** - Run several terminals at once
- **PowerShell/CMD Support** - Native Windows terminal
- **Split View** - Terminal alongside code
- **Command History** - Quick access to previous commands

### ⚙️ **Comprehensive Settings**
- **10+ Categories** - General, Appearance, Editor, AI, Terminal, Git, Performance, Privacy, Notifications, Shortcuts
- **40+ Options** - Customize every aspect of the IDE
- **Live Preview** - See changes in real-time
- **Import/Export** - Share settings with team

## 📦 Installation

### For Users (Installer)

1. **Download** the latest installer:
   - Go to [Releases](https://github.com/denly1/NAME-STUDIO-AI-/releases)
   - Download `NAME-STUDIO-AI-Setup-{version}.exe`

2. **Run** the installer:
   - Double-click the downloaded file
   - Follow the installation wizard
   - Choose installation directory
   - Create desktop shortcut (recommended)

3. **Launch** NAME STUDIO AI:
   - Use desktop shortcut or Start Menu
   - Open your first project with `File → Open Folder`

### For Developers (Source)

```bash
# Clone repository
git clone https://github.com/denly1/NAME-STUDIO-AI-.git
cd NAME-STUDIO-AI-

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build installer
npm run build:win
```

## 🎯 Quick Start

1. **Open Project**: `File → Open Folder` or `Ctrl+K Ctrl+O`
2. **Create File**: Right-click in Explorer → `New File`
3. **Edit Code**: Double-click file to open in editor
4. **Use AI**: Press `Ctrl+L` to toggle AI panel
5. **Open Terminal**: Press `` Ctrl+` `` or `View → Terminal`
6. **Settings**: Click ⚙️ icon (top-right) or press `Ctrl+,`

## ⌨️ Keyboard Shortcuts

### File Operations
- `Ctrl+N` - New file
- `Ctrl+O` - Open file
- `Ctrl+S` - Save file
- `Ctrl+Shift+S` - Save as
- `Ctrl+K S` - Save all
- `Ctrl+F4` - Close editor

### Editor
- `Ctrl+F` - Find
- `Ctrl+H` - Replace
- `Ctrl+/` - Toggle comment
- `Ctrl+D` - Duplicate line
- `Alt+Up/Down` - Move line up/down

### AI Assistant
- `Ctrl+L` - Toggle AI panel
- `Ctrl+Enter` - Send message (in AI chat)

### View
- `Ctrl+B` - Toggle sidebar
- `` Ctrl+` `` - Toggle terminal
- `Ctrl+Shift+E` - Show Explorer
- `Ctrl+Shift+F` - Show Search
- `Ctrl+Shift+G` - Show Git

### Other
- `Ctrl+Shift+P` - Command Palette
- `Ctrl+,` - Settings
- `F11` - Fullscreen

## 🛠️ Technologies

| Technology | Purpose |
|------------|---------|
| **Electron** | Cross-platform desktop framework |
| **React** | UI framework |
| **TypeScript** | Type-safe development |
| **Monaco Editor** | Code editor (VS Code engine) |
| **xterm.js** | Terminal emulator |
| **OpenRouter** | AI model routing |
| **Zustand** | State management |
| **TailwindCSS** | Styling |
| **Lucide Icons** | Beautiful icons |

## 📊 System Requirements

### Minimum
- **OS**: Windows 10/11 (64-bit)
- **RAM**: 4 GB
- **Disk**: 500 MB free space
- **Display**: 1280x720

### Recommended
- **OS**: Windows 11 (64-bit)
- **RAM**: 8 GB or more
- **Disk**: 1 GB free space
- **Display**: 1920x1080 or higher

## 🔧 Configuration

### AI Setup

1. Get an API key from [OpenRouter](https://openrouter.ai/)
2. Open Settings (`Ctrl+,`)
3. Go to **AI Assistant** section
4. Enter your API key
5. Choose your preferred model
6. Adjust temperature and max tokens

### Customization

All settings are accessible via:
- Settings panel (`Ctrl+,`)
- 10 categories of options
- Real-time preview
- Auto-save to localStorage

## 📝 Building Installer

To create a distributable installer:

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Create app icon
npm run create-icon

# 3. Build the application
npm run build

# 4. Create Windows installer
npm run build:win
```

The installer will be created in `release/` directory:
- `NAME-STUDIO-AI-Setup-{version}.exe`

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see [LICENSE.txt](LICENSE.txt)

## 🌟 Credits

**NAME STUDIO AI** - Premium AI-Powered Development Studio

Made with ❤️ by the NAME STUDIO Team

## 📞 Support

- **GitHub Issues**: [Report bugs](https://github.com/denly1/NAME-STUDIO-AI-/issues)
- **Discussions**: [Ask questions](https://github.com/denly1/NAME-STUDIO-AI-/discussions)
- **Repository**: [View source](https://github.com/denly1/NAME-STUDIO-AI-)

---

**⭐ Star us on GitHub if you like NAME STUDIO AI!**
