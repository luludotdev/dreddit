// Package Dependencies
const log = require('fancylog')
const schedule = require('node-schedule')
const { WebhookClient } = require('discord.js')

// Local Dependencies
const { fetchPosts } = require('./reddit')
const { addRow, accessFile } = require('./cache')

// Environment Variables
const { HOOK_URLS, SUBREDDIT, ALLOW_NSFW, POST_TITLES, POST_URLS, INTERVAL } = process.env

/**
 * NSFW Object - Common for all function returns
 * @typedef {Object} NSFWObject
 * @property {string} subreddit
 * @property {string} title
 * @property {string} file_url
 * @property {string} id
 * @property {string} source
 * @property {boolean} nsfw
 * @property {string} type
 */

// Setup Webhook Clients
const clients = HOOK_URLS.split('|')
  .map(x => {
    const [id, token] = x.split('/').slice(-2)
    let client = new WebhookClient(id, token)
    return client
  })

const main = async () => {
  try {
    let post = await getPost()
    log.i(`Posting ${post.id} from /r/${post.subreddit}`)
    for (let client of clients) {
      try {
        let meta = []
        if (POST_TITLES !== undefined) meta = [...meta, post.title]
        if (POST_URLS !== undefined) meta = [...meta, `<${post.source}>`]
        meta = meta.join('\n')

        if (post.type === 'image') client.send(meta, { files: [post.file_url] })
        else if (post.type === 'gfy') client.send(`${meta}\n${post.file_url}`)
      } catch (err) {
        log.error(`Error posting to webhook:\n${err.message}`)
      }
    }
  } catch (err) {
    log.error('No new Posts')
  }
}

/**
 * @returns {NSFWObject}
 */
const getPost = async () => {
  // Fetch Reddit Posts
  let subreddits = SUBREDDIT.split('|')
  let posts = await Promise.all(subreddits.map(x => fetchPosts(x)))

  /**
   * @type {NSFWObject[]}
   */
  posts = [].concat(...posts)

  let IDs = await accessFile()
  IDs = IDs.map(x => x.id)
  while (true) { // eslint-disable-line
    if (posts.length === 0) throw new Error('No new posts')
    let id = Math.floor(Math.random() * posts.length)
    let post = posts[id]

    if (IDs.includes(post.id) || (post.nsfw && !(ALLOW_NSFW !== undefined))) {
      posts.splice(id, 1)
      continue
    } else {
      addRow(post.id)
      return post
    }
  }
}

let interval = INTERVAL || 5
schedule.scheduleJob(`*/${interval} * * * *`, () => { main() })
log.i(`Bot Started...`)
log.i(`Posting every ${interval === 1 ? 'minute' : `${interval} minutes`}.`)
