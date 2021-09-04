import { field } from '@lolpants/jogger'
import { WebhookClient } from 'discord.js'
import { config } from '~config/index.js'
import type { IPostConfig } from '~config/index.js'
import { ctxField, errorField, logger } from '~logger/index.js'
import { validateSubreddit } from '~reddit/index.js'
import { redis } from '~redis/index.js'
import { resolveArray } from '~utils/arrays.js'
import { generatePosts } from './generator.js'

const ctx = ctxField('manager')

interface IManager {
  cleanup: () => void | Promise<void>
}

export const createManager: (
  post: IPostConfig
) => Promise<IManager | undefined> = async postConfig => {
  const { subreddit } = postConfig
  const level = postConfig.level ?? 'hot'
  const interval = Math.max(30, postConfig.interval ?? config.interval)

  const subredditField = field('subreddit', `/r/${subreddit}`)

  const isValid = await validateSubreddit(subreddit)
  if (isValid === false) {
    logger.warn(
      ctx,
      subredditField,
      field('message', `/r/${subreddit} could not be reached!`)
    )
    return
  }

  const allowNSFW = postConfig.allowNSFW ?? false
  const postTitles = postConfig.titles ?? false
  const postURLs = postConfig.urls ?? false

  const webhooks = resolveArray(postConfig.webhooks).map(
    hook => new WebhookClient({ url: hook })
  )

  const generator = generatePosts(subreddit, level, redis)
  const loop = async () => {
    const { value: post } = await generator.next()
    if (post === null) return

    const markSeen = async () => {
      await redis.sadd(subreddit, post.id)
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

      logger.debug(
        ctx,
        subredditField,
        field('action', 'post'),
        field('id', post.id),
        field('url', post.url)
      )
    } catch (error: unknown) {
      logger.warn(
        ctx,
        subredditField,
        field(
          'message',
          `Failed to post ${post.id} from /r/${subreddit}/${level}`
        )
      )

      if (error instanceof Error) {
        logger.warn(ctx, subredditField, errorField(error))
      }
    }
  }

  const sendPost = async (text: string, ...files: string[]) => {
    const tasks = webhooks.map(async hook =>
      hook.send({ content: text, files })
    )

    return Promise.all(tasks)
  }

  logger.info(
    ctx,
    subredditField,
    field('message', `Posting from /r/${subreddit}/${level} every ${interval}s`)
  )

  void loop()
  const intervalId = setInterval(async () => loop(), 1000 * interval)

  return {
    cleanup: () => {
      logger.info(
        ctx,
        subredditField,
        field('message', `Stopping posts from /r/${subreddit}/${level}`)
      )

      clearInterval(intervalId)
    },
  }
}
