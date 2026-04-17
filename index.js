require('dotenv').config()
const { Telegraf } = require('telegraf')
const fs = require('fs')
const { parseUrl, transformUrl } = require('./utils')

const sessions ={}

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) => ctx.reply('Привет! Я - Media-bot. Скинь мне ссылку.'))

bot.command('list', (ctx) => {
    fs.readFile('links.json', 'utf8', (err, data) => {
        if (err) {
            ctx.reply('Список пуст.')
        } else {
            const links = JSON.parse(data)
            const text = links.map((l, i) => `${i+1}. ${l.url}`).join('\n')
            ctx.reply(text)
        }
    })
})

bot.command('find', (ctx) => {
    const query = ctx.message.text.replace('/find', '').trim().toLowerCase()

    if(!query) {
        ctx.reply('Напиши тег после команды. Например: /find арт.')
        return
    }

    fs.readFile('links.json','utf8', (err, data) => {
        if (err) {
            ctx.reply('Список пуст.')
            return
        }

        const links = JSON.parse(data)
        const found = links.filter(l => l.tags.some(t => t.toLowerCase() === query))

        if (found.length === 0) {
            ctx.reply(`Ничего не найдено по тегу ${query}`)
        } else {
            const text = found.map((l, i) => `${i+1}. ${l.url}`).join('\n')
            ctx.reply(text)
        }
    })
})

bot.on('callback_query', async (ctx) => {
    const userId =ctx.from.id
    const data = ctx.callbackQuery.data

    if (!sessions[userId]) {
        await ctx.answerCbQuery('Сессия истекла. Пришли ссылку заново.')
        return
    }

    if (data.startsWith('tag:')) {
        const tag = data.replace('tag:', '')
        if (!sessions[userId].selectedTags.includes(tag)) {
            sessions[userId].selectedTags.push(tag) 
        }
        await ctx.answerCbQuery(`✓ ${tag}`)

    } else if (data === 'new_tag') {
        sessions[userId].waitingForNewTag = true
        await ctx.answerCbQuery()
        await ctx.reply('Напиши новый тег:')

    } else if (data === 'done') {
        const { url, selectedTags } = sessions[userId]
        await ctx.answerCbQuery()

        sessions[userId] = {
            url,
            selectedTags,
            waitingForPerson: true
        }

        await ctx.reply('Укажи автора или источник (или отправь "-" чтобы пропустить):')
        return
    }
})  

bot.on('text', (ctx) => {
  const text = ctx.message.text
  const userId = ctx.from.id

  if (sessions[userId]) {
    if (sessions[userId]?.waitingForPerson) {
        const person = text.trim() === '-' ? '' : text.trim()
        const { url, selectedTags } = sessions[userId]
        delete sessions[userId]

        fs.readFile('links.json', 'utf8', (err, data) => {
            const links = err ? [] : JSON.parse(data)
            const existing = links.find(l=> l.url === url)

            if (existing) {
                const newTags = selectedTags.filter(t => !existing.tags.includes(t))
                existing.tags = [...existing.tags, ...newTags]
                existing.person = person || existing.person
                existing.date = new Date().toISOString().slice(0, 10) 
            } else {
                links.push({
                    url,
                    tags: selectedTags,
                    person,
                    date: new Date().toISOString().slice(0, 10)
                })
            }

            fs.writeFile('links.json', JSON.stringify(links, null, 2), (err) => {
                const saved = existing || { tags: selectedTags, person }
                const tagsStr = saved.tags.length ? saved.tags.join(', ') : 'нет'
                const personStr = saved.person || 'не указан'
                ctx.reply(`Сохранено. \nТеги: ${tagsStr}\nАвтор: ${personStr}`)
            })
        })
        return
    }
    if (sessions[userId]?.waitingForNewTag) {
        text.split(',').map(t => t.trim()).filter(t => t)
            .forEach(t => {if (!sessions[userId].selectedTags.includes(t)) sessions[userId].selectedTags.push(t) })
        sessions[userId].waitingForNewTag = false
        ctx.reply(`Тег "${text.trim()}" добавлен. Продолжай выбирать или нажми "Готово".`)
        return
    }
    return
}  

if (text.startsWith('https://') || text.startsWith('http://')) {
    const transformed = transformUrl(text)
    const { platform, author, tags } =parseUrl(text)

    fs.readFile('links.json', 'utf8', (err, data) => {
        const links = err ? [] : JSON.parse(data)
        const existing = links.find(l => l.url === text)

        if (existing) {
            const newTags = tags.filter(t => !existing.tags.includes(t))
            existing.tags =[...existing.tags, ...newTags]
            existing.date = new Date().toISOString().slice(0,10)
        } else {
            links.push({
                url: text,
                tags,
                person: author,
                date: new Date().toISOString().slice(0, 10)
            })
        }

    fs.writeFile('links.json', JSON.stringify(links, null, 2), () => {
        const saved = existing || { tags, person: author }
        const tagsStr = saved.tags.length ? saved.tags.join(', ') : 'нет'

        sessions[userId] = { url: text, selectedTags: [...tags], waitingForNewTag: true }

        ctx.reply(`Сохранено.\nПлатформа: ${platform || 'неизвестна'}\nАвтор: ${author || 'не определен'}\nТеги: ${tagsStr}\n\Добавь свои теги через запятую, или пришли следующую ссылку:`)
    })
})    
} else {
    ctx.reply('Это не ссылка. Пришли URL.')
}
})

bot.telegram.setMyCommands([
    { command: 'start', description: 'Запустить бота' },
    { command: 'list', description: 'Показать все ссылки' },
    { command: 'find', description: 'Найти по тегу: /find арт' },
])

bot.launch()
console.log('Бот запущен')