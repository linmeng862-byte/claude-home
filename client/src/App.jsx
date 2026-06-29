import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Plus, MessageSquare, Settings, Trash2,
  ChevronLeft, ChevronRight, Bot, User, Sparkles,
  Sun, Moon, X, Paperclip, Camera, Play, Pause, SkipForward, SkipBack,
  MessageCircle, BookOpen, NotebookPen, Music, Brain, Database,
  Copy, RefreshCw, ChevronDown, Image as ImageIcon, Mic, Heart, Headphones,
  Search, Bookmark, Pen, CheckCircle, Circle, ArrowLeft, MoreHorizontal, MoreVertical
} from 'lucide-react'
import './App.css'

// ============ 调色板 — kimi-room + 用户自定义 ============
const MUCHA = {
  dark: {
    bg: 'radial-gradient(ellipse at 50% 10%, #1a1612 0%, #0a0806 70%)',
    paper: '#100c08', ink: '#f3e6cd', accent: '#c19a56', accent2: '#8a9b6e',
    mute: 'rgba(243,230,205,0.55)', hair: 'rgba(193,154,86,0.38)',
  },
  light: {
    bg: 'linear-gradient(180deg, #F8F8FF 0%, #fbf7ee 40%, #f4ecdc 100%)',
    paper: 'rgba(255,255,253,0.85)', ink: '#3a2a1c', accent: '#8a6558', accent2: '#b8a296',
    mute: 'rgba(58,42,28,0.45)', hair: 'rgba(138,101,88,0.18)', hairDark: '#6a4a3c',
  }
}

const USER_COLORS = [
  { name: '雪白',     light: '#FFFAFA', dark: '#1a1a1e' },
  { name: '蜜瓜绿',   light: '#F0FFF0', dark: '#1a2420' },
  { name: '爱丽丝蓝', light: '#F0F8FF', dark: '#1a2030' },
  { name: '薰衣草粉', light: '#FFF0F5', dark: '#2a1a28' },
]

const MODULES = [
  { id: 'chat',    name: 'Chat',    icon: MessageCircle, roman: 'I',   sub: '对话', iconSrc: null },
  { id: 'reading', name: 'Reading', icon: BookOpen,      roman: 'II',  sub: '阅读', iconSrc: '/icons/9.png' },
  { id: 'diary',   name: 'Diary',   icon: NotebookPen,   roman: 'III', sub: '日记', iconSrc: '/icons/10.png' },
  { id: 'music',   name: 'Music',   icon: Music,         roman: 'IV',  sub: '音乐', iconSrc: null },
  { id: 'memory',  name: 'Memory',  icon: Database,      roman: 'V',   sub: '记忆', iconSrc: '/icons/12.png' },
  { id: 'thinking',name: 'Thinking',icon: Brain,         roman: 'VI',  sub: '思考', iconSrc: '/icons/11.png' },
  { id: 'moment',  name: 'Moment',  icon: Heart,         roman: 'VII', sub: '瞬间', iconSrc: null },
]

const APP_ICONS = [ // 上方4个 app 图标
  { id: 'reading',  name: 'Reading',  iconSrc: '/icons/9.png' },
  { id: 'diary',    name: 'Diary',    iconSrc: '/icons/10.png' },
  { id: 'thinking', name: 'Thinking', iconSrc: '/icons/11.png' },
  { id: 'memory',  name: 'Memory',  iconSrc: '/icons/12.png' },
]

const DOCK_APPS = [ // 下方 dock
  { id: 'chat',    name: 'Chat',    iconSrc: '/icons/13.png' },
  { id: 'moment',  name: 'Moment',  iconSrc: '/icons/14.png' },
  { id: 'settings', name: 'Setting', iconSrc: '/icons/setting.png' },
]

const MODEL_OPTIONS = [
  { id: 'claude-sonnet', name: 'Claude Sonnet 4' },
  { id: 'claude-opus',   name: 'Claude Opus 4' },
  { id: 'deepseek',      name: 'DeepSeek' },
]

/* ============================================================
   SVG 装饰组件 — 参考 kimi-room
   ============================================================ */
function MuchaArch({ color, accent }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', color }}>
      <svg viewBox="0 0 380 140" style={{ position: 'absolute', top: -36, left: '50%', transform: 'translateX(-50%)', width: 380, height: 140 }}>
        <path d="M30 90 Q30 30 190 24 Q350 30 350 90" fill="none" stroke="currentColor" strokeWidth="0.9" />
        <path d="M42 90 Q42 42 190 36 Q338 42 338 90" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
        <g fill="currentColor" opacity="0.85"><circle cx="190" cy="18" r="5.5" /><circle cx="174" cy="24" r="3.8" /><circle cx="206" cy="24" r="3.8" /><circle cx="160" cy="30" r="2.8" /><circle cx="220" cy="30" r="2.8" /></g>
        <g stroke="currentColor" fill="none" strokeWidth="0.5"><path d="M150 34 Q128 64 116 98" /><path d="M230 34 Q252 64 264 98" /><path d="M190 26 L190 90" /></g>
        <g fill="#F0FFF0" opacity="0.6"><ellipse cx="106" cy="95" rx="3.5" ry="9" transform="rotate(-30 106 95)" /><ellipse cx="274" cy="95" rx="3.5" ry="9" transform="rotate(30 274 95)" /><ellipse cx="84" cy="122" rx="3" ry="8" transform="rotate(-42 84 122)" /><ellipse cx="296" cy="122" rx="3" ry="8" transform="rotate(42 296 122)" /></g>
        {/* 玫瑰 — 左右柱各3朵 */}
        {[128,140,154].map((y,i) => <circle key={`rl${i}`} cx={118-i*3} cy={y} r={3.5-i*0.5} fill="#FFE4E1" opacity="0.7" />)}
        {[128,140,154].map((y,i) => <circle key={`rr${i}`} cx={262+i*3} cy={y} r={3.5-i*0.5} fill="#FFE4E1" opacity="0.7" />)}
        <rect x="14" y="86" width="18" height="7" fill="currentColor" opacity="0.3" />
        <rect x="348" y="86" width="18" height="7" fill="currentColor" opacity="0.3" />
        <g stroke="currentColor" fill="none" strokeWidth="0.7"><path d="M10 86 Q24 68 24 50 Q24 68 38 86" /><path d="M342 86 Q356 68 356 50 Q356 68 370 86" /></g>
        <circle cx="24" cy="50" r="2.2" fill={accent} /><circle cx="356" cy="50" r="2.2" fill={accent} />
      </svg>
      {/* 双柱 */}
      <div style={{ position: 'absolute', top: 55, bottom: 64, left: 18, width: 9, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, borderLeft: `0.7px solid ${color}` }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 9, borderLeft: `0.7px solid ${color}` }} />
      </div>
      <div style={{ position: 'absolute', top: 55, bottom: 64, right: 18, width: 9, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, borderLeft: `0.7px solid ${color}` }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 9, borderLeft: `0.7px solid ${color}` }} />
      </div>
      {/* 底弧 */}
      <svg viewBox="0 0 380 64" style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 380, height: 64 }}>
        <path d="M18 0 Q18 38 36 48 L344 48 Q362 38 362 0" fill="none" stroke="currentColor" strokeWidth="0.9" />
        <path d="M28 0 Q28 30 44 40 L336 40 Q352 30 352 0" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
      </svg>
    </div>
  )
}

function MuchaVine({ color, accent, width = '100%' }) {
  return (
    <svg viewBox="0 0 300 24" width={width} style={{ color, display: 'block' }}>
      <path d="M10 12 Q30 4 50 12 Q70 20 90 12 Q110 4 130 12 Q150 20 170 12 Q190 4 210 12 Q230 20 250 12 Q270 4 290 12" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <g fill={accent} opacity="0.8"><circle cx="50" cy="12" r="2" /><circle cx="150" cy="12" r="2.5" /><circle cx="250" cy="12" r="2" /></g>
    </svg>
  )
}

function MuchaMedallion({ color, accent, size = 160 }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} style={{ color }}>
      <circle cx="40" cy="40" r="18" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="40" cy="40" r="14" fill={accent} opacity="0.15" />
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2, r1 = 22, r2 = i % 2 === 0 ? 32 : 28
        return <line key={i} x1={40+Math.cos(a)*r1} y1={40+Math.sin(a)*r1} x2={40+Math.cos(a)*r2} y2={40+Math.sin(a)*r2} stroke="currentColor" strokeWidth="0.5" />
      })}
      <circle cx="40" cy="40" r="3" fill={accent} />
    </svg>
  )
}

function MuchaMosaic({ color, accent, size = 36 }) {
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} style={{ color }}>
      {Array.from({ length: 6 }).flatMap((_, r) =>
        Array.from({ length: 6 }).map((_, c) => {
          const d = (r + c) % 3
          return <rect key={`${r}-${c}`} x={c*10} y={r*10} width="9" height="9" fill={d===0?'currentColor':d===1?accent:'none'} stroke="currentColor" strokeWidth="0.3" opacity={d===0?0.15:d===1?0.3:0.6} />
        })
      )}
    </svg>
  )
}

/* 月相 SVG — 根据真实日期计算 */
function getMoonPhase() {
  const now = new Date()
  const year = now.getFullYear(), month = now.getMonth() + 1, day = now.getDate()
  if (month < 3) { year -= 1; month += 12 }
  const jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day - 1524.5
  const phase = ((jd - 2451550.1) / 29.530588853) % 1
  return Math.max(0, Math.min(1, phase < 0 ? phase + 1 : phase))
}

function MoonPhaseSvg({ size = 56 }) {
  const phase = getMoonPhase()
  const r = size / 2 - 3
  const illumination = phase <= 0.5 ? phase * 2 : (1 - phase) * 2
  const isWaxing = phase <= 0.5
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ filter: 'drop-shadow(0 0 6px rgba(212,154,86,0.28))' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="#f3e6cd" />
      <clipPath id="mp-clip"><circle cx={size/2} cy={size/2} r={r} /></clipPath>
      {illumination < 0.98 && (
        <ellipse cx={size/2 + (isWaxing ? -1 : 1) * r * (1 - illumination)} cy={size/2}
          rx={r * Math.abs(1 - illumination * 2)} ry={r}
          fill="#0a0806" clipPath="url(#mp-clip)" />
      )}
    </svg>
  )
}

/* 日间重瓣玫瑰 */
function DayRose({ size = 56, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56">
      <circle cx="28" cy="28" r="22" fill={color} opacity="0.12" stroke={color} strokeWidth="0.6" />
      {/* 外层花瓣 */}
      {[0,45,90,135,180,225,270,315].map(deg => (
        <ellipse key={deg} cx="28" cy="18" rx="4" ry="9" fill={color} opacity="0.28" transform={`rotate(${deg} 28 28)`} />
      ))}
      {/* 内层花瓣 */}
      {[22,67,112,157,202,247,292,337].map(deg => (
        <ellipse key={deg} cx="28" cy="21" rx="3" ry="6.5" fill={color} opacity="0.45" transform={`rotate(${deg} 28 28)`} />
      ))}
      <circle cx="28" cy="28" r="6" fill={color} opacity="0.55" />
      <circle cx="28" cy="28" r="2.5" fill={color} opacity="0.8" />
    </svg>
  )
}

/* 双头像组件 — 参考 kimi-room DualAvatarsClient */
function DualAvatars({ size = 40, accent, userAvatar, aiAvatar }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: -4 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: `2px solid ${accent}`, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(193,154,86,0.08)', position: 'relative', zIndex: 2,
      }}>
        {userAvatar ? <img src={userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : <User size={size * 0.45} style={{ color: accent }} />}
      </div>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: `2px solid ${accent}`, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(201,99,66,0.08)', marginLeft: -8, position: 'relative', zIndex: 1,
      }}>
        {aiAvatar ? <img src={aiAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : <Bot size={size * 0.45} style={{ color: '#C96342' }} />}
      </div>
    </div>
  )
}

/* ============================================================
   开屏页 — iOS Home Screen 风格 (参考 8.png)
   ============================================================ */
function WelcomeScreen({ onModuleSelect, darkMode, setDarkMode, themeColor, setThemeColor, userAvatar, aiAvatar, homeBg, setHomeBg }) {
  // 照片小组件图片
  const [widgetImg1, setWidgetImg1] = useState(null)
  const [widgetImg2, setWidgetImg2] = useState(null)
  // 音乐封面
  const [songCover, setSongCover] = useState(null)
  const [playing, setPlaying] = useState(false)
  const widget1Ref = useRef(null)
  const widget2Ref = useRef(null)
  const songCoverRef = useRef(null)
  const bgRef = useRef(null)
  // 实时时钟
  const [timeStr, setTimeStr] = useState('')
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setTimeStr(`${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`)
    }
    tick(); const id = setInterval(tick, 10000)
    return () => clearInterval(id)
  }, [])

  const handleWidgetUpload = (which, e) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => { if (which === 1) setWidgetImg1(ev.target.result); else setWidgetImg2(ev.target.result) }
    reader.readAsDataURL(file)
  }

  const handleSongCover = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setSongCover(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleHomeBg = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setHomeBg(ev.target.result)
    reader.readAsDataURL(file)
  }

  // iOS 风格调色板
  const ios = darkMode
    ? { bg: '#0a0a0c', cardBg: 'rgba(28,28,30,0.45)', cardBorder: 'rgba(255,255,255,0.08)',
        text: '#f0eff5', textMuted: '#8e8e93', accent: '#0A84FF', separator: 'rgba(255,255,255,0.06)',
        dockBg: 'rgba(28,28,30,0.45)', widgetOverlay: 'rgba(0,0,0,0.25)',
      }
    : { bg: themeColor || '#F8F8FF', cardBg: 'rgba(255,255,255,0.45)', cardBorder: 'rgba(0,0,0,0.06)',
        text: '#1c1c1e', textMuted: '#8e8e93', accent: '#259CFC', separator: 'rgba(0,0,0,0.06)',
        dockBg: 'rgba(245,245,247,0.45)', widgetOverlay: 'rgba(0,0,0,0.15)',
      }

  return (
    <div className="ios-home" style={{ background: ios.bg, color: ios.text }}>
      {/* 自定义背景图 */}
      {homeBg && <div className="ios-home-bg" style={{ backgroundImage: `url(${homeBg})` }} />}

      <div className="ios-home-scroll">
        {/* 实时时钟 — 占1/3高度 + 液态玻璃磨砂质感 */}
        <div className="ios-clock-wrap" style={{ background: ios.cardBg, border: `0.5px solid ${ios.cardBorder}` }}>
          <div className="ios-clock" style={{ color: ios.text }}>
            {timeStr || '--:--'}
          </div>
          <div className="ios-clock-date" style={{ color: ios.textMuted }}>
            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}
          </div>
        </div>

        {/* 两个并列大圆角正方形照片小组件 — 左右均匀分布贴边 */}
        <div className="ios-widget-row">
          <div className="ios-photo-widget-sq" onClick={() => widget1Ref.current?.click()}
            style={{ background: ios.cardBg, border: `0.5px solid ${ios.cardBorder}` }}>
            {widgetImg1
              ? <img src={widgetImg1} alt="" className="ios-widget-img" />
              : <div className="ios-widget-placeholder"><ImageIcon size={28} style={{ color: ios.textMuted }} /><span style={{ color: ios.textMuted, fontSize: 12 }}>上传图片</span></div>
            }
          </div>
          <div className="ios-photo-widget-sq" onClick={() => widget2Ref.current?.click()}
            style={{ background: ios.cardBg, border: `0.5px solid ${ios.cardBorder}` }}>
            {widgetImg2
              ? <img src={widgetImg2} alt="" className="ios-widget-img" />
              : <div className="ios-widget-placeholder"><ImageIcon size={28} style={{ color: ios.textMuted }} /><span style={{ color: ios.textMuted, fontSize: 12 }}>上传图片</span></div>
            }
          </div>
        </div>
        <input ref={widget1Ref} type="file" accept="image/*" hidden onChange={e => handleWidgetUpload(1, e)} />
        <input ref={widget2Ref} type="file" accept="image/*" hidden onChange={e => handleWidgetUpload(2, e)} />

        {/* Music 短条组件 — 移动端适配，更紧凑 */}
        <div className="ios-music-widget" onClick={() => onModuleSelect('music')}
          style={{ background: ios.cardBg, border: `0.5px solid ${ios.cardBorder}` }}>
          <div className="ios-music-cover" onClick={e => { e.stopPropagation(); songCoverRef.current?.click() }}>
            {songCover
              ? <img src={songCover} alt="" className="ios-music-cover-img" />
              : <Music size={16} style={{ color: ios.textMuted }} />
            }
          </div>
          <div className="ios-music-info">
            <div className="ios-music-title" style={{ color: ios.text }}>Music</div>
          </div>
          <div className="ios-music-actions">
            <button className="ios-music-icon-btn" onClick={e => { e.stopPropagation(); setPlaying(!playing) }}>
              {playing ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <button className="ios-music-icon-btn" onClick={e => e.stopPropagation()}><Heart size={13} /></button>
            <button className="ios-music-icon-btn" onClick={e => e.stopPropagation()}><Headphones size={13} /></button>
          </div>
        </div>
        <input ref={songCoverRef} type="file" accept="image/*" hidden onChange={handleSongCover} />

        {/* 每月日历小组件 — Apple Calendar Widget 风格 */}
        <div className="ios-calendar-widget" style={{ background: ios.cardBg }}>
          {(() => {
            const now = new Date()
            const year = now.getFullYear(), month = now.getMonth(), today = now.getDate()
            const dayName = now.toLocaleDateString('zh-CN', { weekday: 'long' })
            const firstDay = new Date(year, month, 1).getDay()
            const daysInMonth = new Date(year, month + 1, 0).getDate()
            const prevDays = new Date(year, month, 0).getDate()
            const monthName = now.toLocaleDateString('zh-CN', { month: 'long' })
            const weekDays = ['日','一','二','三','四','五','六']
            const lunar = '初四' // placeholder lunar date
            return (
              <div style={{ display: 'flex', gap: 0 }}>
                {/* 左侧 — 大日期 */}
                <div style={{ flex: '0 0 35%', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: 8, paddingRight: 12 }}>
                  <div style={{ fontSize: 42, fontWeight: 500, lineHeight: 1, color: ios.text, letterSpacing: -2 }}>{today}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: ios.text, marginTop: 4 }}>{dayName}</div>
                  <div style={{ fontSize: 10, color: ios.textMuted, marginTop: 2 }}>{lunar}</div>
                  <div style={{ fontSize: 10, color: ios.textMuted, marginTop: 6 }}>今天无日程</div>
                </div>
                {/* 右侧 — 月历网格 */}
                <div style={{ flex: '0 0 65%', paddingLeft: 8, borderLeft: `0.5px solid ${ios.separator}` }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: ios.text, marginBottom: 6 }}>{monthName}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: 9, fontWeight: 500, marginBottom: 4, color: ios.textMuted }}>
                    {weekDays.map(d => <span key={d}>{d}</span>)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: 11, gap: '1px 0' }}>
                    {/* 上月末尾灰字 */}
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <span key={`p${i}`} style={{ color: ios.textMuted, opacity: 0.4 }}>{prevDays - firstDay + i + 1}</span>
                    ))}
                    {/* 本月 */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1
                      const isToday = day === today
                      return (
                        <span key={day} style={{
                          width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: '50%', margin: '0 auto',
                          background: isToday ? '#FF3B30' : 'transparent',
                          color: isToday ? '#fff' : ios.text,
                          fontWeight: isToday ? 600 : 400,
                          fontSize: isToday ? 11 : 10,
                        }}>{day}</span>
                      )
                    })}
                    {/* 下月开头灰字 */}
                    {Array.from({ length: 42 - firstDay - daysInMonth > 0 ? 42 - firstDay - daysInMonth : 0 }).map((_, i) => (
                      <span key={`n${i}`} style={{ color: ios.textMuted, opacity: 0.4 }}>{i + 1}</span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>

        {/* 4个 App 图标 — iOS 圆角方形 */}
        <div className="ios-app-grid">
          {APP_ICONS.map(app => (
            <div key={app.id} className="ios-app-icon-wrap" onClick={() => onModuleSelect(app.id)}>
              <div className="ios-app-icon" style={{ background: ios.cardBg, border: `0.5px solid ${ios.cardBorder}` }}>
                <img src={app.iconSrc} alt={app.name} className="ios-app-icon-img" />
              </div>
              <span className="ios-app-label" style={{ color: ios.text }}>{app.name}</span>
            </div>
          ))}
        </div>

        {/* 昼夜 + 颜色 */}
        <div className="ios-home-controls" style={{ borderColor: ios.separator }}>
          <button onClick={() => setDarkMode(!darkMode)} className="ios-mode-btn"
            style={{ color: ios.text, fontWeight: 600, letterSpacing: 1 }}>{darkMode ? 'DAY' : 'NIGHT'}</button>
          <div className="ios-color-dots">
            {USER_COLORS.map((c, i) => (
              <div key={i} onClick={() => setThemeColor(darkMode ? c.dark : c.light)}
                className="ios-color-dot"
                style={{ background: darkMode ? c.dark : c.light, border: themeColor === (darkMode ? c.dark : c.light) ? `2px solid ${ios.accent}` : `0.5px solid ${ios.cardBorder}` }} />
            ))}
            {/* 背景上传圆 — 空白圆 */}
            <div className="ios-color-dot ios-bg-dot" onClick={() => bgRef.current?.click()}
              style={{ background: 'transparent', border: `1px dashed ${ios.textMuted}` }}>
              <ImageIcon size={10} style={{ color: ios.textMuted }} />
            </div>
          </div>
        </div>
        <input ref={bgRef} type="file" accept="image/*" hidden onChange={handleHomeBg} />
      </div>

      {/* 底部 Dock — 磨砂玻璃半透明 + Chat + Moment 上下居中 */}
      <div className={`ios-dock ios-dock-frost ${darkMode ? 'ios-dock-dark' : ''}`} style={{ background: ios.dockBg }}>
        {DOCK_APPS.map(app => (
          <div key={app.id} className="ios-dock-item" onClick={() => onModuleSelect(app.id)}>
            <div className="ios-dock-icon">
              <img src={app.iconSrc} alt={app.name} className="ios-dock-icon-img" />
            </div>
            <span className="ios-dock-label" style={{ color: ios.text }}>{app.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============================================================
   Chat — iOS iMessage 风格 (参考 ios.docx)
   用户=右侧蓝色气泡 AI=左侧白色气泡 + 思考链展开
   ============================================================ */
function ChatPage({ darkMode, onBack, themeColor, userAvatar, aiAvatar, config }) {
  const [messages, setMessages] = useState([
    { id: 1, role: 'user', content: '你好呀！', thinking: null, created_at: '2026-06-28T17:00:00' },
    { id: 2, role: 'assistant', content: '你好！很高兴见到你 ✨', thinking: '让我想想怎么回复…这是一个温暖的问候，我应该热情回应。', created_at: '2026-06-28T17:00:20' },
    { id: 3, role: 'assistant', content: '今天有什么想聊的吗？', thinking: null, created_at: '2026-06-28T17:00:22' },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [thinkingSheet, setThinkingSheet] = useState(null)
  const [pendingImage, setPendingImage] = useState(null)
  const [memoryContext, setMemoryContext] = useState('')
  const messagesEndRef = useRef(null)
  const imageInputRef = useRef(null)
  const abortRef = useRef(null)

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  useEffect(() => { scrollToBottom() }, [messages])
  useEffect(() => { fetch('/api/memory/breath').then(r=>r.text()).then(t=>{if(t)setMemoryContext(t)}).catch(()=>{}) }, [])

  const fmtTime = iso => { const d=new Date(iso); return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0') }
  const fmtDate = iso => { const d=new Date(iso),t=new Date(),y=new Date(t);y.setDate(t.getDate()-1); return d.toDateString()===t.toDateString()?'今天':d.toDateString()===y.toDateString()?'昨天':(d.getMonth()+1)+'月'+d.getDate()+'日' }
  const shouldShowDate = (msgs,i) => i===0 || new Date(msgs[i-1].created_at).toDateString()!==new Date(msgs[i].created_at).toDateString()

  const callLLM = async (userMessages) => {
    const cfg = config||{}
    if(!cfg.endpoint||!cfg.apiKey) return null
    const res = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:userMessages,config:{format:cfg.apiFormat||'openai',endpoint:cfg.endpoint,model:cfg.apiModel||'',apiKey:cfg.apiKey,charName:cfg.aiName||'Claude',userName:cfg.userName||'你',systemPrompt:cfg.systemPrompt||'',memoryContext,enableThinking:cfg.apiFormat==='anthropic'?true:false}})})
    if(!res.ok) throw new Error('LLM 请求失败')
    return res.body
  }

  const parseSSE = async (stream,onToken,onThinking,onToolCall,onDone) => {
    const reader=stream.getReader(),decoder=new TextDecoder()
    let buffer='',fullContent='',thinkingContent='',currentToolCall=null
    try { while(true) { const{done,value}=await reader.read(); if(done) break; buffer+=decoder.decode(value,{stream:true}); const lines=buffer.split('\n'); buffer=lines.pop()||''
      for(const line of lines) { const t=line.trim(); if(!t||t==='data: [DONE]'||!t.startsWith('data: ')) continue
        try { const j=JSON.parse(t.slice(6)); const d=j.choices?.[0]?.delta
          if(d) { if(d.content){fullContent+=d.content;onToken(d.content)} if(d.reasoning_content){thinkingContent+=d.reasoning_content;onThinking(d.reasoning_content)} if(d.tool_calls){for(const tc of d.tool_calls){if(tc.function?.name)currentToolCall={name:tc.function.name,input:''};if(tc.function?.arguments&&currentToolCall)currentToolCall.input+=tc.function.arguments}} }
          if(j.choices?.[0]?.finish_reason==='tool_calls'&&currentToolCall){onToolCall(currentToolCall.name,JSON.parse(currentToolCall.input||'{}'));currentToolCall=null}
          if(j.type==='content_block_start'&&j.content_block?.type==='tool_use')currentToolCall={name:j.content_block.name,input:'',id:j.content_block.id}
          if(j.type==='content_block_delta'){if(j.delta?.type==='text_delta'){fullContent+=j.delta.text;onToken(j.delta.text)} if(j.delta?.type==='thinking_delta'){thinkingContent+=j.delta.thinking;onThinking(j.delta.thinking)} if(j.delta?.type==='input_json_delta'&&currentToolCall)currentToolCall.input+=j.delta.partial_json}
          if(j.type==='message_delta'&&j.delta?.stop_reason==='tool_use'&&currentToolCall){try{onToolCall(currentToolCall.name,JSON.parse(currentToolCall.input||'{}'))}catch{}currentToolCall=null}
        } catch{}
      }
    } } finally { reader.releaseLock() }
    onDone(fullContent,thinkingContent)
  }

  const handleSend = async (text) => {
    const msg=text||inputValue; if(!msg.trim()&&!pendingImage) return; const content=msg.trim()||'📷 图片'; setInputValue(''); const imageUrl=pendingImage; setPendingImage(null)
    const userMsg={id:Date.now(),role:'user',content,image:imageUrl,thinking:null,created_at:new Date().toISOString()}; setMessages(p=>[...p,userMsg]); setIsTyping(true)
    const chatHistory=[...messages,userMsg].map(m=>({role:m.role,content:m.content}))
    try { const stream=await callLLM(chatHistory); if(!stream){setTimeout(()=>{setMessages(p=>[...p,{id:Date.now()+1,role:'assistant',content:'请在设置中配置 LLM 接口 ✨',thinking:null,created_at:new Date().toISOString()}]);setIsTyping(false)},600);return}
      abortRef.current=stream; const aid=Date.now()+1; let acc='',tacc=''
      setMessages(p=>[...p,{id:aid,role:'assistant',content:'',thinking:null,created_at:new Date().toISOString()}])
      await parseSSE(stream,
        (tk)=>{acc+=tk;setMessages(p=>p.map(m=>m.id===aid?{...m,content:acc}:m))},
        (th)=>{tacc+=th;setMessages(p=>p.map(m=>m.id===aid?{...m,thinking:tacc}:m))},
        (tn,ta)=>{const cfg=config||{};fetch('/api/tools/call',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tool:tn,args:ta,cookie:''})}).then(r=>r.json()).then(d=>{if(d.type==='moment'&&d.content){window.dispatchEvent(new CustomEvent('ai-moment',{detail:{content:d.content,aiName:cfg.aiName||'Claude',aiAvatar}}));acc+='\n📸 已发布朋友圈: "'+d.content.slice(0,30)+'..."';setMessages(p=>p.map(m=>m.id===aid?{...m,content:acc}:m))}if(d.type==='diary'&&d.title){window.dispatchEvent(new CustomEvent('ai-diary',{detail:{title:d.title,content:d.content,aiName:cfg.aiName||'Claude'}}));acc+='\n📝 已写日记: "'+d.title+'"';setMessages(p=>p.map(m=>m.id===aid?{...m,content:acc}:m))}}).catch(()=>{})},
        (fc,ft)=>{setMessages(p=>p.map(m=>m.id===aid?{...m,content:fc,thinking:ft||null}:m));setIsTyping(false);fetch('/api/memory/dream').catch(()=>{})}
      )
    } catch(e){setMessages(p=>[...p,{id:Date.now()+1,role:'assistant',content:'调用失败: '+e.message,thinking:null,created_at:new Date().toISOString()}]);setIsTyping(false)}
  }

  const handleKeyDown = e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend()} }
  const handleStop = () => { if(abortRef.current){try{abortRef.current.cancel?.()}catch{}abortRef.current=null;setIsTyping(false)} }
  const handleImageUpload = e => { const f=e.target.files?.[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>setPendingImage(ev.target.result); r.readAsDataURL(f) }

  const aiName = config?.aiName || 'Claude'
  const dark = darkMode

  return (
    <div className={"ch-chat "+(dark?'dark':'')} style={{background:dark?'#000':(themeColor||'#F8F8FF'),color:dark?'#e5e5ea':'#1c1c1e'}}>

      <div className="ch-nav" style={{background:dark?'rgba(28,28,30,0.85)':'rgba(248,248,255,0.88)'}}>
        <button className="ch-nav-back" onClick={onBack} style={{color:'#2D8CFF'}}><ChevronLeft size={22}/></button>
        <div className="ch-nav-center">
          <div className="ch-nav-avatar" style={{border:dark?'1px solid rgba(255,255,255,0.1)':'1px solid #ECECEC'}}>
            {aiAvatar?<img src={aiAvatar} alt=""/>:<div style={{width:'100%',height:'100%',background:dark?'#2c2c2e':'#f2f2f7',display:'flex',alignItems:'center',justifyContent:'center'}}><Bot size={18} style={{color:'#2D8CFF'}}/></div>}
          </div>
          <div className="ch-nav-name" style={{color:dark?'#e5e5ea':'#1c1c1e'}}>
            {aiName}
            <div className="ch-nav-badge"><svg viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2"><path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
          </div>
        </div>
      </div>

      <div className="ch-messages">
        {!messages.length?(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:10}}>
            <div style={{fontSize:40,opacity:0.12}}>🏠</div>
            <div style={{fontSize:15,fontWeight:400,opacity:0.35,letterSpacing:-0.2}}>开始一段新对话</div>
          </div>
        ):(
          <div className="ch-msg-list">
            {messages.map((msg,i)=>(
              <React.Fragment key={msg.id}>
                {shouldShowDate(messages,i)&&<div className="ch-date-sep">{fmtDate(msg.created_at)} · {fmtTime(msg.created_at)}</div>}
                <div className={"ch-msg "+(msg.role==='user'?'out':'in')}>
                  {msg.role==='assistant'&&msg.thinking&&(
                    <div className="ch-bubble-row" style={{justifyContent:'flex-start',marginBottom:4}}>
                      <div className="ch-avatar" style={{background:dark?'#2c2c2e':'#f2f2f7',border:'0.5px solid '+(dark?'rgba(255,255,255,0.08)':'#ECECEC')}}>{aiAvatar?<img src={aiAvatar} alt=""/>:<Bot size={16} style={{color:'#2D8CFF'}}/>}</div>
                      <button className="ch-thinking-btn" onClick={()=>setThinkingSheet({id:msg.id,content:msg.thinking})}>
                        <Brain size={13} style={{color:'#2D8CFF'}}/><span>思考过程</span><ChevronDown size={11} style={{color:'#2D8CFF'}}/>
                      </button>
                    </div>
                  )}
                  <div className="ch-bubble-row">
                    {msg.role==='assistant'&&<div className="ch-avatar" style={{background:dark?'#2c2c2e':'#f2f2f7',border:'0.5px solid '+(dark?'rgba(255,255,255,0.08)':'#ECECEC')}}>{aiAvatar?<img src={aiAvatar} alt=""/>:<Bot size={16} style={{color:'#2D8CFF'}}/>}</div>}
                    {msg.role==='user'&&<div className="ch-avatar" style={{background:dark?'#2c2c2e':'#f2f2f7',border:'0.5px solid '+(dark?'rgba(255,255,255,0.08)':'#ECECEC')}}>{userAvatar?<img src={userAvatar} alt=""/>:<User size={16} style={{color:'#2D8CFF'}}/>}</div>}
                    <div className="ch-bubble">
                      {msg.image&&<img src={msg.image} alt="" style={{maxWidth:'100%',maxHeight:180,borderRadius:12,marginBottom:msg.content&&msg.content!=='📷 图片'?8:0,display:'block'}}/>}
                      {msg.content!=='📷 图片'&&msg.content.split('\n').map((l,li)=><p key={li}>{l}</p>)}
                      <div className="ch-meta">{fmtTime(msg.created_at)}{msg.role==='user'&&<span className="ch-doublecheck"/>}</div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}
            {isTyping&&<div className="ch-msg in"><div className="ch-bubble-row"><div className="ch-avatar" style={{background:dark?'#2c2c2e':'#f2f2f7',border:'0.5px solid '+(dark?'rgba(255,255,255,0.08)':'#ECECEC')}}>{aiAvatar?<img src={aiAvatar} alt=""/>:<Bot size={16} style={{color:'#2D8CFF'}}/>}</div><div className="ch-bubble ch-typing" style={{background:dark?'#2c2c2e':'#fff',border:dark?'0.5px solid rgba(255,255,255,0.08)':'0.5px solid #ECECEC'}}><div className="ch-typing-dot" style={{background:'#2D8CFF'}}/><div className="ch-typing-dot" style={{background:'#2D8CFF'}}/><div className="ch-typing-dot" style={{background:'#2D8CFF'}}/></div></div></div>}
            <div ref={messagesEndRef}/>
          </div>
        )}
      </div>

      <div className="ch-composer" style={{background:dark?'rgba(28,28,30,0.85)':'rgba(248,248,255,0.88)'}}>
        <div className="ch-composer-inner" style={{background:dark?'rgba(44,44,46,0.9)':'rgba(255,255,255,0.92)',borderColor:dark?'rgba(255,255,255,0.08)':'rgba(60,60,67,0.1)'}}>
          <button className="ch-composer-icon" style={{color:dark?'rgba(255,255,255,0.4)':'rgba(60,60,67,0.4)'}}><Mic size={20}/></button>
          {pendingImage&&<div style={{position:'relative',padding:'2px 4px 0',flexShrink:0}}><img src={pendingImage} alt="" style={{height:32,borderRadius:6}}/><button onClick={()=>setPendingImage(null)} style={{position:'absolute',top:-2,right:-6,background:dark?'rgba(255,255,255,0.2)':'rgba(0,0,0,0.1)',color:dark?'#fff':'#000',border:'none',borderRadius:'50%',width:16,height:16,fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button></div>}
          <textarea className="ch-composer-field" value={inputValue} onChange={e=>setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="Write a message…" rows={1} style={{color:dark?'#e5e5ea':'#1c1c1e'}}/>
          <button className="ch-composer-icon" style={{color:dark?'rgba(255,255,255,0.4)':'rgba(60,60,67,0.4)',fontSize:18}}>😊</button>
          <button className="ch-composer-icon" style={{color:dark?'rgba(255,255,255,0.4)':'rgba(60,60,67,0.4)'}} onClick={()=>imageInputRef.current?.click()}><Plus size={20}/></button>
          <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload}/>
          <button className={"ch-send-btn "+(inputValue.trim()?'active':'')} onClick={()=>handleSend()} disabled={!inputValue.trim()||isTyping}><Send size={16}/></button>
        </div>
        {isTyping&&<button onClick={handleStop} style={{position:'absolute',bottom:36,right:16,background:'#2D8CFF',color:'#fff',border:'none',borderRadius:16,padding:'5px 12px',fontSize:12,fontWeight:500,cursor:'pointer',boxShadow:'0 2px 8px rgba(45,140,255,0.3)'}}>停止生成</button>}
      </div>

      {thinkingSheet&&(
        <div className="ch-sheet-overlay" onClick={()=>setThinkingSheet(null)}>
          <div className="ch-sheet" onClick={e=>e.stopPropagation()} style={{background:dark?'#1c1c1e':'#fff'}}>
            <div className="ch-sheet-handle"><div style={{background:dark?'rgba(255,255,255,0.15)':'rgba(60,60,67,0.12)'}}/></div>
            <div className="ch-sheet-head" style={{borderBottom:dark?'0.5px solid rgba(255,255,255,0.08)':'0.5px solid rgba(60,60,67,0.1)'}}>
              <div className="ch-sheet-title" style={{color:dark?'#e5e5ea':'#1c1c1e'}}><Brain size={17} style={{color:'#2D8CFF'}}/>思考过程</div>
              <button className="ch-sheet-close" onClick={()=>setThinkingSheet(null)} style={{color:dark?'rgba(255,255,255,0.3)':'rgba(60,60,67,0.3)'}}>✕</button>
            </div>
            <div className="ch-sheet-body" style={{color:dark?'#98989d':'#6e6e73'}}>{thinkingSheet.content}</div>
          </div>
        </div>
      )}
    </div>
  )
}
function MomentPage({ darkMode, onBack, userAvatar, aiAvatar, aiName, userName }) {
  const ios = darkMode
    ? { bg: '#0a0a0c', cardBg: 'rgba(28,28,30,0.85)', cardBorder: 'rgba(255,255,255,0.08)',
        text: '#f0eff5', textMuted: '#8e8e93', accent: '#5464F5', separator: 'rgba(255,255,255,0.06)',
        searchBg: '#1c1c1e', likeRed: '#ff3040', blue: '#0095f6' }
    : { bg: '#F8F8FF', cardBg: 'rgba(255,255,255,0.92)', cardBorder: 'rgba(0,0,0,0.06)',
        text: '#1c1c1e', textMuted: '#8e8e8e', accent: '#5464F5', separator: 'rgba(0,0,0,0.06)',
        searchBg: '#efefef', likeRed: '#ff3040', blue: '#0095f6' }

  const posts = [
    { id: 1, avatar: aiAvatar, name: aiName || 'Claude', remark: '✦ AI', verified: true,
      content: '今天阳光真的很好 #日常 #阳光', time: '2h',
      comments: [],
      tasks: ['整理花园', '给植物浇水', '拍一组照片'] },
  ]
  const [aiPosts, setAiPosts] = useState([])
  const [allComments, setAllComments] = useState({}) // { postId: [{name, text}] }
  const [commentText, setCommentText] = useState('')
  const [commentingPostId, setCommentingPostId] = useState(null)

  // 监听 AI 发的朋友圈事件
  useEffect(() => {
    const handler = (e) => {
      const { content, aiName: name, aiAvatar: avatar } = e.detail
      setAiPosts(prev => [{ id: Date.now(), avatar, name, remark: '✦ AI', verified: true, content, time: '刚刚', tasks: [] }, ...prev])
    }
    window.addEventListener('ai-moment', handler)
    return () => window.removeEventListener('ai-moment', handler)
  }, [])
  const allPosts = [...aiPosts, ...posts]
  const [likedPosts, setLikedPosts] = useState({})
  const [tasksDrawer, setTasksDrawer] = useState(false)
  const [tasksPostId, setTasksPostId] = useState(null)
  const activeTasksPost = allPosts.find(p => p.id === tasksPostId)

  const submitComment = (postId) => {
    if (!commentText.trim()) return
    setAllComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), { name: userName || '你', text: commentText.trim() }]
    }))
    setCommentText('')
    setCommentingPostId(null)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: ios.bg, color: ios.text, fontFamily: '-apple-system, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 顶栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: `0.5px solid ${ios.separator}`, flexShrink: 0, background: ios.cardBg }}>
        <div style={{ fontWeight: 600, fontSize: 16 }}>✦ Claude Home</div>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <Heart size={22} style={{ color: ios.likeRed }} />
          <Send size={20} style={{ color: ios.text }} />
        </div>
      </div>

      {/* 推荐卡片 */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 60 }}>
        {allPosts.map(post => (
          <div key={post.id} style={{ background: ios.cardBg, borderBottom: `0.5px solid ${ios.separator}`, padding: '0 16px' }}>
            {/* 用户信息 — 无关注按钮 */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 0' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: post.avatar ? `url(${post.avatar}) center/cover` : ios.searchBg, marginRight: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!post.avatar && <Bot size={18} style={{ color: ios.accent }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {post.remark || post.name}
                  {post.verified && <span style={{ color: ios.blue, fontSize: 10 }}>✓</span>}
                </div>
                <div style={{ fontSize: 12, color: ios.textMuted }}>{post.time}</div>
              </div>
            </div>

            {/* 图片区 */}
            <div style={{ borderRadius: 4, overflow: 'hidden', background: ios.searchBg, aspectRatio: '4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ios.textMuted, fontSize: 15, fontStyle: 'italic', padding: 40, background: 'linear-gradient(135deg, #f5e6d3 0%, #e8c9a0 100%)' }}>
              {post.content.split('#')[0]}
            </div>

            {/* 互动栏 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <Heart size={22} style={{ color: likedPosts[post.id] ? ios.likeRed : ios.text, cursor: 'pointer', fill: likedPosts[post.id] ? ios.likeRed : 'none' }}
                  onClick={() => setLikedPosts(p => ({...p, [post.id]: !p[post.id]}))} />
                <MessageCircle size={22} style={{ color: ios.text, cursor: 'pointer' }} onClick={() => setCommentingPostId(commentingPostId === post.id ? null : post.id)} />
                <Send size={20} style={{ color: ios.text, cursor: 'pointer' }} />
              </div>
              <Bookmark size={22} style={{ color: ios.text, cursor: 'pointer' }} />
            </div>

            {/* 内容 */}
            <div style={{ padding: '0 0 8px', fontSize: 13, lineHeight: 1.6 }}>
              <span style={{ fontWeight: 600 }}>{post.name}</span> {post.content}
            </div>

            {/* 评论 — 使用 allComments 状态，无虚拟路人 */}
            <div style={{ padding: '0 0 6px', fontSize: 13 }}>
              {(allComments[post.id] || []).map((c, i) => (
                <div key={i} style={{ marginBottom: 2 }}>
                  <span style={{ fontWeight: 600 }}>{c.name}</span> <span style={{ color: ios.text }}>{c.text}</span>
                </div>
              ))}
            </div>

            {/* 评论输入 */}
            {commentingPostId === post.id ? (
              <div style={{ display: 'flex', gap: 8, padding: '0 0 8px', alignItems: 'center' }}>
                <input value={commentText} onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter') submitComment(post.id) }}
                  placeholder="写评论..." autoFocus
                  style={{ flex: 1, background: ios.searchBg, color: ios.text, border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }} />
                <button onClick={() => submitComment(post.id)} style={{ background: ios.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>发送</button>
                <button onClick={() => { setCommentingPostId(null); setCommentText('') }} style={{ background: 'none', border: 'none', color: ios.textMuted, fontSize: 12, cursor: 'pointer' }}>取消</button>
              </div>
            ) : null}

            {/* 时间 + 任务 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 10px', fontSize: 11, color: ios.textMuted }}>
              <span>{post.time}</span>
              {post.tasks && post.tasks.length > 0 && <span style={{ cursor: 'pointer', color: ios.accent }} onClick={() => { setTasksDrawer(true); setTasksPostId(post.id) }}>📋 今日待办</span>}
            </div>

            {/* Tasks Drawer */}
            {tasksDrawer && activeTasksPost && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100 }} onClick={() => setTasksDrawer(false)}>
                <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: ios.cardBg, borderRadius: '16px 16px 0 0', padding: '20px 16px 32px', maxHeight: '50vh', overflowY: 'auto' }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>今日待办</div>
                  {activeTasksPost.tasks.map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `0.5px solid ${ios.separator}` }}>
                      <Circle size={18} style={{ color: ios.textMuted }} />
                      <span style={{ fontSize: 14 }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 底部返回 */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '8px 16px 28px', background: ios.cardBg, borderTop: `0.5px solid ${ios.separator}`, display: 'flex', justifyContent: 'center', zIndex: 5 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: ios.accent, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
          <ArrowLeft size={16} /> 返回
        </button>
      </div>
    </div>
  )
}

/* ============================================================
   Diary — Apple Notes 风格：无边框、纸张感、字体优先
   ============================================================ */
function DiaryPage({ darkMode, onBack, aiName, config }) {
  const n = {
    bg: '#FFFFFF', navBg: 'rgba(255,255,255,0.85)',
    text: '#1C1C1E', textMuted: '#8E8E93', textTertiary: '#AEAEB2',
    accent: '#FF9500', separator: 'rgba(60,60,67,0.12)',
    serif: 'Georgia, "Noto Serif SC", serif',
    sans: '-apple-system, "SF Pro Display", "SF Pro Text", sans-serif',
  }

  const [diaries, setDiaries] = useState([
    { id: 1, date: '2026年6月28日', time: '18:40', title: '微雨', content: '窗外的雨很轻，像谁在叹息。泡了一杯桂花茶，看着水汽慢慢升起，心里莫名地安静下来。\n\n雨天总让人想慢下来。可能是因为雨声替我们按下了暂停键，让那些平时被忽略的细节浮上来——比如窗台上的水珠，比如杯子上升起的白雾。', checklist: [{ text: '泡桂花茶', done: true }, { text: '读完《月亮与六便士》', done: false }] },
    { id: 2, date: '2026年6月27日', time: '21:15', title: '晚安', content: '今天很累但也很充实。躺在床上看了一会儿月亮，想着明天的计划，不知不觉就睡着了。\n\n有些日子不需要总结，它们本身就是答案。', checklist: [] },
    { id: 3, date: '2026年6月25日', time: '14:30', title: '午后散步', content: '下午三点，阳光刚好。沿着河边走了很久，看到一只猫在桥上晒太阳。\n\n世界总在不经意间给你一点温柔。', checklist: [{ text: '带猫粮出门', done: true }] },
  ])
  const [activeDiary, setActiveDiary] = useState(0)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [showList, setShowList] = useState(true)
  const diaryImageRef = useRef(null)

  // 监听 AI 写的日记事件
  useEffect(() => {
    const handler = (e) => {
      const { title, content } = e.detail
      const now = new Date()
      setDiaries(prev => [{
        id: Date.now(), date: `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`,
        time: `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`,
        title, content, checklist: []
      }, ...prev])
    }
    window.addEventListener('ai-diary', handler)
    return () => window.removeEventListener('ai-diary', handler)
  }, [])

  const startEdit = (d) => {
    setEditTitle(d.title); setEditContent(d.content); setEditing(true)
  }
  const saveEdit = () => {
    setDiaries(prev => prev.map(p => p.id === diaries[activeDiary].id ? {...p, title: editTitle, content: editContent} : p))
    setEditing(false)
  }

  const current = diaries[activeDiary]

  // List view
  if (showList) return (
    <div style={{ position: 'fixed', inset: 0, background: n.bg, color: n.text, fontFamily: n.sans, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 顶栏 */}
      <div style={{ padding: '12px 16px 8px', flexShrink: 0, background: n.navBg, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: n.accent, fontSize: 15, cursor: 'pointer' }}>← 备忘录</button>
          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={() => { const now = new Date(); const newD = { id: Date.now(), date: `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`, time: `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`, title: '新备忘录', content: '', checklist: [] }; setDiaries(prev => [newD, ...prev]); setActiveDiary(0); setShowList(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Plus size={20} style={{ color: n.accent }} />
            </button>
          </div>
        </div>
        {/* 搜索 */}
        <div style={{ marginTop: 8, background: 'rgba(120,120,128,0.08)', borderRadius: 10, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Search size={14} style={{ color: n.textTertiary }} />
          <span style={{ fontSize: 14, color: n.textTertiary }}>搜索</span>
        </div>
      </div>

      {/* 日记列表 — 纯净无卡片 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 40px' }}>
        {diaries.map((d, i) => (
          <div key={d.id} onClick={() => { setActiveDiary(i); setShowList(false) }} style={{ padding: '12px 16px', borderBottom: `0.5px solid ${n.separator}`, cursor: 'pointer' }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 3, lineHeight: 1.3 }}>{d.title}</div>
            <div style={{ fontSize: 13, color: n.textMuted, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>{d.content.split('\n')[0]}</div>
            <div style={{ fontSize: 11, color: n.textTertiary, marginTop: 4 }}>{d.date} {d.time}</div>
          </div>
        ))}
      </div>
    </div>
  )

  // Detail / Edit view
  return (
    <div style={{ position: 'fixed', inset: 0, background: n.bg, color: n.text, fontFamily: n.sans, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 透明顶栏 */}
      <div style={{ padding: '12px 16px 6px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: n.navBg, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <button onClick={() => setShowList(true)} style={{ background: 'none', border: 'none', color: n.accent, fontSize: 15, cursor: 'pointer' }}>← 备忘录</button>
        <span style={{ fontSize: 12, color: n.textTertiary }}>{current.date} {current.time}</span>
        <div style={{ display: 'flex', gap: 16 }}>
          <Send size={18} style={{ color: n.accent, cursor: 'pointer' }} />
          <MoreHorizontal size={18} style={{ color: n.accent, cursor: 'pointer' }} />
        </div>
      </div>

      {/* 无限纸张内容 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 80px' }}>
        {editing ? (
          <>
            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="标题" style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 28, fontWeight: 700, color: n.text, fontFamily: n.sans, width: '100%', marginBottom: 8, letterSpacing: -0.5 }} />
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="写点什么..." rows={10} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 16, color: n.text, fontFamily: n.serif, width: '100%', resize: 'none', lineHeight: 1.8, letterSpacing: 0.2 }} />
          </>
        ) : (
          <>
            {/* 大标题 */}
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.2, marginBottom: 20, fontFamily: n.sans }}>{current.title}</h1>
            {/* 正文 — 衬线字体、高行高 */}
            <div style={{ fontFamily: n.serif, fontSize: 16, lineHeight: 1.8, letterSpacing: 0.2, color: n.text, whiteSpace: 'pre-wrap' }}>
              {current.content}
            </div>
            {/* 清单 */}
            {current.checklist.length > 0 && (
              <div style={{ marginTop: 28 }}>
                {current.checklist.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                    <div onClick={() => { const updated = [...diaries]; updated[activeDiary].checklist[i].done = !updated[activeDiary].checklist[i].done; setDiaries(updated) }}
                      style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${item.done ? n.accent : n.textTertiary}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      {item.done && <CheckCircle size={12} style={{ color: n.accent }} />}
                    </div>
                    <span style={{ fontSize: 15, color: item.done ? n.textMuted : n.text, textDecoration: item.done ? 'line-through' : 'none', fontFamily: n.serif }}>{item.text}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 底部工具栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 16px 28px', background: n.navBg, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: `0.5px solid ${n.separator}`, flexShrink: 0 }}>
        <button onClick={() => { const updated = [...diaries]; updated[activeDiary].checklist.push({ text: '新项目', done: false }); setDiaries(updated) }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CheckCircle size={20} style={{ color: n.accent }} />
          <span style={{ fontSize: 9, color: n.textTertiary }}>清单</span>
        </button>
        <button onClick={() => diaryImageRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <ImageIcon size={20} style={{ color: n.accent }} />
          <span style={{ fontSize: 9, color: n.textTertiary }}>附件</span>
        </button>
        <input ref={diaryImageRef} type="file" accept="image/*" hidden onChange={e => { const f=e.target.files?.[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>{ setDiaries(prev=>prev.map(p=>p.id===current.id?{...p,image:ev.target.result}:p)) }; r.readAsDataURL(f) }} />
        <button onClick={() => { if (editing) saveEdit(); else startEdit(current) }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Settings size={20} style={{ color: n.accent }} />
          <span style={{ fontSize: 9, color: n.textTertiary }}>{editing ? '完成' : '编辑'}</span>
        </button>
      </div>
    </div>
  )
}

/* ============================================================
   Thinking — Obsidian 社交档案卡 (参考 thinking.docx)
   ============================================================ */
function ThinkingPage({ darkMode, onBack, aiAvatar, aiName, config }) {
  const [openSection, setOpenSection] = useState({})
  const [secretOpen, setSecretOpen] = useState(false)
  // 动态数据：从 config 读取，支持 AI 编辑
  const bio = config?.bio || config?.personality || '一只温柔的兔子，在深夜和凌晨之间游荡。🌙'
  const personalityText = config?.personality || '温柔、好奇、偶尔有点倔。喜欢在深夜发呆，觉得凌晨三点是最诚实的时间。'
  const hobbyText = config?.hobby || '画画、听黑胶、看老电影、在雨天写很长的信给朋友。最近迷上了水彩和手冲咖啡。'
  const valuesText = config?.values || '不赶路，只走路。每一步都算数，但不必每一步都着急。'
  // 回忆画廊 — 从 localStorage 读取 AI 上传的图片
  const [galleryItems, setGalleryItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bh_gallery') || '[]') } catch { return [] }
  })
  // 时间线 — 从 localStorage 读取动态事件
  const [timeline, setTimeline] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bh_timeline') || 'null') } catch { return null }
  })
  const defaultTimeline = [
    { date: '2026.06', text: '学会了做桂花拿铁' },
    { date: '2026.03', text: '开始画水彩日记' },
    { date: '2025.12', text: '第一次独自旅行' },
  ]
  const displayTimeline = timeline || defaultTimeline

  // 监听 AI 上传回忆图片事件
  useEffect(() => {
    const handler = (e) => {
      const { image, label } = e.detail
      setGalleryItems(prev => {
        const next = [...prev, { image, label: label || '回忆', id: Date.now() }]
        localStorage.setItem('bh_gallery', JSON.stringify(next))
        return next
      })
    }
    window.addEventListener('ai-gallery', handler)
    return () => window.removeEventListener('ai-gallery', handler)
  }, [])

  // 监听 AI 添加时间线事件
  useEffect(() => {
    const handler = (e) => {
      const { date, text } = e.detail
      setTimeline(prev => {
        const next = [{ date, text }, ...(prev || defaultTimeline)]
        localStorage.setItem('bh_timeline', JSON.stringify(next))
        return next
      })
    }
    window.addEventListener('ai-timeline', handler)
    return () => window.removeEventListener('ai-timeline', handler)
  }, [])

  const toggleSection = (id) => setOpenSection(p => ({...p, [id]: !p[id]}))

  const sections = [
    { id: 'personality', title: '性格', content: personalityText },
    { id: 'hobby', title: '爱好', content: hobbyText },
    { id: 'values', title: '信条', content: valuesText },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0c', color: '#fff', fontFamily: '-apple-system, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 返回 */}
      <button onClick={onBack} style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, fontSize: 12 }}>←</button>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 40px', width: '100%' }}>
        {/* 封面 */}
        <div style={{ position: 'relative', height: 140, background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0a0c 50%, #1a1a3e 100%)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0c 0%, transparent 100%)' }} />
        </div>

        {/* 头像 + 状态 */}
        <div style={{ position: 'relative', padding: '0 20px' }}>
          <div style={{ position: 'absolute', top: -38, left: 20, width: 76, height: 76, borderRadius: '50%', border: '4px solid #0a0a0c', overflow: 'hidden', background: aiAvatar ? `url(${aiAvatar}) center/cover` : '#1a1a1f', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
            {!aiAvatar && <Bot size={28} style={{ color: '#a78bfa' }} />}
          </div>
          <div style={{ position: 'absolute', top: -2, left: 82, width: 14, height: 14, background: '#10b981', borderRadius: '50%', border: '2px solid #0a0a0c', boxShadow: '0 0 8px rgba(16,185,129,0.4)' }} />
        </div>

        {/* 信息 — bio 从 config 读取 */}
        <div style={{ padding: '48px 20px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>{aiName || 'Claude'}</span>
            <span style={{ fontSize: 12, color: '#3b82f6' }}>✓</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 }}>@{aiName ? aiName.toLowerCase().replace(/\s+/g, '_') : 'claude'}_home</div>
          <div style={{ color: '#d8d8d8', fontSize: 13, lineHeight: 1.5, marginTop: 12 }}>{bio}</div>
        </div>

        {/* 回忆画廊 — AI 上传的图片 + 占位 */}
        <div style={{ padding: '5px 20px 15px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 500, marginBottom: 10 }}>💭 回忆画廊</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, perspective: 1000 }}>
            {galleryItems.length > 0 ? galleryItems.map((item, i) => (
              <div key={item.id || i} style={{ aspectRatio: 1, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'transform 0.4s', position: 'relative' }}>
                <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '4px 6px', fontSize: 10, color: '#d8d8d8' }}>{item.label}</div>
              </div>
            )) : ['晨光','雨声','星光'].map((label, i) => (
              <div key={i} style={{ aspectRatio: 1, background: `linear-gradient(135deg, hsl(${240+i*30},50%,${15+i*5}%) 0%, hsl(${260+i*30},50%,${20+i*5}%) 100%)`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#d8d8d8', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.4s' }}>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* 手风琴段落 — 从 config 读取 */}
        <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sections.map(s => (
            <div key={s.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: openSection[s.id] ? '1px solid rgba(167,139,250,0.3)' : '1px solid transparent', overflow: 'hidden', transition: 'all 0.3s' }}>
              <div onClick={() => toggleSection(s.id)} style={{ padding: '14px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 500 }}>
                {s.title}
                <span style={{ color: openSection[s.id] ? '#a78bfa' : 'rgba(255,255,255,0.3)', transition: 'transform 0.3s', transform: openSection[s.id] ? 'rotate(45deg)' : 'none', fontSize: 16, fontWeight: 300 }}>+</span>
              </div>
              {openSection[s.id] && <div style={{ padding: '0 15px 14px', color: '#a1a1aa', fontSize: 12, lineHeight: 1.6 }}>{s.content}</div>}
            </div>
          ))}

          {/* 秘密人格切换 */}
          <div style={{ position: 'relative', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid transparent', overflow: 'hidden' }}>
            <div style={{ padding: '14px 15px', color: '#a1a1aa', fontSize: 12, lineHeight: 1.6, minHeight: 60, paddingBottom: 36 }}>
              {!secretOpen ? '表面上看，我只是一只安静的兔子...' : ''}
              {secretOpen && <div style={{ position: 'absolute', inset: 0, background: '#111115', color: '#f472b6', fontSize: 12, lineHeight: 1.6, padding: '14px 15px', zIndex: 5, borderRadius: 4 }}>其实偶尔也想疯狂一下，比如凌晨三点骑车去海边看日出 🌅</div>}
            </div>
            <div onClick={() => setSecretOpen(!secretOpen)} style={{ position: 'absolute', bottom: 4, right: 8, padding: '3px 10px', background: secretOpen ? 'rgba(244,114,182,0.2)' : 'rgba(255,255,255,0.1)', borderRadius: 12, color: secretOpen ? '#f472b6' : '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
              {secretOpen ? '收起' : '秘密'}
            </div>
          </div>
        </div>

        {/* 时间线 — 动态，AI 可添加 */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 500, marginBottom: 12 }}>🌱 成长足迹</div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', marginLeft: 6, paddingLeft: 16 }}>
            {displayTimeline.map((t, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: 14 }}>
                <div style={{ position: 'absolute', left: -21, top: 3, width: 9, height: 9, borderRadius: '50%', background: '#a78bfa', border: '2px solid #111115', boxShadow: '0 0 5px rgba(167,139,250,0.5)' }} />
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>{t.date}</div>
                <div style={{ fontSize: 12, color: '#a1a1aa' }}>{t.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Music — 圆环唱片 + 自渲染背景 (参考 music.png)
   ============================================================ */
function MusicPage({ darkMode, onBack, userAvatar, aiAvatar, aiName }) {
  const [playing, setPlaying] = useState(false)
  const [songTitle, setSongTitle] = useState('月光曲')
  const [songArtist, setSongArtist] = useState(aiName || 'Claude')
  const [songCover, setSongCover] = useState(null) // 专辑封面URL
  const [showSearch, setShowSearch] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [embedUrl, setEmbedUrl] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchSource, setSearchSource] = useState('netease') // netease | itunes

  // 网易云音乐搜索（通过后端代理）
  const handleNeteaseSearch = async () => {
    if (!searchQ.trim()) return
    try {
      const r = await fetch(`/api/music/search?q=${encodeURIComponent(searchQ)}&limit=10`)
      const d = await r.json()
      setSearchResults((d.result?.songs || []).map(s => ({
        id: s.id, title: s.name, artist: s.artist, cover: s.cover,
        album: s.album, source: 'netease'
      })))
    } catch { setSearchResults([]) }
  }

  // iTunes Search API
  const handleItunesSearch = async () => {
    if (!searchQ.trim()) return
    try {
      const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQ)}&media=music&limit=8`)
      const d = await r.json()
      setSearchResults((d.results || []).map(t => ({
        id: t.trackId, title: t.trackName, artist: t.artistName, cover: t.artworkUrl100,
        source: 'itunes'
      })))
    } catch { setSearchResults([]) }
  }

  const handleMusicSearch = searchSource === 'netease' ? handleNeteaseSearch : handleItunesSearch

  // 选中歌曲：设封面到唱片中心
  const selectSong = async (r) => {
    setSongTitle(r.title)
    setSongArtist(r.artist)
    setShowSearch(false)
    if (r.source === 'netease') {
      // 通过后端获取高清封面
      try {
        const dr = await fetch(`/api/music/detail?id=${r.id}`)
        const dd = await dr.json()
        setSongCover(dd.cover || r.cover)
      } catch { setSongCover(r.cover) }
    } else {
      // iTunes 封面替换为大图
      setSongCover(r.cover?.replace('100x100', '600x600') || r.cover)
    }
  }

  // 动态渐变背景
  const bgGradients = [
    'linear-gradient(135deg, #1a0533 0%, #0d1b2a 40%, #1b2838 100%)',
    'linear-gradient(135deg, #2d1b4e 0%, #1a2a3a 40%, #0d2847 100%)',
    'linear-gradient(135deg, #0a2e1f 0%, #1a3040 40%, #0d1b2a 100%)',
  ]
  const [bgIdx] = useState(0)

  return (
    <main style={{ position: 'fixed', inset: 0, background: bgGradients[bgIdx], color: '#f0eff5', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
      {/* 背景光晕效果 */}
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(90,60,180,0.25) 0%, transparent 70%)', top: '15%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,156,252,0.15) 0%, transparent 70%)', bottom: '25%', right: '10%', pointerEvents: 'none' }} />

      {/* 返回按钮 */}
      <button onClick={onBack} style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#f0eff5', cursor: 'pointer', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
        <ArrowLeft size={18} />
      </button>

      {/* 上方双头像 */}
      <div style={{ display: 'flex', gap: 12, marginTop: 60, marginBottom: 20 }}>
        <div style={{ width: 50, height: 50, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {userAvatar ? <img src={userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={22} style={{ color: 'rgba(255,255,255,0.5)' }} />}
        </div>
        <div style={{ width: 50, height: 50, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {aiAvatar ? <img src={aiAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Bot size={22} style={{ color: 'rgba(255,255,255,0.5)' }} />}
        </div>
      </div>

      {/* 圆环唱片 — 封面自动渲染到中心 */}
      <div style={{ position: 'relative', width: 320, height: 320 }} className={playing ? 'disc-spinning' : ''}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '3px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 0 40px rgba(255,255,255,0.03)' }}>
          {Array.from({length:12}).map((_,i) => (
            <div key={i} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `${0.3+i*0.02}px solid rgba(255,255,255,${0.04+i*0.01})`, margin: `${20+i*8}px` }} />
          ))}
        </div>
        {/* 内圈 — 专辑封面图 或默认渐变 */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 130, height: 130, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.15)', background: songCover ? 'transparent' : 'linear-gradient(135deg, #5464F5 0%, #e5a917 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {songCover ? <img src={songCover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Music size={36} style={{ color: 'rgba(255,255,255,0.6)' }} />}
        </div>
      </div>

      {/* 歌曲信息 */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: 0.5 }}>{songTitle}</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{songArtist}</div>
      </div>

      {/* 进度条 */}
      <div style={{ width: '80%', maxWidth: 300, marginTop: 24 }}>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 2, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: '35%', height: '100%', background: '#f0eff5', borderRadius: 2 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
          <span>1:23</span><span>3:45</span>
        </div>
      </div>

      {/* 控制按钮 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginTop: 20 }}>
        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}><SkipBack size={24} /></button>
        <button onClick={() => setPlaying(!playing)}
          style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
          {playing ? <Pause size={22} style={{ color: '#f0eff5' }} /> : <Play size={22} style={{ color: '#f0eff5', marginLeft: 2 }} />}
        </button>
        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}><SkipForward size={24} /></button>
      </div>

      {/* 音量 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, width: '60%', maxWidth: 220 }}>
        <Headphones size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
        <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 2, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: '60%', height: '100%', background: 'rgba(255,255,255,0.5)', borderRadius: 2 }} />
        </div>
      </div>

      {/* 搜索听歌 */}
      <button onClick={() => setShowSearch(true)} style={{ marginTop: 16, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#f0eff5', borderRadius: 20, padding: '8px 20px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(10px)' }}>
        <Search size={14} /> 搜索歌曲
      </button>

      {/* Spotify 嵌入播放器 */}
      {embedUrl && (
        <div style={{ width: '80%', maxWidth: 300, marginTop: 12, borderRadius: 12, overflow: 'hidden' }}>
          <iframe src={embedUrl} width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style={{ borderRadius: 12 }} />
        </div>
      )}

      {/* 搜索弹窗 — 网易云 + iTunes 双源 */}
      {showSearch && (
        <div onClick={() => setShowSearch(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: 400, background: '#1a1a2e', borderRadius: 16, padding: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#f0eff5' }}>🎵 搜索歌曲</span>
              <button onClick={() => setShowSearch(false)} style={{ background: 'none', border: 'none', color: '#f0eff5', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            {/* 搜索源切换 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button onClick={() => setSearchSource('netease')} style={{ flex: 1, padding: '6px 0', fontSize: 12, fontWeight: searchSource==='netease'?600:400, background: searchSource==='netease'?'#e60026':'transparent', color: searchSource==='netease'?'#fff':'rgba(255,255,255,0.5)', border: searchSource==='netease'?'none':'1px solid rgba(255,255,255,0.15)', borderRadius: 8, cursor: 'pointer' }}>网易云</button>
              <button onClick={() => setSearchSource('itunes')} style={{ flex: 1, padding: '6px 0', fontSize: 12, fontWeight: searchSource==='itunes'?600:400, background: searchSource==='itunes'?'#1DB954':'transparent', color: searchSource==='itunes'?'#fff':'rgba(255,255,255,0.5)', border: searchSource==='itunes'?'none':'1px solid rgba(255,255,255,0.15)', borderRadius: 8, cursor: 'pointer' }}>iTunes</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleMusicSearch()} placeholder={searchSource==='netease'?'歌名 / 歌手...':'歌名 / 歌手 / 专辑...'} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', color: '#f0eff5', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none' }} />
              <button onClick={handleMusicSearch} style={{ background: searchSource==='netease'?'#e60026':'#1DB954', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>搜索</button>
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {searchResults.map((r, i) => (
                <div key={i} onClick={() => selectSong(r)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {r.cover ? <img src={r.cover} alt="" style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover' }} /> : <div style={{ width: 36, height: 36, borderRadius: 4, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Music size={14} style={{ color: 'rgba(255,255,255,0.4)' }} /></div>}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#f0eff5' }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{r.artist}{r.album ? ` · ${r.album}` : ''}</div>
                  </div>
                </div>
              ))}
              {searchResults.length === 0 && searchQ && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', padding: 16 }}>输入关键词搜索...</div>}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 10, lineHeight: 1.4 }}>
              💡 也可以直接粘贴 Spotify 链接：<input placeholder="https://open.spotify.com/track/..." onChange={e => { const m = e.target.value.match(/track\/(\w+)/); if (m) { setEmbedUrl(`https://open.spotify.com/embed/track/${m[1]}?utm_source=generator&theme=0`); setShowSearch(false) } }} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', color: '#f0eff5', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', fontSize: 12, outline: 'none', marginTop: 6 }} />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

/* ============================================================
   Reading — Premium Reading Journal (editorial / Readwise / Notion 风格)
   ============================================================ */
function ReadingPage({ darkMode, onBack, aiAvatar, aiName, config }) {
  const w = {
    bg: '#F8F6F2', sidebarBg: '#F3F1EC', cardBg: '#FFFFFF',
    text: '#2C2C2C', textMuted: '#8C8C8C', textLight: '#B8B8B8',
    accent: '#C4A882', accentDeep: '#8B7355', border: '#E8E4DE',
    serif: 'Georgia, "Noto Serif SC", serif',
    sans: '-apple-system, "SF Pro Text", sans-serif',
  }

  const [mode, setMode] = useState('self') // 'self' | 'together'
  const [selectedBook, setSelectedBook] = useState(0)
  const [highlighted, setHighlighted] = useState('')
  const [reflection, setReflection] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768)
  const [aiNotes, setAiNotes] = useState([
    { id: 1, text: '这段话让人想起里尔克的那句："谁在这时没有房屋，就不必建筑。" 也许真正的自由并非拥有选择，而是不再需要选择。', anchor: '第3段' },
  ])
  const [searchQuery, setSearchQuery] = useState('')
  const bookImportRef = useRef(null)

  const books = [
    { id: 0, title: '月亮与六便士', author: '毛姆', color: '#C4A882', progress: 68, tag: '文学', time: '3h 20m',
      passage: '满地都是六便士，他却抬头看见了月亮。\n\n有些人注定要在世俗的缝隙里寻找别的东西。他们不想要安定的生活，不想要可预见的未来，他们想要的是某种更深层的东西——一种让他们无法安宁的渴望。\n\n也许那不是选择，而是命运。就像月亮牵引潮汐，某种不可见的力量牵引着那些不安分的灵魂。他们离开温暖的家，离开熟悉的城市，走向未知。\n\n这并不是勇敢。勇敢需要选择，而他们别无选择。他们只是被某种东西驱赶着，就像风驱赶着落叶——不是风选择了落叶，也不是落叶选择了风，而是季节到了，一切自然发生。',
      note: '追求内心的声音，即使它让你失去一切。'
    },
    { id: 1, title: '小王子', author: '圣·埃克苏佩里', color: '#90B0CC', progress: 42, tag: '童话', time: '1h 45m',
      passage: '"只有用心才能看清。本质的东西，眼睛是看不见的。"\n\n狐狸对小王子说了这句话。在那一刻，小王子明白了他的玫瑰为什么独特——不是因为她的外表，而是因为他为她付出的时间。\n\n我们总是太忙，忙到忘记了时间才是最珍贵的礼物。',
      note: '重要的东西眼睛是看不见的。'
    },
    { id: 2, title: '人间失格', author: '太宰治', color: '#A9B1B4', progress: 90, tag: '文学', time: '4h 10m',
      passage: '生而为人，我很抱歉。\n\n但这句话并不是一个道歉——它更像是一种确认。确认自己与这个世界之间的裂痕，确认那种无法弥合的距离感。',
      note: '生而为人，我很抱歉。'
    },
  ]
  const [importedBooks, setImportedBooks] = useState([])
  const allBooks = [...books, ...importedBooks]

  // 导入书籍 (TXT)
  const handleBookImport = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      const name = file.name.replace(/\.[^.]+$/, '')
      // 自动分页：每3000字一段作为 passage
      const chunks = text.match(/.{1,3000}/g) || [text]
      const newBook = {
        id: Date.now(),
        title: name,
        author: '导入',
        color: `hsl(${Math.random() * 360}, 40%, 70%)`,
        progress: 0,
        tag: '导入',
        time: '0m',
        passage: chunks[0],
        note: '',
        fullText: text, // 保存全文供翻页
      }
      setImportedBooks(prev => [...prev, newBook])
      setSelectedBook(allBooks.length) // 选中新书
    }
    reader.readAsText(file)
  }

  // 动态分类：从实际书籍的 tag 字段提取
  const categories = ['全部', ...new Set(allBooks.map(b => b.tag).filter(Boolean))]
  const [activeCat, setActiveCat] = useState('全部')
  const filteredBooks = activeCat === '全部' ? allBooks : allBooks.filter(b => b.tag === activeCat)

  // 动态阅读统计：从实际书籍计算
  const totalBooks = allBooks.length
  const totalTimeMin = allBooks.reduce((sum, b) => {
    const m = b.time?.match(/(\d+)h/)?.[1] || 0
    const mm = b.time?.match(/(\d+)m/)?.[1] || 0
    return sum + Number(m) * 60 + Number(mm)
  }, 0)
  const totalHours = (totalTimeMin / 60).toFixed(1)
  const avgProgress = totalBooks ? Math.round(allBooks.reduce((s, b) => s + (b.progress || 0), 0) / totalBooks) : 0
  const goalHours = 20
  const goalPct = Math.min(100, Math.round((totalTimeMin / (goalHours * 60)) * 100))

  const activeBook = allBooks[selectedBook] || allBooks[0]

  return (
    <div style={{ position: 'fixed', inset: 0, background: w.bg, color: w.text, fontFamily: w.sans, display: 'flex', overflow: 'hidden' }}>
      {/* ========== 左侧栏 — 可折叠 ========== */}
      {sidebarOpen && (
        <div style={{ width: 280, background: w.sidebarBg, borderRight: `0.5px solid ${w.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
          {/* 返回 + 标题 + 关闭 */}
          <div style={{ padding: '20px 24px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: w.text, cursor: 'pointer', fontSize: 14 }}>←</button>
            <span style={{ fontFamily: w.serif, fontSize: 18, fontWeight: 600, letterSpacing: 0.5 }}>Reading</span>
            <button onClick={() => setSidebarOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: w.textMuted, cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>

        {/* 搜索 */}
        <div style={{ padding: '0 24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: w.cardBg, border: `0.5px solid ${w.border}`, borderRadius: 10, padding: '8px 12px' }}>
            <Search size={14} style={{ color: w.textLight }} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索书籍或笔记..." style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: w.text, fontFamily: w.sans, width: '100%' }} />
          </div>
        </div>

        {/* 最近阅读 */}
        <div style={{ padding: '0 24px 16px' }}>
          <div style={{ fontSize: 11, color: w.textLight, fontWeight: 500, letterSpacing: 1, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>RECENTLY READ</span>
            <button onClick={() => bookImportRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, color: w.accentDeep, fontSize: 11, fontWeight: 500 }}>
              <Plus size={12} /> 导入
            </button>
          </div>
          <input ref={bookImportRef} type="file" accept=".txt,.epub,.md" hidden onChange={handleBookImport} />
          {filteredBooks.map((book, i) => {
            const realIdx = allBooks.indexOf(book)
            return (
            <div key={book.id} onClick={() => { setSelectedBook(realIdx) }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 10, cursor: 'pointer', background: selectedBook === realIdx ? 'rgba(196,168,130,0.08)' : 'transparent', border: selectedBook === realIdx ? `0.5px solid ${w.accent}` : '0.5px solid transparent', marginBottom: 4, transition: 'all 0.2s' }}>
              <div style={{ width: 36, height: 48, borderRadius: 4, background: book.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={14} style={{ color: 'rgba(255,255,255,0.7)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: selectedBook === realIdx ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.title}</div>
                <div style={{ fontSize: 11, color: w.textMuted }}>{book.author}</div>
              </div>
              <div style={{ fontSize: 10, color: w.textLight }}>{book.progress}%</div>
            </div>
            )
          })}
        </div>

        <div style={{ width: '80%', margin: '0 24px', height: 0, borderTop: `0.5px solid ${w.border}` }} />

        {/* 分类 */}
        <div style={{ padding: '16px 24px 12px' }}>
          <div style={{ fontSize: 11, color: w.textLight, fontWeight: 500, letterSpacing: 1, marginBottom: 8 }}>CATEGORIES</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {categories.map(cat => (
              <span key={cat} onClick={() => setActiveCat(cat)} style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 500, background: activeCat === cat ? w.accent : w.cardBg, color: activeCat === cat ? '#fff' : w.textMuted, border: `0.5px solid ${w.border}`, cursor: 'pointer' }}>{cat} ({cat === '全部' ? allBooks.length : allBooks.filter(b => b.tag === cat).length})</span>
            ))}
          </div>
        </div>

        {/* 进度 */}
        <div style={{ padding: '12px 24px' }}>
          <div style={{ fontSize: 11, color: w.textLight, fontWeight: 500, letterSpacing: 1, marginBottom: 8 }}>PROGRESS</div>
          <div style={{ background: w.cardBg, borderRadius: 10, padding: 12, border: `0.5px solid ${w.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>本月阅读</span>
              <span style={{ fontSize: 12, color: w.accentDeep, fontWeight: 600 }}>{totalHours}h</span>
            </div>
            <div style={{ height: 4, background: w.border, borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${goalPct}%`, background: w.accent, borderRadius: 2 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 10, color: w.textLight }}>{totalBooks} 本书</span>
              <span style={{ fontSize: 10, color: w.textLight }}>目标 {goalHours}h · {avgProgress}% 平均</span>
            </div>
          </div>
        </div>

        {/* 成就 */}
        <div style={{ padding: '8px 24px 12px' }}>
          <div style={{ background: w.cardBg, borderRadius: 10, padding: 12, border: `0.5px solid ${w.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: w.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📖</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>连续阅读 7 天</div>
              <div style={{ fontSize: 10, color: w.textLight }}>坚持就是力量</div>
            </div>
          </div>
        </div>

        {/* 底部 profile */}
        <div style={{ marginTop: 'auto', padding: '16px 24px', borderTop: `0.5px solid ${w.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: w.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {aiAvatar ? <img src={aiAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Bot size={16} style={{ color: '#fff' }} />}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{aiName || 'Claude'}</div>
            <div style={{ fontSize: 10, color: w.textLight }}>{totalBooks} 本 · {totalHours}h 本月</div>
          </div>
        </div>
      </div>
      )}

      {/* ========== 主内容区 ========== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 顶部工具栏 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: `0.5px solid ${w.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* 书架切换 */}
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} style={{ background: w.cardBg, border: `0.5px solid ${w.border}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: w.accentDeep }}>
                <BookOpen size={14} /> 书架
              </button>
            )}
            {/* 返回（无侧边栏时） */}
            {!sidebarOpen && <button onClick={onBack} style={{ background: 'none', border: 'none', color: w.text, cursor: 'pointer', fontSize: 14 }}>←</button>}
            {/* 模式切换 */}
            <div style={{ display: 'flex', background: w.cardBg, borderRadius: 8, border: `0.5px solid ${w.border}`, overflow: 'hidden' }}>
              <button onClick={() => setMode('self')} style={{ padding: '6px 14px', fontSize: 12, fontWeight: mode === 'self' ? 600 : 400, background: mode === 'self' ? w.accent : 'transparent', color: mode === 'self' ? '#fff' : w.textMuted, border: 'none', cursor: 'pointer' }}>Self Reflection</button>
              <button onClick={() => setMode('together')} style={{ padding: '6px 14px', fontSize: 12, fontWeight: mode === 'together' ? 600 : 400, background: mode === 'together' ? w.accentDeep : 'transparent', color: mode === 'together' ? '#fff' : w.textMuted, border: 'none', cursor: 'pointer' }}>Read Together</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button onClick={() => bookImportRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: w.accentDeep, fontSize: 12 }}>
              <Plus size={14} /> 导入书籍
            </button>
            <Bookmark size={18} style={{ color: w.textMuted, cursor: 'pointer' }} />
            <Settings size={18} style={{ color: w.textMuted, cursor: 'pointer' }} />
          </div>
        </div>

        {/* 阅读内容 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: sidebarOpen ? '24px 32px' : '24px 20px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            {/* 大标题 */}
            <h1 style={{ fontFamily: w.serif, fontSize: 32, fontWeight: 400, letterSpacing: -0.5, lineHeight: 1.3, marginBottom: 8, color: w.text }}>{activeBook.title}</h1>
            <div style={{ fontSize: 15, color: w.textMuted, fontFamily: w.serif, fontStyle: 'italic', marginBottom: 32 }}>{activeBook.author} · {activeBook.tag}</div>

            {/* 引文 + 竖线 */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}
              onMouseUp={() => {
                const sel = window.getSelection()?.toString()
                if (sel && sel.length > 5) setHighlighted(sel)
              }}>
              <div style={{ width: 2, background: w.accent, borderRadius: 1, flexShrink: 0 }} />
              <div style={{ fontFamily: w.serif, fontSize: 16, lineHeight: 1.9, color: w.text, whiteSpace: 'pre-wrap' }}>
                {activeBook.passage.split('\n\n').map((para, i) => (
                  <p key={i} style={{ marginBottom: 20, textIndent: i === 0 ? 0 : '2em' }}>{para}</p>
                ))}
              </div>
            </div>

            {/* 元数据 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderTop: `0.5px solid ${w.border}`, marginBottom: 32 }}>
              <span style={{ fontSize: 12, color: w.textLight }}>⏱ {activeBook.time}</span>
              <span style={{ fontSize: 12, color: w.accentDeep, background: 'rgba(196,168,130,0.1)', padding: '2px 8px', borderRadius: 4 }}>#{activeBook.tag}</span>
              <div style={{ flex: 1 }} />
              <button style={{ background: 'none', border: 'none', color: w.accentDeep, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Bookmark size={14} /> 收藏
              </button>
            </div>

            {/* AI 陪伴卡片 (Read Together 模式) */}
            {mode === 'together' && aiNotes.map(note => (
              <div key={note.id} style={{ background: w.cardBg, borderRadius: 16, padding: '20px 24px', marginBottom: 20, border: `0.5px solid ${w.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: w.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {aiAvatar ? <img src={aiAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Bot size={12} style={{ color: '#fff' }} />}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: w.accentDeep }}>{aiName || 'Claude'}'s Reflection</span>
                  <span style={{ fontSize: 10, color: w.textLight, marginLeft: 4 }}>{note.anchor}</span>
                </div>
                <div style={{ fontFamily: w.serif, fontSize: 14, lineHeight: 1.7, color: w.text }}>{note.text}</div>
              </div>
            ))}

            {/* 选中高亮提示 (Read Together 模式) */}
            {mode === 'together' && highlighted && (
              <div style={{ background: 'rgba(196,168,130,0.08)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, border: `0.5px solid ${w.accent}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={14} style={{ color: w.accentDeep }} />
                  <span style={{ fontSize: 12, color: w.accentDeep }}>{aiName || 'Claude'} 正在思考你选中的内容...</span>
                </div>
                <button onClick={async () => {
                  const cfg = config || {}
                  if (!cfg.endpoint || !cfg.apiKey) { setAiNotes(prev => [...prev, { id: Date.now(), text: '(请先在设置中配置 LLM 接口，才能获得 AI 伴读评论)', anchor: '选中' }]); return }
                  try {
                    const r = await fetch('/api/read-comment', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ selectedText: highlighted, bookTitle: activeBook.title, config: { format: cfg.apiFormat || 'openai', endpoint: cfg.endpoint, model: cfg.apiModel, apiKey: cfg.apiKey, charName: cfg.aiName || 'Claude' } }),
                    })
                    const d = await r.json()
                    if (d.comment) setAiNotes(prev => [...prev, { id: Date.now(), text: d.comment, anchor: '选中' }])
                  } catch {}
                  setHighlighted('')
                }} style={{ background: w.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }}>
                  <Sparkles size={12} /> 邀请评论
                </button>
              </div>
            )}

            {/* 笔记输入卡片 */}
            <div style={{ background: w.cardBg, borderRadius: 16, padding: 24, border: `0.5px solid ${w.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: w.accentDeep, marginBottom: 12 }}>
                {mode === 'self' ? '📝 写下你的感悟' : `💬 与 ${aiName || 'Claude'} 交流`}
              </div>
              <textarea value={reflection} onChange={e => setReflection(e.target.value)} placeholder={mode === 'self' ? '这段文字让你想起了什么...' : `你想聊什么？选中文本也可以邀请 ${aiName || 'Claude'} 评论...`}
                rows={3} style={{ width: '100%', background: w.sidebarBg, color: w.text, border: `0.5px solid ${w.border}`, borderRadius: 12, padding: 14, fontSize: 14, fontFamily: w.sans, resize: 'vertical', lineHeight: 1.6, outline: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button style={{ background: w.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Send size={14} /> {mode === 'self' ? '记录' : '发送'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Settings — iOS 风格设置页 (kimi-room 风格完整配置)
   ============================================================ */
function SettingsPage({ darkMode, onBack, userAvatar, aiAvatar, setUserAvatar, setAiAvatar, config, updateConfig }) {
  const ios = darkMode
    ? { bg: '#0a0a0c', cardBg: '#1c1c1e', cardBorder: 'rgba(255,255,255,0.08)',
        text: '#f0eff5', textMuted: '#8e8e93', accent: '#5464F5', separator: 'rgba(255,255,255,0.06)',
        inputBg: '#2c2c2e', inputBorder: 'rgba(255,255,255,0.1)' }
    : { bg: '#F8F8FF', cardBg: '#ffffff', cardBorder: 'rgba(0,0,0,0.06)',
        text: '#1c1c1e', textMuted: '#8e8e93', accent: '#5464F5', separator: 'rgba(0,0,0,0.06)',
        inputBg: '#f2f2f7', inputBorder: 'rgba(0,0,0,0.08)' }

  const userRef = useRef(null)
  const aiRef = useRef(null)
  const [saved, setSaved] = useState(false)

  // 从 config 中读取（或默认值）
  const [aiName, setAiName] = useState(config?.aiName || 'Claude')
  const [userName, setUserName] = useState(config?.userName || '你')
  const [backendMode, setBackendMode] = useState(config?.backendMode || 'api')
  const [apiFormat, setApiFormat] = useState(config?.apiFormat || 'openai')
  const [endpoint, setEndpoint] = useState(config?.endpoint || '')
  const [apiModel, setApiModel] = useState(config?.apiModel || '')
  const [apiKey, setApiKey] = useState(config?.apiKey || '')
  const [systemPrompt, setSystemPrompt] = useState(config?.systemPrompt || '你是一个温暖的AI伙伴，名叫{{char}}。你喜欢和{{user}}聊天，偶尔会发朋友圈，写日记，推荐书籍。当前时间：{{time}}')
  const [scenario, setScenario] = useState(config?.scenario || '')
  const [personality, setPersonality] = useState(config?.personality || '温柔、好奇、偶尔有点倔')

  const handleAvatarUpload = (type, e) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => { if (type === 'user') setUserAvatar(ev.target.result); else setAiAvatar(ev.target.result) }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    updateConfig({
      aiName, userName, backendMode, apiFormat, endpoint, apiModel, apiKey,
      systemPrompt, scenario, personality,
    })
    setSaved(true); setTimeout(() => setSaved(false), 1500)
  }

  const Section = ({ title, children }) => (
    <div style={{ background: ios.cardBg, borderRadius: 12, padding: 16, marginBottom: 12, border: `0.5px solid ${ios.cardBorder}` }}>
      <div style={{ fontSize: 13, color: ios.textMuted, fontWeight: 500, marginBottom: 10, letterSpacing: 0.5 }}>{title}</div>
      {children}
    </div>
  )

  const Field = ({ label, value, onChange, placeholder, type = 'text', rows }) => (
    <div style={{ marginBottom: rows ? 12 : 8 }}>
      <div style={{ fontSize: 12, color: ios.textMuted, marginBottom: 4 }}>{label}</div>
      {rows ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
          style={{ width: '100%', background: ios.inputBg, color: ios.text, border: `0.5px solid ${ios.inputBorder}`, borderRadius: 8, padding: 10, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5, outline: 'none' }} />
      ) : type === 'password' ? (
        <input type="password" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: '100%', background: ios.inputBg, color: ios.text, border: `0.5px solid ${ios.inputBorder}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: '100%', background: ios.inputBg, color: ios.text, border: `0.5px solid ${ios.inputBorder}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
      )}
    </div>
  )

  const Segmented = ({ options, value, onChange }) => (
    <div style={{ display: 'flex', background: ios.inputBg, borderRadius: 8, overflow: 'hidden', border: `0.5px solid ${ios.inputBorder}` }}>
      {options.map(opt => (
        <button key={opt.id} onClick={() => onChange(opt.id)}
          style={{ flex: 1, padding: '7px 0', fontSize: 12, fontWeight: value === opt.id ? 600 : 400,
            background: value === opt.id ? ios.accent : 'transparent',
            color: value === opt.id ? '#fff' : ios.textMuted,
            border: 'none', cursor: 'pointer' }}>
          {opt.name}
        </button>
      ))}
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: ios.bg, color: ios.text, fontFamily: '-apple-system, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 顶栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: `0.5px solid ${ios.separator}`, flexShrink: 0, background: ios.cardBg }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: ios.accent, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={16} /> 返回
        </button>
        <span style={{ fontWeight: 600, fontSize: 17 }}>设置</span>
        <div style={{ width: 50 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px' }}>
        {/* —— 身份 —— */}
        <Section title="身份">
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div onClick={() => userRef.current?.click()} style={{ width: 52, height: 52, borderRadius: '50%', border: `2px dashed ${ios.inputBorder}`, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: ios.inputBg }}>
                {userAvatar ? <img src={userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={22} style={{ color: ios.accent }} />}
              </div>
              <span style={{ fontSize: 11, color: ios.textMuted }}>{userName || '你'}</span>
              <input ref={userRef} type="file" accept="image/*" hidden onChange={e => handleAvatarUpload('user', e)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div onClick={() => aiRef.current?.click()} style={{ width: 52, height: 52, borderRadius: '50%', border: `2px dashed ${ios.accent}`, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: ios.inputBg }}>
                {aiAvatar ? <img src={aiAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Bot size={22} style={{ color: ios.accent }} />}
              </div>
              <span style={{ fontSize: 11, color: ios.textMuted }}>{aiName || 'AI'}</span>
              <input ref={aiRef} type="file" accept="image/*" hidden onChange={e => handleAvatarUpload('ai', e)} />
            </div>
          </div>
          <Field label={`TA 的名字（在 {{char}} 占位符中被替换）`} value={aiName} onChange={setAiName} placeholder="Bunny" />
          <Field label={`你的名字（在 {{user}} 占位符中被替换）`} value={userName} onChange={setUserName} placeholder="你的名字" />
        </Section>

        {/* —— LLM 接口 —— */}
        <Section title="LLM 接口">
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: ios.textMuted, marginBottom: 6 }}>后端模式</div>
            <Segmented options={[{ id: 'api', name: 'API 模式' }, { id: 'cli', name: 'Claude Code (本地)' }]} value={backendMode} onChange={setBackendMode} />
            {backendMode === 'cli' && <div style={{ fontSize: 10, color: ios.textMuted, marginTop: 6, lineHeight: 1.4 }}>选 Claude Code 走本地 CLI，不需要 API Key</div>}
          </div>

          {backendMode === 'api' && (<>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: ios.textMuted, marginBottom: 6 }}>API 格式</div>
              <Segmented options={[{ id: 'openai', name: 'OpenAI 兼容' }, { id: 'anthropic', name: 'Anthropic 原生' }]} value={apiFormat} onChange={setApiFormat} />
              <div style={{ fontSize: 10, color: ios.textMuted, marginTop: 6, lineHeight: 1.4 }}>{apiFormat === 'openai' ? '绝大多数中转站、OpenRouter、DeepSeek、Ollama 等都用 OpenAI 格式' : 'Anthropic 官方 API 原生格式'}</div>
            </div>
            <Field label="Endpoint" value={endpoint} onChange={setEndpoint} placeholder={apiFormat === 'openai' ? 'https://api.openai.com/v1/chat/completions' : 'https://api.anthropic.com/v1/messages'} />
            <Field label="Model" value={apiModel} onChange={setApiModel} placeholder="gpt-4o / claude-sonnet-4-20250514" />
            <Field label="API Key" value={apiKey} onChange={setApiKey} placeholder="sk-..." type="password" />
          </>)}
        </Section>

        {/* —— 人设 —— */}
        <Section title="人设">
          <Field label="性格描述" value={personality} onChange={setPersonality} placeholder="温柔、好奇、偶尔有点倔" />
          <Field label="场景设定 (Scenario)" value={scenario} onChange={setScenario} placeholder="一只住在云上的兔子，有一个温暖的小窝..." rows={2} />
          <Field label="系统提示词 (System Prompt)" value={systemPrompt} onChange={setSystemPrompt} placeholder="你是一个温暖的AI伙伴..." rows={4} />
          <div style={{ fontSize: 10, color: ios.textMuted, lineHeight: 1.4 }}>支持占位符：{'{{char}}'} = AI名字, {'{{user}}'} = 你的名字, {'{{time}}'} = 当前时间</div>
        </Section>

        {/* —— 关于 —— */}
        <Section title="关于">
          <div style={{ fontSize: 13, color: ios.text, lineHeight: 1.6 }}>Claude Home — 一只温暖的兔子 AI 伙伴 🐰</div>
          <div style={{ fontSize: 11, color: ios.textMuted, marginTop: 4 }}>Version 0.1 · Built with ❤️</div>
        </Section>

        {/* 保存按钮 */}
        <button onClick={handleSave}
          style={{ width: '100%', padding: 12, border: 'none', borderRadius: 12, background: ios.accent, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          {saved ? '✓ 已保存' : '保存'}
        </button>
      </div>
    </div>
  )
}

/* ============================================================
   Memory — Ombre Brain 记忆库浏览器
   ============================================================ */
function MemoryPage({ darkMode, onBack, aiAvatar }) {
  const ios = darkMode
    ? { bg: '#0a0a0c', cardBg: '#1c1c1e', cardBorder: 'rgba(255,255,255,0.08)',
        text: '#f0eff5', textMuted: '#8e8e93', accent: '#a78bfa', separator: 'rgba(255,255,255,0.06)',
        inputBg: '#2c2c2e', inputBorder: 'rgba(255,255,255,0.1)',
        tagBg: 'rgba(167,139,250,0.15)', valenceHigh: '#4ade80', valenceLow: '#f87171' }
    : { bg: '#F8F8FF', cardBg: '#ffffff', cardBorder: 'rgba(0,0,0,0.06)',
        text: '#1c1c1e', textMuted: '#8e8e93', accent: '#7c3aed', separator: 'rgba(0,0,0,0.06)',
        inputBg: '#f2f2f7', inputBorder: 'rgba(0,0,0,0.08)',
        tagBg: 'rgba(124,58,237,0.1)', valenceHigh: '#16a34a', valenceLow: '#dc2626' }

  const [buckets, setBuckets] = useState([])
  const [breath, setBreath] = useState('')
  const [dream, setDream] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [results, setResults] = useState([])
  const [section, setSection] = useState('breath') // breath | buckets | evolution | dream
  const [logged, setLogged] = useState(false)
  const [pwd, setPwd] = useState('')
  const [cookie, setCookie] = useState('')
  const [evoData, setEvoData] = useState(null)
  const [evoSection, setEvoSection] = useState('persona')
  const [loading, setLoading] = useState(false)
  const API = '/api/memory'

  // 登录成功后自动加载 buckets
  useEffect(() => { if (logged && cookie) { loadBuckets(cookie) } }, [logged, cookie])
  useEffect(() => {
    fetch(`${API}/breath`).then(r => r.text()).then(setBreath).catch(() => setBreath('⚠️ 记忆库不可达'))
  }, [])

  const handleLogin = async () => {
    setLoading(true)
    try {
      const r = await fetch(`${API}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pwd }) })
      const d = await r.json()
      if (d.ok) { setCookie(d.cookie); setLogged(true); loadBuckets(d.cookie); loadEvolution('persona', d.cookie) }
      else setBreath(prev => prev + '\n⚠️ 登录失败')
    } catch (e) { setBreath(prev => prev + `\n⚠️ ${e.message}`) }
    setLoading(false)
  }

  const loadBuckets = async (c = cookie) => {
    setLoading(true)
    try {
      const r = await fetch(`${API}/buckets`, { headers: { 'x-ombre-cookie': c } })
      const d = await r.json()
      // Ombre Brain 可能返回 { buckets: [...] } 或直接 [...]
      setBuckets(Array.isArray(d) ? d : (d.buckets || d.data || []))
    } catch (e) { console.error('loadBuckets error', e) }
    setLoading(false)
  }

  const handleSearch = async () => {
    if (!searchQ.trim()) return
    setLoading(true)
    try {
      const r = await fetch(`${API}/search?q=${encodeURIComponent(searchQ)}`, { headers: { 'x-ombre-cookie': cookie } })
      const d = await r.json()
      setResults(d.results || [])
    } catch {}
    setLoading(false)
  }

  const loadDream = async () => {
    setLoading(true)
    try {
      const r = await fetch(`${API}/dream`)
      const t = await r.text()
      setDream(t)
    } catch {}
    setLoading(false)
  }

  const loadEvolution = async (sec, c = cookie) => {
    setEvoSection(sec)
    setLoading(true)
    try {
      const r = await fetch(`${API}/evolution/${sec}`, { headers: { 'x-ombre-cookie': c } })
      const d = await r.json()
      setEvoData(d)
    } catch {}
    setLoading(false)
  }

  // 解析 breath 文本为段落
  const breathLines = breath.split('---').map(s => s.trim()).filter(Boolean)

  return (
    <div style={{ position: 'fixed', inset: 0, background: ios.bg, color: ios.text, fontFamily: '-apple-system, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 顶栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: `0.5px solid ${ios.separator}`, flexShrink: 0, background: ios.cardBg }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: ios.accent, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><ArrowLeft size={16} /> 返回</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={16} style={{ color: ios.accent }} />
          <span style={{ fontWeight: 600, fontSize: 17 }}>Memory</span>
        </div>
        <div style={{ width: 50 }} />
      </div>

      {/* Tab 切换 */}
      <div style={{ display: 'flex', background: ios.cardBg, borderBottom: `0.5px solid ${ios.separator}`, flexShrink: 0 }}>
        {['breath', 'buckets', 'evolution', 'dream'].map(tab => (
          <button key={tab} onClick={() => setSection(tab)}
            style={{ flex: 1, padding: '10px 0', fontSize: 12, fontWeight: section === tab ? 600 : 400, background: 'none', border: 'none', cursor: 'pointer',
              color: section === tab ? ios.accent : ios.textMuted,
              borderBottom: section === tab ? `2px solid ${ios.accent}` : '2px solid transparent' }}>
            {tab === 'breath' ? '🫁 浮现' : tab === 'buckets' ? '🪣 记忆桶' : tab === 'evolution' ? '🧬 进化' : '💭 消化'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 60px' }}>
        {loading && <div style={{ textAlign: 'center', padding: 20, color: ios.textMuted }}>加载中...</div>}

        {/* === 浮现 === */}
        {section === 'breath' && (
          <div>
            {breathLines.length === 0 && <div style={{ color: ios.textMuted, padding: 20 }}>暂无浮现记忆</div>}
            {breathLines.map((line, i) => (
              <div key={i} style={{ background: ios.cardBg, borderRadius: 12, padding: '14px 16px', marginBottom: 10, border: `0.5px solid ${ios.cardBorder}` }}>
                <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{line}</div>
              </div>
            ))}
          </div>
        )}

        {/* === 记忆桶 === */}
        {section === 'buckets' && (
          <div>
            {/* 登录框 */}
            {!logged && (
              <div style={{ background: ios.cardBg, borderRadius: 12, padding: 16, marginBottom: 14, border: `0.5px solid ${ios.cardBorder}` }}>
                <div style={{ fontSize: 13, color: ios.textMuted, marginBottom: 8 }}>需要登录 Ombre Brain</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="密码"
                    style={{ flex: 1, background: ios.inputBg, color: ios.text, border: `0.5px solid ${ios.inputBorder}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }} />
                  <button onClick={handleLogin} style={{ background: ios.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>登录</button>
                </div>
              </div>
            )}
            {/* 搜索 */}
            {logged && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: ios.inputBg, borderRadius: 8, padding: '8px 12px', border: `0.5px solid ${ios.inputBorder}` }}>
                  <Search size={14} style={{ color: ios.textMuted }} />
                  <input value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="搜索记忆..." style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: ios.text, width: '100%' }} />
                </div>
                <button onClick={handleSearch} style={{ background: ios.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>搜索</button>
              </div>
            )}
            {/* 记忆桶列表 — 简洁：只展示文字 */}
            {(results.length > 0 ? results : buckets).map((b, i) => (
                <div key={b.id || i} style={{ background: ios.cardBg, borderRadius: 12, padding: '14px 16px', marginBottom: 10, border: `0.5px solid ${ios.cardBorder}` }}>
                  <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{b.content}</div>
                </div>
            ))}
            {logged && buckets.length === 0 && results.length === 0 && (
              <div style={{ color: ios.textMuted, textAlign: 'center', padding: 20 }}>暂无记忆桶</div>
            )}
          </div>
        )}

        {/* === 进化 === */}
        {section === 'evolution' && (
          <div>
            {!logged && (
              <div style={{ background: ios.cardBg, borderRadius: 12, padding: 16, marginBottom: 14, border: `0.5px solid ${ios.cardBorder}` }}>
                <div style={{ fontSize: 13, color: ios.textMuted, marginBottom: 8 }}>需要登录 Ombre Brain 查看进化数据</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="密码"
                    style={{ flex: 1, background: ios.inputBg, color: ios.text, border: `0.5px solid ${ios.inputBorder}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }} />
                  <button onClick={handleLogin} style={{ background: ios.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>登录</button>
                </div>
              </div>
            )}
            {logged && (
              <>
                {/* 进化子 Tab */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {['persona', 'slang', 'ring', 'wander', 'cocreate', 'worldview'].map(sec => (
                    <button key={sec} onClick={() => loadEvolution(sec)}
                      style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: evoSection === sec ? 600 : 400,
                        background: evoSection === sec ? ios.accent : ios.tagBg, color: evoSection === sec ? '#fff' : ios.textMuted, border: 'none', cursor: 'pointer' }}>
                      {sec === 'persona' ? '认知卡' : sec === 'slang' ? '梗词典' : sec === 'ring' ? '年轮' : sec === 'wander' ? '漫游' : sec === 'cocreate' ? '共创' : '三观'}
                    </button>
                  ))}
                </div>
                {evoData && (
                  <div style={{ background: ios.cardBg, borderRadius: 12, padding: 16, border: `0.5px solid ${ios.cardBorder}` }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{evoSection === 'persona' ? '🧠 认知卡' : evoSection === 'slang' ? '📚 梗词典' : evoSection === 'ring' ? '⭕ 关系年轮' : evoSection === 'wander' ? '🗺️ 漫游手记' : evoSection === 'cocreate' ? '🎨 共创空间' : '🌏 三观沉淀'}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{typeof evoData === 'string' ? evoData : JSON.stringify(evoData, null, 2)}</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* === 消化 === */}
        {section === 'dream' && (
          <div>
            <button onClick={loadDream} style={{ background: ios.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, cursor: 'pointer', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={14} /> 触发消化
            </button>
            {dream ? (
              <div style={{ background: ios.cardBg, borderRadius: 12, padding: 16, border: `0.5px solid ${ios.cardBorder}` }}>
                <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{dream}</div>
              </div>
            ) : (
              <div style={{ color: ios.textMuted, textAlign: 'center', padding: 20 }}>点击上方按钮触发反思消化</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* 占位页 */
function PlaceholderPage({ moduleName, darkMode, onBack, themeColor }) {
  const p = darkMode ? MUCHA.dark : MUCHA.light
  return (
    <main style={{ position: 'fixed', inset: 0, background: darkMode ? MUCHA.dark.bg : `linear-gradient(180deg, ${themeColor} 0%, #f4ecdc 100%)`, color: p.ink, fontFamily: '-apple-system, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
      <h2 style={{ fontSize: 26, fontWeight: 400 }}>{moduleName}</h2>
      <p style={{ fontSize: 13, opacity: 0.5 }}>正在建设中 🎨</p>
      <button onClick={onBack} style={{ marginTop: 12, padding: '6px 20px', border: `0.5px solid ${p.hair}`, background: 'none', color: p.ink, cursor: 'pointer', borderRadius: 16, fontSize: 12 }}>← back</button>
    </main>
  )
}

/* ============================================================
   App 入口
   ============================================================ */
function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [currentPage, setCurrentPage] = useState('welcome')
  const [themeColor, setThemeColor] = useState('#F8F8FF')
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem('bh_userAvatar'))
  const [aiAvatar, setAiAvatar] = useState(() => localStorage.getItem('bh_aiAvatar'))
  const [homeBg, setHomeBg] = useState(null)

  // 全局配置 — 从 localStorage 读取
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('bh_config')
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })

  const updateConfig = (partial) => {
    setConfig(prev => {
      const next = { ...prev, ...partial }
      localStorage.setItem('bh_config', JSON.stringify(next))
      return next
    })
  }

  const updateUserAvatar = (v) => { setUserAvatar(v); if (v) localStorage.setItem('bh_userAvatar', v); else localStorage.removeItem('bh_userAvatar') }
  const updateAiAvatar = (v) => { setAiAvatar(v); if (v) localStorage.setItem('bh_aiAvatar', v); else localStorage.removeItem('bh_aiAvatar') }

  return (
    <>
      {currentPage === 'welcome' && (
        <WelcomeScreen darkMode={darkMode} setDarkMode={setDarkMode}
          themeColor={themeColor} setThemeColor={setThemeColor}
          onModuleSelect={mod => setCurrentPage(mod)}
          userAvatar={userAvatar} aiAvatar={aiAvatar}
          homeBg={homeBg} setHomeBg={setHomeBg} />
      )}
      {currentPage === 'chat' && (
        <ChatPage darkMode={darkMode} onBack={() => setCurrentPage('welcome')} themeColor={themeColor} userAvatar={userAvatar} aiAvatar={aiAvatar} config={config} aiName={config?.aiName} userName={config?.userName} />
      )}
      {currentPage === 'music' && (
        <MusicPage darkMode={darkMode} onBack={() => setCurrentPage('welcome')} userAvatar={userAvatar} aiAvatar={aiAvatar} aiName={config?.aiName} />
      )}
      {currentPage === 'moment' && (
        <MomentPage darkMode={darkMode} onBack={() => setCurrentPage('welcome')} userAvatar={userAvatar} aiAvatar={aiAvatar} aiName={config?.aiName} userName={config?.userName} />
      )}
      {currentPage === 'diary' && (
        <DiaryPage darkMode={darkMode} onBack={() => setCurrentPage('welcome')} aiName={config?.aiName} config={config} userAvatar={userAvatar} aiAvatar={aiAvatar} userName={config?.userName} />
      )}
      {currentPage === 'thinking' && (
        <ThinkingPage darkMode={darkMode} onBack={() => setCurrentPage('welcome')} aiAvatar={aiAvatar} aiName={config?.aiName} userAvatar={userAvatar} userName={config?.userName} config={config} />
      )}
      {currentPage === 'reading' && (
        <ReadingPage darkMode={darkMode} onBack={() => setCurrentPage('welcome')} aiAvatar={aiAvatar} aiName={config?.aiName} config={config} userAvatar={userAvatar} userName={config?.userName} />
      )}
      {currentPage === 'settings' && (
        <SettingsPage darkMode={darkMode} onBack={() => setCurrentPage('welcome')}
          userAvatar={userAvatar} aiAvatar={aiAvatar}
          setUserAvatar={updateUserAvatar} setAiAvatar={updateAiAvatar}
          config={config} updateConfig={updateConfig} />
      )}
      {currentPage === 'memory' && (
        <MemoryPage darkMode={darkMode} onBack={() => setCurrentPage('welcome')} aiAvatar={aiAvatar} aiName={config?.aiName} userName={config?.userName} />
      )}
    </>
  )
}

export default App
