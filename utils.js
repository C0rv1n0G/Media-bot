const axios = require('axios')
const cheerio = require ('cheerio')

async function fetchMeta(url) {
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 5000
        })
        const $ = cheerio.load(data)
        const title = $('meta[property="og:title"]').attr('content') || $('title').text()
        const description = $('meta[property="og:description"]').attr('content') || ''
        const image = $('meta[property="og:image"]').attr('content') || ''
        return { title, description, image }
    } catch {
        return { title: '', description: '', image: '' }
    }
}

function parseUrl(url) {
    try {
        const u = new URL(url)
        const hostname = u.hostname.replace('www.', '')
        const parts = u.pathname.split('/').filter(p => p)

        let platform = ''
        let author = ''
        let tags = []

        if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
            platform = 'twitter'
            if (parts[0]) author = parts[0]
        } else if (hostname.includes('instagram.com')) {
            platform = 'instagram'
            if (parts[0] && parts[0] !== 'p' && parts[0] !== 'reel') author = parts[0]
        } else if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
            platform = 'youtube'
        } else if (hostname.includes('reddit.com') || hostname.includes('redd.it')) {
            platform = 'reddit'
            if (hostname.includes('reddit.com') && parts[0] === 'r' && parts[1]) {
                author = `r/${parts[1]}`
            } 
        } else if (hostname.includes('tiktok.com')) {
            platform = 'tiktok'
            if (parts[0] && parts[0].startsWith('@')) author = parts[0]
        } else if (hostname.includes('bsky.app')) {
            platform = 'bluesky'
            if (parts[1]) author = parts[1]
        } else {
            platform = hostname.split('.')[0]
        }

        if (platform) tags.push(platform)
        
        return { platform, author, tags }    
    } catch {
        return { platform: '', tags: [] }
    }
}

async function fetchReddit(url) {
    try {
        const cleanUrl = url.split('?')[0].replace(/\/$/, '')
        const jsonUrl = cleanUrl
            .replace('www.reddit.com', 'old.reddit.com')
             + '.json'

        const { data } = await axios.get(jsonUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Referer': 'https://www.reddit.com/'
            }
        })

        const post = data[0].data.children[0].data
        let images = []

        //Галерея
        if (post.gallery_data && post.media_metadata) {
            images = Object.values(post.media_metadata)
            .map(m => {
                if (m.s?.u) {
                    return m.s.u
                    .replace(/&amp;/g, '&')
                    .split('?')[0]
                }
                return null
            })
            .filter(Boolean)
        }

        //Обычная картинка
        else if (
            post.url_overridden_by_dest &&
            /\.(jpg|jpeg|png)$/i.test(post.url_overridden_by_dest)
        ) {
            images = [post.url_overridden_by_dest]
        }

        return {
            title: post.title || '',
            text: post.selftext || '',
            images
        }

    } catch (e) {
        console.error('fetchReddit error:', e.message)

        return {
            title: '',
            text: '',
            images: []
        }
    }
}

function transformUrl(url) {
    try {
        const u = new URL(url)
        const hostname = u.hostname.replace('www.', '')

        if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
            return url.replace(/https?:\/\/(www\.)?(twitter\.com|x\.com)/, 'https://vxtwitter.com')
        }
        if (hostname.includes('instagram.com')) {
            return url.replace(/https?:\/\/(www\.)?instagram\.com/, 'https://vxinstagram.com')
        }
        if (hostname.includes('tiktok.com')) {
            return url.replace(/https?:\/\/(www\.)?tiktok\.com/, 'https://vxtiktok.com')
        }
        return url
    } catch {
        return url
    }
}

module.exports = { parseUrl, transformUrl, fetchMeta, fetchReddit }