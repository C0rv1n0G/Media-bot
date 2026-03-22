require('dotenv').config()
const { Telegraf } = require('telegraf')
const fs = require('fs')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) => ctx.reply('Привет! Я - Media-bot. Скинь мне ссылку.'))

bot.command('list', (ctx) => {
    fs.readFile('links.txt', 'utf8', (err, data) => {
        if (err) {
            ctx.reply('Список пуст.')
        } else {
            ctx.reply(data)
        }
    })
})
bot.on('text', (ctx) => {
    const text = ctx.message.text

    if (text.startsWith('http://') || text.startsWith('https://')){
        fs.appendFile('links.txt', text + '\n', (err) => {
            if (err) {
                ctx.reply('Ошибка при сохранении.')
            } else {
                ctx.reply('Ссылка сохранена.')
            }
        })
        ctx.reply('Вижу ссылку: ' + text)
    } else {
        ctx.reply('Это не ссылка. Пришли URL.')
    }
})

bot.launch()
console.log('Бот запущен')