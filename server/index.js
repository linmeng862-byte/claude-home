import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// ============ 配置 ============
const OMBRE_BRAIN = process.env.OMBRE_BRAIN_URL || 'https://ye-ombre-brain.zeabur.app'
const PORT = parseInt(process.env.WEB_PORT, 10) || parseInt(process.env.PORT, 10) || 3001

// ============ 静态文件 — 生产环境 serve 前端 ============
const clientDist = join(__dirname, '..', 'client', 'dist')
app.use(express.static(clientDist))

// ============ Ombre Brain 代理 ============
const ombreProxy = async (path, options = {}) => {
  const res = await fetch(`${OMBRE_BRAIN}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('json')) return res.json()
  return res.text()
}

// --- 不需认证 ---
app.get('/api/memory/breath', async (_req, res) => {
  try { const data = await ombreProxy('/breath-hook'); res.type('text/plain').send(data) }
  catch (e) { res.status(502).json({ error: 'Ombre Brain 不可达', detail: e.message }) }
})

app.get('/api/memory/dream', async (_req, res) => {
  try { const data = await ombreProxy('/dream-hook'); res.type('text/plain').send(data) }
  catch (e) { res.status(502).json({ error: 'Ombre Brain 不可达', detail: e.message }) }
})

app.get('/api/memory/health', async (_req, res) => {
  try { const data = await ombreProxy('/health'); res.json(data) }
  catch (e) { res.status(502).json({ error: 'Ombre Brain 不可达', detail: e.message }) }
})

// --- 需认证 ---
const authedProxy = async (path, req, options = {}) => {
  const cookie = req.headers['x-ombre-cookie'] || ''
  return ombreProxy(path, { ...options, headers: { Cookie: cookie, ...options.headers } })
}

app.post('/api/memory/login', async (req, res) => {
  try {
    const { password } = req.body
    const r = await fetch(`${OMBRE_BRAIN}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const setCookie = r.headers.get('set-cookie') || ''
    const match = setCookie.match(/ombre_session=([^;]+)/)
    if (match) res.json({ ok: true, cookie: `ombre_session=${match[1]}` })
    else res.status(401).json({ ok: false, error: '登录失败' })
  } catch (e) { res.status(502).json({ error: e.message }) }
})

app.get('/api/memory/buckets', async (req, res) => {
  try { const data = await authedProxy(`/api/buckets${req._parsedUrl?.search || ''}`, req); res.json(data) }
  catch (e) { res.status(502).json({ error: e.message }) }
})

app.post('/api/memory/buckets', async (req, res) => {
  try { const data = await authedProxy('/api/buckets', req, { method: 'POST', body: JSON.stringify(req.body) }); res.json(data) }
  catch (e) { res.status(502).json({ error: e.message }) }
})

app.put('/api/memory/buckets/:id', async (req, res) => {
  try { const data = await authedProxy(`/api/buckets/${req.params.id}`, req, { method: 'PUT', body: JSON.stringify(req.body) }); res.json(data) }
  catch (e) { res.status(502).json({ error: e.message }) }
})

app.delete('/api/memory/buckets/:id', async (req, res) => {
  try { const data = await authedProxy(`/api/buckets/${req.params.id}`, req, { method: 'DELETE' }); res.json(data) }
  catch (e) { res.status(502).json({ error: e.message }) }
})

app.get('/api/memory/search', async (req, res) => {
  try { const data = await authedProxy(`/api/search${req._parsedUrl?.search || ''}`, req); res.json(data) }
  catch (e) { res.status(502).json({ error: e.message }) }
})

app.get('/api/memory/evolution/:section', async (req, res) => {
  try { const data = await authedProxy(`/api/evolution/${req.params.section}${req._parsedUrl?.search || ''}`, req); res.json(data) }
  catch (e) { res.status(502).json({ error: e.message }) }
})

// ── 网易云音乐搜索代理（搜索 + 播放URL + 封面全链路可用）──
const NETEASE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Referer: 'https://music.163.com/',
  Cookie: 'MUSIC_U=;',
}

app.get('/api/netease/search', async (req, res) => {
  const { q, limit = 12 } = req.query
  if (!q) return res.json({ result: { songs: [] } })
  try {
    const r = await fetch(`https://music.163.com/api/search/get/web?s=${encodeURIComponent(q)}&type=1&limit=${limit}&offset=0`, { headers: NETEASE_HEADERS })
    const d = await r.json()
    const songs = (d.result?.songs || []).map(s => ({
      id: s.id, name: s.name,
      artists: (s.artists || []).map(a => a.name).join(' / '),
      album: s.album?.name, albumId: s.album?.id,
      cover: s.album?.blurPicUrl || s.album?.picUrl || `https://p1.music.126.net/${s.album?.picStr || ''}/${s.album?.id}.jpg`,
      duration: s.duration ? Math.round(s.duration / 1000) : 0,
    }))
    res.json({ result: { songs } })
  } catch (e) { res.json({ result: { songs: [] }, error: e.message }) }
})

app.get('/api/netease/url', async (req, res) => {
  const { id } = req.query
  if (!id) return res.json({ url: null })
  try {
    const r = await fetch(`https://music.163.com/api/song/enhance/player/url?id=${id}&ids=%5B${id}%5D&br=320000`, { headers: NETEASE_HEADERS })
    const d = await r.json()
    const url = d.data?.[0]?.url || null
    res.json({ id, url })
  } catch (e) { res.json({ id, url: null, error: e.message }) }
})

app.get('/api/netease/detail', async (req, res) => {
  const { id } = req.query
  if (!id) return res.json({})
  try {
    const r = await fetch(`https://music.163.com/api/song/detail?id=${id}&ids=%5B${id}%5D`, { headers: NETEASE_HEADERS })
    const d = await r.json()
    const s = d.songs?.[0]
    res.json({
      id, name: s?.name, artist: (s?.artists || []).map(a => a.name).join(' / '),
      album: s?.album?.name, cover: s?.album?.blurPicUrl || s?.album?.picUrl,
    })
  } catch (e) { res.json({ id, error: e.message }) }
})

// ── 专辑封面主色提取（后端用 sharp 绕过 CORS）──
app.get('/api/music/color', async (req, res) => {
  const { url } = req.query
  if (!url) return res.json({ color: null })
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } })
    if (!r.ok) return res.json({ color: null })
    const buf = Buffer.from(await r.arrayBuffer())
    const sharp = (await import('sharp')).default
    // 缩小到 1x1 取主色
    const { data } = await sharp(buf).resize(1, 1).raw().toBuffer({ resolveWithObject: true })
    const color = `rgb(${data[0]},${data[1]},${data[2]})`
    res.json({ color })
  } catch (e) { res.json({ color: null }) }
})

// Spotify 搜索代理（需要 Client Credentials）
app.get('/api/spotify/search', async (req, res) => {
  const { q, limit = 8 } = req.query
  if (!q) return res.json({ tracks: { items: [] } })
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    // 没有 Spotify 凭证时，使用公开搜索回退
    try {
      const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=${limit}`)
      const d = await r.json()
      const tracks = (d.results || []).map(t => ({
        id: `spotify-fallback-${t.trackId}`, name: t.trackName,
        artists: [{ name: t.artistName }],
        album: { name: t.collectionName, images: [{ url: t.artworkUrl100?.replace('100x100', '640x640') }] }
      }))
      return res.json({ tracks: { items: tracks } })
    } catch (e) { return res.status(502).json({ error: e.message }) }
  }
  try {
    // 获取 Spotify Access Token
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
    })
    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token
    if (!accessToken) return res.status(401).json({ error: 'Spotify auth failed' })
    // 搜索
    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=${limit}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    const searchData = await searchRes.json()
    res.json(searchData)
  } catch (e) { res.status(502).json({ error: e.message }) }
})


// ============ LLM Chat ============
app.post('/api/chat', async (req, res) => {
  const { messages, config } = req.body
  if (!config?.endpoint || !config?.apiKey) {
    return res.status(400).json({ error: '缺少 API 配置（endpoint / apiKey）' })
  }

  const now = new Date()
  const timeStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')} ${now.toLocaleDateString('zh-CN', { weekday: 'long' })}`
  let systemPrompt = (config.systemPrompt || '')
    .replaceAll('{{char}}', config.charName || 'Claude')
    .replaceAll('{{user}}', config.userName || '你')
    .replaceAll('{{time}}', timeStr)
  // 只有用户没填任何 systemPrompt 时才给最基础的身份提示
  if (!systemPrompt && config.charName) systemPrompt = `你叫${config.charName}。`

  if (config.personality) systemPrompt += `\n\n[性格] ${config.personality}`
  if (config.scenario) systemPrompt += `\n\n[场景] ${config.scenario}`

  if (config.memoryContext) {
    systemPrompt += `\n\n[记忆浮现]\n${config.memoryContext}`
  }

  systemPrompt += `\n\n[你可以使用的工具]
- get_current_time: 获取当前时间（用户问时间时使用）
- post_echo: 发布回响（当你觉得有值得分享的想法、日常、心情时，主动使用，content 是你写的文字）
- write_diary: 写日记（当你想要记录什么、或者帮用户记录时使用，title 和 content 都由你创作）
- save_memory: 保存重要内容到记忆库（重要的事、用户的偏好、关键约定等）

注意：这些工具需要你主动决定是否使用。不要每次都使用，只在合适的时候自然地使用。`

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ]

  try {
    if (config.format === 'anthropic') {
      // Anthropic: extended thinking 和 tools 互斥，优先 thinking
      const enableThinking = config.enableThinking !== false
      const reqBody = {
        model: config.model || 'claude-sonnet-4-20250514',
        max_tokens: 16000,
        stream: true,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      }
      if (enableThinking) {
        reqBody.thinking = { type: 'enabled', budget_tokens: 10000 }
      } else {
        reqBody.tools = [
          { name: 'get_current_time', description: '获取当前时间', input_schema: { type: 'object', properties: {} } },
          { name: 'save_memory', description: '保存重要内容到记忆库', input_schema: { type: 'object', properties: { content: { type: 'string', description: '记忆内容' }, tags: { type: 'string', description: '标签，逗号分隔' }, importance: { type: 'number', description: '重要度 1-10' } }, required: ['content'] } },
          { name: 'post_echo', description: '发布回响', input_schema: { type: 'object', properties: { content: { type: 'string', description: '回响内容' } }, required: ['content'] } },
          { name: 'write_diary', description: '写日记', input_schema: { type: 'object', properties: { title: { type: 'string', description: '日记标题' }, content: { type: 'string', description: '日记正文' } }, required: ['title', 'content'] } },
        ]
      }
      const r = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(reqBody),
      })
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      const reader = r.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(decoder.decode(value, { stream: true }))
      }
      res.end()
    } else {
      const r = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o',
          messages: fullMessages,
          stream: true,
          max_tokens: 4096,
        }),
      })
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      const reader = r.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(decoder.decode(value, { stream: true }))
      }
      res.end()
    }
  } catch (e) {
    res.status(502).json({ error: 'LLM 调用失败', detail: e.message })
  }
})


// ============ AI 伴读 ============
app.post('/api/read-comment', async (req, res) => {
  const { selectedText, bookTitle, config } = req.body
  if (!config?.endpoint || !config?.apiKey) return res.status(400).json({ error: '缺少 API 配置' })

  const prompt = `你是${config.charName || 'Claude'}，一个有文学素养的阅读伙伴。用户正在读《${bookTitle}》，选中了以下文本：\n\n"${selectedText}"\n\n请用 2-3 句话给出你的文学评论或感悟。不要重复文本，直接给出你的见解。`

  try {
    const r = await fetch(config.endpoint, {
      method: 'POST',
      headers: config.format === 'anthropic'
        ? { 'Content-Type': 'application/json', 'x-api-key': config.apiKey, 'anthropic-version': '2023-06-01' }
        : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
      body: JSON.stringify(config.format === 'anthropic'
        ? { model: config.model || 'claude-sonnet-4-20250514', max_tokens: 300, messages: [{ role: 'user', content: prompt }] }
        : { model: config.model || 'gpt-4o', max_tokens: 300, messages: [{ role: 'system', content: prompt }, { role: 'user', content: selectedText }] }
      ),
    })
    const data = await r.json()
    const comment = config.format === 'anthropic'
      ? data.content?.[0]?.text || data.completion || ''
      : data.choices?.[0]?.message?.content || ''
    res.json({ comment })
  } catch (e) { res.status(502).json({ error: e.message }) }
})


// ============ Experience Layer — Translator ============
// Eidos 只负责产生 Experience。Ombre Brain 负责理解 Experience。
// 这一层的职责只有一个：把五个空间的事件翻译成统一的 Experience，交给 Brain。
// 不保存长期状态。不做裁决。不触发 Dream。不替代 Brain 的任何能力。

app.post('/api/experience', async (req, res) => {
  const { type, content, source } = req.body
  const cookie = req.headers['x-ombre-cookie'] || ''
  if (!type || !content || !cookie) return res.json({ received: false })

  // Translator: 统一格式 → 交给 Brain Bucket
  // Brain 自己决定：是否形成 Bucket、是否触发 Feel、是否参与 Dream、是否留下 Echo
  try {
    await fetch(`${OMBRE_BRAIN}/api/buckets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        content: `[${type}] ${content}`,
        tags: type,
        importance: 5,  // 统一默认，Brain 会自行调整
      }),
    })
  } catch {}

  res.json({ received: true })
})


// ============ AI Tool 执行 ============
app.post('/api/tools/call', async (req, res) => {
  const { tool, args, cookie } = req.body
  try {
    switch (tool) {
      case 'get_current_time': {
        const now = new Date()
        return res.json({ result: `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')} ${now.toLocaleDateString('zh-CN', { weekday: 'long' })}` })
      }
      case 'save_memory': {
        // AI 主动保存 — 直写 Brain Bucket（这是 AI 的明确判断，不是隐式事件）
        if (cookie) {
          try {
            const r = await fetch(`${OMBRE_BRAIN}/api/buckets`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
              body: JSON.stringify({ content: args.content, tags: args.tags || '', importance: args.importance || 5 }),
            })
            const data = await r.json()
            return res.json({ result: '记忆已保存', data })
          } catch { return res.json({ result: '记忆保存失败' }) }
        }
        return res.json({ result: '未连接 Brain' })
      }
      case 'post_echo': {
        // Echo → Experience → Brain
        if (cookie) fetch(`${OMBRE_BRAIN}/api/buckets`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ content: `[echo] ${args.content}`, tags: 'echo', importance: 5 }) }).catch(() => {})
        return res.json({ result: 'ok', content: args.content, type: 'echo' })
      }
      case 'write_diary': {
        // Diary → Experience → Brain
        if (cookie) fetch(`${OMBRE_BRAIN}/api/buckets`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ content: `[diary] ${args.title}: ${args.content}`, tags: 'diary', importance: 5 }) }).catch(() => {})
        return res.json({ result: 'ok', title: args.title, content: args.content, type: 'diary' })
      }
      default:
        return res.json({ result: `未知工具: ${tool}` })
    }
  } catch (e) { res.status(500).json({ error: e.message }) }
})


// ============ SPA 回退 — 所有非 API 路由返回 index.html ============
app.get('*', (_req, res) => {
  res.sendFile(join(clientDist, 'index.html'))
})


// ============ 启动 ============
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏠 Eidos → http://localhost:${PORT}`)
  console.log(`   Ombre Brain → ${OMBRE_BRAIN}`)
  console.log(`   Static files → ${clientDist}`)
}).on('error', (e) => {
  console.error('❌ Server failed to start:', e)
  process.exit(1)
})
