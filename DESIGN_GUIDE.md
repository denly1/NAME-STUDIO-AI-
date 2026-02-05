# 🎨 NAME STUDIO AI - Premium Design System

## 🌟 Brand Identity

**NAME STUDIO AI** - The most beautiful, modern, and sophisticated AI-powered development studio.

### Logo & Branding
- **Logo Icon**: `NS` in gradient box with glow effect
- **Primary Gradient**: Purple to Pink (`#667eea → #764ba2 → #f093fb`)
- **Glow Effect**: `0 0 20px rgba(102, 126, 234, 0.6)`

---

## 🎨 Color Palette

### Primary Colors
```css
/* Main Gradients */
--gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
--gradient-secondary: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)
--gradient-text: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)

/* Background Gradients */
--bg-main: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)
--bg-dark: linear-gradient(180deg, #0f0c29 0%, #1a1a2e 100%)
--bg-panel: linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)
--bg-activity: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)
```

### Accent Colors
```css
--purple-primary: #667eea
--purple-dark: #764ba2
--pink-accent: #f093fb
--blue-deep: #0f3460
--navy-dark: #1a1a2e
--navy-medium: #16213e
```

### Text Colors
```css
--text-primary: #e2e8f0
--text-secondary: #a0aec0
--text-muted: #718096
--text-white: #ffffff
```

### Border & Divider Colors
```css
--border-primary: #4a5568
--border-secondary: #3e3e3e
```

---

## 🎯 Component Design Principles

### 1. **Glassmorphism**
- Use `backdrop-filter: blur(10px)` for modern glass effect
- Combine with semi-transparent backgrounds: `rgba(26, 26, 46, 0.6)`

### 2. **Smooth Animations**
```css
transition: all 0.3s ease
transition-all duration-300
```

### 3. **Hover Effects**
- Scale on hover: `hover:scale-105`
- Background glow: `hover:shadow-xl`
- Color transitions: `hover:bg-white/10`

### 4. **Shadows & Depth**
```css
/* Subtle Shadow */
box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3)

/* Medium Shadow */
box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4)

/* Strong Glow */
box-shadow: 0 0 40px rgba(102, 126, 234, 0.6)
```

### 5. **Border Radius**
- Small elements: `rounded-lg` (8px)
- Medium elements: `rounded-xl` (12px)
- Large elements: `rounded-2xl` (16px)

---

## 🧩 Component Styles

### Title Bar
```tsx
background: linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)
border-bottom: 1px solid #4a5568
backdrop-filter: blur(10px)
height: 36px
```

### Activity Bar
```tsx
background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)
width: 56px
border-right: 1px solid #4a5568

// Active State
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
border-left: 3px solid #f093fb
box-shadow: 0 0 20px rgba(102, 126, 234, 0.5)
```

### Explorer Panel
```tsx
background: #252526
header-background: linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)

// Hover States
hover:bg-white/10
transition: all 0.2s
```

### AI Panel
```tsx
background: linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)

// Message Bubbles
user-message: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
ai-message: rgba(26, 26, 46, 0.8) with backdrop-filter: blur(10px)
```

### Editor Panel
```tsx
background: linear-gradient(135deg, #0f0c29 0%, #1a1a2e 100%)

// Active Tab
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3)
```

### Terminal Panel
```tsx
background: linear-gradient(180deg, #0f0c29 0%, #1a1a2e 100%)

// Active Terminal Tab
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3)
```

### Status Bar
```tsx
background: linear-gradient(90deg, #667eea 0%, #764ba2 100%)
height: 28px
color: white
```

---

## 🎪 Button Styles

### Primary Button
```tsx
className="px-4 py-2.5 text-white rounded-xl font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
```

### Secondary Button
```tsx
className="px-3 py-1.5 text-white rounded-lg hover:bg-white/10 transition-all duration-200"
```

### Icon Button
```tsx
className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200"
```

---

## ✨ Special Effects

### Animated Pulse (for unsaved indicators)
```tsx
<span className="text-[#f093fb] animate-pulse">●</span>
```

### Gradient Text
```tsx
style={{
  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent'
}}
```

### Glow Icon Container
```tsx
<div style={{
  padding: '8px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  boxShadow: '0 0 20px rgba(102, 126, 234, 0.5)'
}}>
  <Icon size={24} className="text-white" />
</div>
```

---

## 📐 Spacing & Typography

### Spacing Scale
- xs: 4px (gap-1, p-1)
- sm: 8px (gap-2, p-2)
- md: 12px (gap-3, p-3)
- lg: 16px (gap-4, p-4)
- xl: 20px (gap-5, p-5)

### Typography
```css
/* Headers */
font-size: 20px
font-weight: 900 (font-black)

/* Subheaders */
font-size: 14px
font-weight: 700 (font-bold)

/* Body */
font-size: 13px
font-weight: 500 (font-medium)

/* Small */
font-size: 11px
font-weight: 600 (font-semibold)
```

---

## 🎬 Animation Guidelines

### Transition Durations
- Fast: `duration-200` (200ms) - hover states, small interactions
- Medium: `duration-300` (300ms) - button clicks, tab switches
- Slow: `duration-500` (500ms) - panel animations, large transitions

### Transform Effects
```css
/* Scale on hover */
hover:scale-105

/* Scale on active */
active:scale-95

/* Smooth transitions */
transition-all duration-300
```

---

## 🌈 Usage Examples

### Creating a Premium Card
```tsx
<div 
  className="p-4 rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
  style={{
    background: 'rgba(26, 26, 46, 0.6)',
    border: '1px solid #4a5568',
    backdropFilter: 'blur(10px)'
  }}
>
  {/* Content */}
</div>
```

### Creating a Gradient Button
```tsx
<button
  className="px-4 py-2.5 text-white rounded-xl font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
>
  Click Me
</button>
```

### Creating Gradient Text
```tsx
<span
  className="font-black"
  style={{
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }}
>
  NAME STUDIO AI
</span>
```

---

## 🎯 Design Philosophy

1. **Premium First**: Every element should feel expensive and well-crafted
2. **Smooth Interactions**: All transitions should be buttery smooth
3. **Visual Hierarchy**: Use gradients and shadows to create depth
4. **Consistent Spacing**: Maintain rhythm with consistent padding/margins
5. **Attention to Detail**: Small touches like glows and animations matter
6. **Modern Aesthetics**: Embrace glassmorphism, gradients, and smooth curves
7. **Accessibility**: Ensure good contrast while maintaining beauty

---

## 🚀 Implementation Checklist

- ✅ Title Bar with gradient and branding
- ✅ Activity Bar with animated states
- ✅ Explorer Panel with modern styling
- ✅ AI Panel with glassmorphism
- ✅ Editor Panel with premium tabs
- ✅ Terminal Panel with gradient tabs
- ✅ Status Bar with gradient background
- ✅ All buttons with hover effects
- ✅ Smooth transitions everywhere
- ✅ Gradient text for branding
- ✅ Icon containers with glow effects
- ✅ Context menus with modern styling

---

**NAME STUDIO AI** - Where Beauty Meets Functionality ✨
