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

module.exports = { parseUrl, transformUrl }