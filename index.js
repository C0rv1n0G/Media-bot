require('dotenv').config()
const { Telegraf } = require('telegraf')
const fs = require('fs')

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
            ctx.reply('Ничего не найдено по тегу ${query')
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
        delete sessions[userId]
        await ctx.answerCbQuery()

        fs.readFile('links.json', 'utf8', (err, fileData) => {
            const links = err ? [] : JSON.parse(fileData)
            const existing = links.find(l => l.url === url)

            if (existing) {
                const newTags = selectedTags.filter(t => !existing.tags.includes(t))
                existing.tags = [...existing.tags,...newTags]
                existing.date = new Date().toISOString().slice(0, 10)
            } else {
                links.push({
                    url,
                    tags: selectedTags,
                    person: '',
                    date: new Date().toISOString().slice(0, 10)
                })
            }

            fs.writeFile('links.json', JSON.stringify(links, null, 2), (err) => {
                const allTags = existing
                ? existing.tags
                : selectedTags
                ctx.reply(`Сохранено. Теги: ${allTags.length ? allTags.join(', ') : 'нет'}`)
            })
        })
    }
})  

bot.on('text', (ctx) => {
  const text = ctx.message.text
  const userId = ctx.from.id

  if (sessions[userId]) {
    if (sessions[userId]?.waitingForNewTag) {
        sessions[userId].selectedTags.push(text.trim())
        sessions[userId].waitingForNewTag = false
        ctx.reply(`Тег "${text.trim()}" добавлен. Продолжай выбирать или нажми "Готово".`)
        return
    }
    return
}  

if (text.startsWith('http://') || text.startsWith('https://')) {
    sessions[userId] = { url: text, selectedTags: [] }

    fs.readFile('links.json', 'utf8', (err, data) => {
        const links = err ? [] : JSON.parse(data)
        const allTags = [...new Set(links.flatMap(l => l.tags))]

        const tagButtons = allTags.map(t => ({ text: t, callback_data: `tag:${t}`}))
        const controlButtons = [
            { text: '✏️ Новый тег', callback_data: 'new_tag' },
            { text: '✅ Готово', callback_data: 'done' }
        ]
        const keyboard = []
        for (let i=0; i < tagButtons.length; i += 3) {
            keyboard.push(tagButtons.slice(i, i + 3))
        }
        keyboard.push(controlButtons)

        ctx.reply('Выбери теги:', {
            reply_markup: {inline_keyboard: keyboard}
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