import { createField, field } from '@lolpants/jogger'
import { ctxField, logger } from '~/logger.js'
import { getPosts, type Post, type SortLevel } from '~/reddit/index.js'
import { redis } from '~/redis/index.js'

const ctx = ctxField('generate-posts')
const action = createField('action')

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
        logger.warn(
          ctx,
          field('subreddit', subreddit),
          action('skip-staged'),
          field('id', post.id),
          field('url', post.url),
        )

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
