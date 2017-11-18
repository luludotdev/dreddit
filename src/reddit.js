// Package Dependencies
const snekfetch = require('snekfetch')
const url = require('url')
const path = require('path')

/**
 * NSFW Object - Common for all function returns
 * @typedef {Object} NSFWObject
 * @property {string} subreddit
 * @property {string} file_url
 * @property {string} id
 * @property {string} source
 * @property {boolean} nsfw
 * @property {string} type
 */

/**
 * Fetch Hot Posts
 * @param {string} subreddit Subreddit to Scrape
 * @param {string} [level] Type of posts to scrape. Default = `hot`
 * @returns {Promise.<NSFWObject[]>}
 */
const fetchPosts = async (subreddit, level = 'hot') => {
  let res = await snekfetch.get(`https://www.reddit.com/r/${subreddit}/${level}.json?limit=100`)
  let arr = res.body.data.children.map(o => o.data)
    .map(o => ({
      subreddit,
      file_url: o.url,
      id: o.id,
      source: `https://reddit.com${o.permalink}`,
      nsfw: o.over_18,
    }))

  let images = arr
    .filter(x => {
      let { ext } = path.parse(url.parse(x.file_url).pathname)
      return ['.png', '.gif', '.jpg', '.jpeg'].includes(ext)
    })
    .map(x => {
      x.type = 'image'
      return x
    })
    .map(x => {
      let { protocol, host, pathname } = url.parse(x.file_url)
      x.file_url = `${protocol}//${host}${pathname}`
      return x
    })

  let imgurRegex = /https?:\/\/imgur\.com\/([a-zA-Z0-9]{5,})/i
  let imgurs = arr
    .filter(x => x.file_url.match(imgurRegex))
    .map(x => {
      let match = x.file_url.match(imgurRegex)
      x.file_url = `https://i.imgur.com/${match[1]}.png`
      x.type = 'image'
      return x
    })

  let GFYs = arr
    .filter(x => x.file_url.match(/http(s)?:\/\/gfycat.com\/(.+)/i))
    .map(x => {
      x.type = 'gfy'
      return x
    })

  return [...images, ...imgurs, ...GFYs]
}

module.exports = { fetchPosts }
