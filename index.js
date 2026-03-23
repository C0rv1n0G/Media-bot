require('dotenv').config()
const { Telegraf } = require('telegraf')
const fs = require('fs')
const { text } = require('stream/consumers')

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
bot.on('text', (ctx) => {
    const text = ctx.message.text

    if (text.startsWith('http://') || text.startsWith('https://')) {

        const newLink = {
            url: text,
            tags: [],
            person: '',
            date: new Date().toISOString().slice(0, 10)
        }

        fs.readFile('links.json', 'utf8', (err, data) => {
            const links = err ? [] : JSON.parse(data)
            links.push(newLink)

            fs.writeFile('links.json', JSON.stringify(links, null, 2), (err) =>     {
                if (err) {
                    ctx.reply('Ошибка при сохранении.')
                } else {
                    ctx.reply('Ссылка сохранена.')
                }
            })
        })
        ctx.reply('Вижу ссылку: ' + text)
    } else {
        ctx.reply('Это не ссылка. Пришли URL.')
    }
})

bot.launch()
console.log('Бот запущен')