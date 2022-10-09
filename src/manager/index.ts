import { clearInterval, setInterval } from 'node:timers'
import { field } from '@lolpants/jogger'
import { WebhookClient } from 'discord.js'
import { generatePosts } from './generator.js'
import { config, type SubredditConfig } from '~/config/index.js'
import { MIN_INTERVAL } from '~/config/schema.js'
import { ctxField, errorField, logger } from '~/logger.js'
import { validateSubreddit } from '~/reddit/index.js'
import { redis } from '~/redis/index.js'
import { resolveArray } from '~/utils/arrays.js'

const ctx = ctxField('manager')

interface Manager {
  cleanup(): Promise<void> | void
}

export const createManager: (
  post: SubredditConfig,
) => Promise<Manager | undefined> = async postConfig => {
  const { subreddit } = postConfig
  const level = postConfig.level ?? 'hot'
  const interval = Math.max(
    MIN_INTERVAL,
    postConfig.interval ?? config.interval,
  )

  const subredditField = field('subreddit', `/r/${subreddit}`)

  const isValid = await validateSubreddit(subreddit)
  if (isValid === false) {
    logger.warn(
      ctx,
      subredditField,
      field('message', `/r/${subreddit} could not be reached!`),
    )

    return
  }

  const allowNSFW = postConfig.allowNSFW ?? false
  const postTitles = postConfig.titles ?? false
  const postURLs = postConfig.urls ?? false

  const webhooks = resolveArray(postConfig.webhooks).map(
    hook => new WebhookClient({ url: hook }),
  )

  const sendPost = async (text: string, ...files: string[]) => {
    const tasks = webhooks.map(async hook =>
      hook.send({ content: text, files, allowedMentions: { parse: [] } }),
    )

    return Promise.all(tasks)
  }

  const generator = generatePosts(subreddit, level, redis)
  const loop = async () => {
    const { value: post } = await generator.next()
    if (post === undefined) return

    logger.trace(
      ctx,
      subredditField,
      field('action', 'pop'),
      field('id', post.id),
      field('url', post.url),
    )

    const markSeen = async () => {
      await redis.sadd(subreddit, post.id)

      logger.trace(
        ctx,
        subredditField,
        field('action', 'mark-seen'),
        field('id', post.id),
        field('url', post.url),
      )
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
      logger.info(
        ctx,
        subredditField,
        field('action', 'post'),
        field('id', post.id),
        field('url', post.url),
        field('size', post.size ?? -1),
      )

      await markSeen()
    } catch (error: unknown) {
      logger.warn(
        ctx,
        subredditField,
        field(
          'message',
          `Failed to post ${post.id} from /r/${subreddit}/${level}`,
        ),
      )

      if (error instanceof Error) {
        logger.warn(ctx, subredditField, errorField(error))
      }
    }
  }

  const sendPost = async (text: string, ...files: string[]) => {
    const tasks = webhooks.map(async hook =>
      hook.send({ content: text, files, allowedMentions: { parse: [] } })
    )

    return Promise.all(tasks)
  }

  logger.info(
    ctx,
    subredditField,
    field(
      'message',
      `Posting from /r/${subreddit}/${level} every ${interval}s`,
    ),
  )

  void loop()
  const intervalId = setInterval(async () => loop(), 1_000 * interval)

  return {
    cleanup() {
      logger.info(
        ctx,
        subredditField,
        field('message', `Stopping posts from /r/${subreddit}/${level}`),
      )

      clearInterval(intervalId)
    },
  }
}
