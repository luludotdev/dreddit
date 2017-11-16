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

  let dupeCheck = true
  let dupes = await accessFile()
  while (dupeCheck) {
    let id = Math.floor(Math.random() * posts.length)
    let post = posts[id]

    addRow(post.id)
    return post
  }
}

main()
