// Package Dependencies
const snekfetch = require('snekfetch')
const url = require('url')
const path = require('path')

// Environment Variables
const { SUBREDDIT } = process.env

const fetchPosts = async (subreddit, level = 'hot') => {
  let res = await snekfetch.get(`https://www.reddit.com/r/${subreddit}/${level}.json?limit=100`)
  let arr = res.body.data.children.map(o => o.data)
    .map(o => ({
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

  let GFYs = arr
    .filter(x => x.file_url.match(/http(s)?:\/\/gfycat.com\/(.+)/i))
    .map(x => {
      x.type = 'gfy'
      return x
    })

  return [...images, ...GFYs]
}
