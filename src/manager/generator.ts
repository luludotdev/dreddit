import { action, context, logger } from '~/logger.js'
import { getPosts } from '~/reddit/index.js'
import type { Post, SortLevel } from '~/reddit/index.js'
import { redis } from '~/redis/index.js'

const ctx = context('generate-posts')

/* eslint-disable no-await-in-loop */
export async function* generatePosts(
  subreddit: string,
  level: SortLevel,
  db = redis,
): AsyncGenerator<Post | undefined, never, never> {
  while (true) {
    const posts = await getPosts(subreddit, level)

    let seenCount = 0
    for (const post of posts) {
      const seen = await db.sismember(subreddit, post.id)
      if (seen === 1) {
        seenCount += 1
        continue
      }

      const staged = await db.sismember(`staging:${subreddit}`, post.id)
      if (staged === 1) {
        logger.warn({
          ...ctx,
          subreddit,
          ...action('skip-staged'),
          id: post.id,
          url: post.sourceURL,
        })

        seenCount += 1
        continue
      }

      await db.sadd(`staging:${subreddit}`, post.id)
      yield post
    }

    if (posts.length === seenCount) yield undefined
  }
}
/* eslint-enable no-await-in-loop */
