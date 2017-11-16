// Package Dependencies
const { WebhookClient } = require('discord.js')

// Local Dependencies
const { fetchPosts } = require('./reddit')
const { addRow, accessFile } = require('./cache')

// Environment Variables
const { SUBREDDIT } = process.env

const main = async () => {
  console.log(await getPost())
}

const getPost = async () => {
  // Fetch Reddit Posts
  let posts = await fetchPosts(SUBREDDIT)

  let dupes = await accessFile()
  let IDs = dupes.map(x => x.id)
  while (true) { // eslint-disable-line
    if (posts.length) throw new Error('No new posts')
    let id = Math.floor(Math.random() * posts.length)
    let post = posts[id]
    if (IDs.includes(post.id)) {
      posts.splice(id, 1)
      continue
    } else {
      addRow(post.id)
      return post
    }
  }
}

main()
