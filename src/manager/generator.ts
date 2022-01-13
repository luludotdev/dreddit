import { getPosts, type Post, type SortLevel } from '~reddit/index.js'
import { redis } from '~redis/index.js'

/* eslint-disable no-await-in-loop */
export async function* generatePosts(
  subreddit: string,
  level: SortLevel,
  db = redis
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

      yield post
    }

    if (posts.length === seenCount) yield undefined
  }
}
/* eslint-enable no-await-in-loop */
