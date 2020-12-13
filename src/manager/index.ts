import { WebhookClient } from 'discord.js'
import { config } from '~config'
import type { IPostConfig } from '~config'
import { validateSubreddit } from '~reddit'
import { redis } from '~redis'
import { resolveArray } from '~utils/arrays'
import signale from '~utils/signale'
import { generatePosts } from './generator'

interface IManager {
  cleanup: () => void | Promise<void>
}

export const createManager: (
  post: IPostConfig
) => Promise<IManager | undefined> = async postConfig => {
  const db = redis.duplicate()

  const subreddit = postConfig.subreddit
  const level = postConfig.level ?? 'hot'
  const interval = Math.max(30, postConfig.interval ?? config.interval)

  const isValid = await validateSubreddit(subreddit)
  if (isValid === false) {
    signale.warn(`/r/${subreddit} could not be reached!`)
    return
  }

  const allowNSFW = postConfig.allowNSFW ?? false
  const postTitles = postConfig.titles ?? false
  const postURLs = postConfig.urls ?? false

  const webhooks = resolveArray(postConfig.webhooks).map(hook => {
    const [id, token] = hook.split('/').slice(-2)
    return new WebhookClient(id, token)
  })

  const generator = generatePosts(subreddit, level, db)
  const loop = async () => {
    const { value: post } = await generator.next()
    const markSeen = async () => {
      await db.sadd(subreddit, post.id)
    }

    if (post.nsfw && allowNSFW === false) return markSeen()

    try {
      const lines: string[] = []
      const files: string[] = []

      if (postTitles === true) lines.push(post.title)
      if (postURLs === true) lines.push(`<${post.source}>`)

      if (post.type === 'text') lines.push(post.url)
      else files.push(post.url)

      const message = lines.join('\n')
      await sendPost(message, ...files)
      await markSeen()
    } catch (error: unknown) {
      signale.warn(`Failed to post ${post.id} from /r/${subreddit}/${level}`)
      signale.warn(error)
    }
  }

  const sendPost = async (text: string, ...files: string[]) => {
    const tasks = webhooks.map(async hook => hook.send(text, { files }))
    return Promise.all(tasks)
  }

  signale.info(`Posting from /r/${subreddit}/${level} every ${interval}s`)
  void loop()
  const intervalId = setInterval(async () => loop(), 1000 * interval)

  return {
    cleanup: () => {
      signale.complete(`Stopping posts from /r/${subreddit}/${level}`)
      clearInterval(intervalId)
    },
  }
}
