// Package Dependencies
const log = require('fancylog')
const { WebhookClient } = require('discord.js')

// Local Dependencies
const { fetchPosts } = require('./reddit')
const { addRow, accessFile } = require('./cache')

// Environment Variables
const { SUBREDDIT, ALLOW_NSFW } = process.env

const main = async () => {
  try {
    let post = await getPost()
    console.log(post)
  } catch (err) {
    console.error(err)
    log.error('No new Posts')
  }
}

const getPost = async () => {
  // Fetch Reddit Posts
  let posts = await fetchPosts(SUBREDDIT)

  let dupes = await accessFile()
  let IDs = dupes.map(x => x.id)
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

main()
