require('dotenv').config()
const { Telegraf } = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) => ctx.reply('Привет! Я - Media-bot. Скинь мне ссылку.'))

bot.on('text', (ctx) => {
    const text = ctx.message.text
    ctx.reply('Ты написал: ' + text)
})

bot.launch()
console.log('Бот запущен')