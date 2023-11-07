import { clearInterval, setInterval } from 'node:timers'
import { AttachmentBuilder, WebhookClient } from 'discord.js'
import type { BufferResolvable } from 'discord.js'
import ms from 'ms'
import { config } from '~/config/index.js'
import type { SubredditConfig } from '~/config/index.js'
import { MIN_INTERVAL } from '~/config/schema.js'
import { action, context, errorField, logger, message } from '~/logger.js'
import { generatePosts } from '~/manager/generator.js'
import { validateSubreddit } from '~/reddit/index.js'
import { redis } from '~/redis/index.js'
import { resolveArray } from '~/utils/arrays.js'

const ctx = context('manager')

interface Manager {
  cleanup(): Promise<void> | void
}

export const createManager: (
  post: SubredditConfig,
) => Promise<Manager | undefined> = async postConfig => {
  const { subreddit } = postConfig
  const rSubreddit = `/r/${subreddit}`

  const level = postConfig.level ?? 'hot'
  const interval = Math.max(
    MIN_INTERVAL,
    postConfig.interval ?? config.interval,
  )

  const error = await validateSubreddit(subreddit)
  if (error !== undefined) {
    logger.warn({
      ...ctx,
      subreddit: rSubreddit,
      ...message(`/r/${subreddit} could not be reached`),
      ...errorField(error),
    })

    return
  }

  const allowNSFW = postConfig.allowNSFW ?? false
  const postTitles = postConfig.titles ?? false
  const postURLs = postConfig.urls ?? false

  const webhooks = resolveArray(postConfig.webhooks).map(
    hook => new WebhookClient({ url: hook }),
  )

  const sendPost = async (
    text: string,
    ...files: (AttachmentBuilder | BufferResolvable)[]
  ) => {
    const tasks = webhooks.map(async hook =>
      hook.send({ content: text, files, allowedMentions: { parse: [] } }),
    )

    return Promise.all(tasks)
  }

  const generator = generatePosts(subreddit, level, redis)
  const loop = async () => {
    const { value: post } = await generator.next()
    if (post === undefined) return

    logger.trace({
      ...ctx,
      subreddit: rSubreddit,
      ...action('pop'),
      id: post.id,
      url: post.sourceURL,
    })

    const unstage = async () => {
      await redis.srem(`staging:${subreddit}`, post.id)

      logger.trace({
        ...ctx,
        subreddit: rSubreddit,
        ...action('unstage'),
        id: post.id,
        url: post.sourceURL,
      })
    }

    const markSeen = async () => {
      await redis.sadd(subreddit, post.id)
      logger.trace({
        ...ctx,
        subreddit: rSubreddit,
        ...action('mark-seen'),
        id: post.id,
        url: post.sourceURL,
      })

      await unstage()
    }

    if (post.nsfw && allowNSFW === false) return markSeen()

    try {
      const lines: string[] = []
      const files: (AttachmentBuilder | BufferResolvable)[] = []

      if (postTitles === true) lines.push(post.title)
      if (postURLs === true) lines.push(`<${post.source}>`)

      switch (post.type) {
        case 'text': {
          lines.push(post.text)
          break
        }

        case 'upload-url': {
          files.push(post.url)
          break
        }

        case 'upload-bytes': {
          const file = new AttachmentBuilder(post.bytes, { name: post.name })
          files.push(file)
          break
        }
      }

      const message = lines.join('\n')
      await sendPost(message, ...files)

      logger.info({
        ...ctx,
        subreddit: rSubreddit,
        ...action('post'),
        id: post.id,
        url: post.sourceURL,
        size: post.size ?? -1,
      })

      await markSeen()
    } catch (error: unknown) {
      logger.warn({
        ...ctx,
        subreddit: rSubreddit,
        ...message(`failed to post ${post.id} from /r/${subreddit}/${level}`),
      })

      if (error instanceof Error) {
        logger.warn({ ...ctx, subreddit: rSubreddit, ...errorField(error) })
      }

      await unstage()
    }
  }

  const clearStaged = async () => {
    await redis.del(`staging:${subreddit}`)
    logger.trace({ ...ctx, subreddit: rSubreddit, ...action('clear-staged') })
  }

  await clearStaged()
  const clearStagedInterval = setInterval(async () => clearStaged(), ms('1h'))

  logger.info({
    ...ctx,
    subreddit: rSubreddit,
    ...message(`posting from /r/${subreddit}/${level} every ${interval}s`),
  })

  void loop()
  const loopInterval = setInterval(async () => loop(), 1_000 * interval)

  return {
    cleanup() {
      logger.info({
        ...ctx,
        subreddit: rSubreddit,
        ...message(`stopping posts from /r/${subreddit}/${level}`),
      })

      clearInterval(clearStagedInterval)
      clearInterval(loopInterval)
    },
  }
}
