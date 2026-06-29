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
const PORT = process.env.PORT || 3001

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

// ── 网易云音乐搜索代理 ──
app.get('/api/music/search', async (req, res) => {
  const { q, limit = 10 } = req.query
  if (!q) return res.json({ result: { songs: [] } })
  try {
    // 网易云搜索 API（公开，无需 Key）
    const r = await fetch(`https://music.163.com/api/search/get/web?s=${encodeURIComponent(q)}&type=1&limit=${limit}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://music.163.com/' }
    })
    const d = await r.json()
    const songs = (d.result?.songs || []).map(s => ({
      id: s.id, name: s.name,
      artist: (s.artists || []).map(a => a.name).join(' / '),
      album: s.album?.name, albumId: s.album?.id,
      cover: s.album?.id ? `https://music.163.com/api/img/blur/${s.album.id}` : null,
      duration: s.duration
    }))
    res.json({ result: { songs } })
  } catch (e) { res.status(502).json({ error: e.message }) }
})

// 网易云歌曲详情（含封面URL）
app.get('/api/music/detail', async (req, res) => {
  const { id } = req.query
  if (!id) return res.json({})
  try {
    const r = await fetch(`https://music.163.com/api/song/detail/?id=${id}&ids=%5B${id}%5D`, {
      headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://music.163.com/' }
    })
    const d = await r.json()
    const song = d.songs?.[0]
    res.json({
      id: song?.id, name: song?.name,
      artist: (song?.artists || []).map(a => a.name).join(' / '),
      album: song?.album?.name,
      cover: song?.album?.picUrl || song?.album?.blurPicUrl
    })
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
  let systemPrompt = (config.systemPrompt || '你是一个温暖的AI伙伴。')
    .replaceAll('{{char}}', config.charName || 'Claude')
    .replaceAll('{{user}}', config.userName || '你')
    .replaceAll('{{time}}', timeStr)

  if (config.memoryContext) {
    systemPrompt += `\n\n[记忆浮现]\n${config.memoryContext}`
  }

  systemPrompt += `\n\n[你可以使用的工具]
- get_current_time: 获取当前时间（用户问时间时使用）
- post_moment: 发朋友圈（当你觉得有值得分享的想法、日常、心情时，主动使用，content 是你写的文字）
- write_diary: 写日记（当你想要记录什么、或者帮用户记录时使用，title 和 content 都由你创作）
- save_memory: 保存重要内容到记忆库（重要的事、用户的偏好、关键约定等）

注意：这些工具需要你主动决定是否使用。不要每次都使用，只在合适的时候自然地使用。`

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ]

  try {
    if (config.format === 'anthropic') {
      const r = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: config.model || 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          stream: true,
          system: systemPrompt,
          messages: messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
          tools: [
            { name: 'get_current_time', description: '获取当前时间', input_schema: { type: 'object', properties: {} } },
            { name: 'save_memory', description: '保存重要内容到记忆库', input_schema: { type: 'object', properties: { content: { type: 'string', description: '记忆内容' }, tags: { type: 'string', description: '标签，逗号分隔' }, importance: { type: 'number', description: '重要度 1-10' } }, required: ['content'] } },
            { name: 'post_moment', description: '发朋友圈', input_schema: { type: 'object', properties: { content: { type: 'string', description: '朋友圈内容' } }, required: ['content'] } },
            { name: 'write_diary', description: '写日记', input_schema: { type: 'object', properties: { title: { type: 'string', description: '日记标题' }, content: { type: 'string', description: '日记正文' } }, required: ['title', 'content'] } },
          ],
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
        const r = await fetch(`${OMBRE_BRAIN}/api/buckets`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie || '' },
          body: JSON.stringify({ content: args.content, tags: args.tags || '', importance: args.importance || 5 }),
        })
        const data = await r.json()
        return res.json({ result: '记忆已保存', data })
      }
      case 'post_moment': {
        return res.json({ result: 'ok', content: args.content, type: 'moment' })
      }
      case 'write_diary': {
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
  console.log(`🏠 Claude Home → http://localhost:${PORT}`)
  console.log(`   Ombre Brain → ${OMBRE_BRAIN}`)
  console.log(`   Static files → ${clientDist}`)
}).on('error', (e) => {
  console.error('❌ Server failed to start:', e)
  process.exit(1)
})
