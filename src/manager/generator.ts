import type { IPost, SortLevel } from '~reddit'
import { getPosts } from '~reddit'
import { redis } from '~redis'

/* eslint-disable no-await-in-loop */
export async function* generatePosts(
  subreddit: string,
  level: SortLevel,
  db = redis
): AsyncGenerator<IPost, never, never> {
  while (true) {
    const posts = await getPosts(subreddit, level)

    for (const post of posts) {
      const seen = await db.sismember(subreddit, post.id)
      if (seen === 1) continue

      yield post
    }
  }
}
/* eslint-enable no-await-in-loop */
