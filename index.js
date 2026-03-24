require('dotenv').config()
const { Telegraf } = require('telegraf')
const fs = require('fs')

const sessions ={}

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) => ctx.reply('Привет! Я - Media-bot. Скинь мне ссылку.'))

bot.on('text', (ctx) => {
  const text = ctx.message.text
  const userId = ctx.from.id

  if (sessions[userId]) {
    const tags = text === '-' ? [] : text.split(',').map(t => t.trim()).filter(t => t)
    const pendingLink = sessions[userId].url

    delete sessions[userId]

    fs.readFile('links.json', 'utf8', (err, data) => {
        const links = err ? [] :    JSON.parse(data)
        links.push({
            url: pendingLink,
            tags: tags,
            person: '',
            data: new Date().toISOString().slice(0, 10)
           })
           fs.writeFile('links.json', JSON.stringify(links, null, 2), (err) => {
            if (err) {
                ctx.reply('Ошибка при сохранении.')
            } else {
                ctx.reply(`Сохранено. Теги: ${tags.length ? tags.join (', ') : 'нет'}`)
            }
           })
    })
    return

  }

if (text.startsWith('http://') || text.startsWith('https://')) {
    sessions[userId] = { url: text }
    ctx.reply('Ссылка получена. Напиши теги через запятую (или отправь "-" чтобы пропустить):')
    } else {
        ctx.reply('Это не ссылка. Пришли URL.')
    }
})

bot.launch()
console.log('Бот запущен')