import { fetchPosts } from './fetchers'
import { parseAll } from './parsers'
import type { IPost, SortLevel } from './types'

export const getPosts: (
  subreddit: string,
  level?: SortLevel
) => Promise<readonly IPost[]> = async (subreddit, level = 'hot') => {
  const partials = await fetchPosts(subreddit, level)
  const resolved = await parseAll(partials)

  return resolved
}

export { validateSubreddit } from './fetchers'
export type { IPost, SortLevel } from './types'
