import { createField, field } from '@lolpants/jogger'
import { ctxField, logger } from '~/logger.js'
import { redditAxios as axios } from '~/utils/axios.js'
import { type PartialPost, type Response, type SortLevel } from './types.js'

const ctx = ctxField('reddit')
const action = createField('action')
const status = createField('status')

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
  level?: SortLevel
) => Promise<readonly PartialPost[]> = async (subreddit, level = 'hot') => {
  logger.trace(
    ctx,
    action('fetch'),
    status('preflight'),
    field('subreddit', `/r/${subreddit}`),
    field('sort', level)
  )

  const resp = await axios.get<Response>(
    `/r/${subreddit}/${level}.json?limit=100`
  )

  const posts: PartialPost[] = resp.data.data.children
    .map(({ data }) => data)
    .map(({ id, title, url, over_18, permalink }) => ({
      id,
      nsfw: over_18,
      source: `https://reddit.com${permalink}`,
      title,
      url,
    }))

  logger.trace(
    ctx,
    action('fetch'),
    status('complete'),
    field('subreddit', `/r/${subreddit}`),
    field('sort', level),
    field('results', posts.length)
  )

  return posts
}
