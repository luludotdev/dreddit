import type { Data } from '@luludev/jogger'
import { action, context, logger } from '~/logger.js'
import type { PartialPost, Response, SortLevel } from '~/reddit/types.js'
import { redditAxios as axios } from '~/utils/axios.js'

const ctx = context('reddit')
const status = (status: string): Data => ({ status })

export const validateSubreddit = async (subreddit: string) => {
  try {
    const resp = await axios.get<Response>(`/r/${subreddit}.json?limit=1`)
    return resp.status === 200
  } catch {
    return false
  }
}

export const fetchPosts: (
  subreddit: string,
  level?: SortLevel,
) => Promise<readonly PartialPost[]> = async (subreddit, level = 'hot') => {
  logger.trace({
    ...ctx,
    ...action('fetch'),
    ...status('preflight'),
    subreddit: `/r/${subreddit}`,
    sort: level,
  })

  const resp = await axios.get<Response>(
    `/r/${subreddit}/${level}.json?limit=100`,
  )

  const posts: PartialPost[] = resp.data.data.children
    .map(({ data }) => data)
    .map(({ id, title, url, over_18, permalink }) => {
      const post: PartialPost = {
        id,
        nsfw: over_18,
        source: `https://reddit.com${permalink}`,
        sourceURL: url,
        title,
      }

      return post
    })

  logger.trace({
    ...ctx,
    ...action('fetch'),
    ...status('complete'),
    subreddit: `/r/${subreddit}`,
    sort: level,
    results: posts.length,
  })

  return posts
}
