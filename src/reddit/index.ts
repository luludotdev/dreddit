import { fetchPosts } from './fetchers.js'
import { parseAll } from './parsers.js'
import type { IPost, SortLevel } from './types.js'

export const getPosts: (
  subreddit: string,
  level?: SortLevel
) => Promise<readonly IPost[]> = async (subreddit, level = 'hot') => {
  const partials = await fetchPosts(subreddit, level)
  const resolved = await parseAll(partials)

  return resolved
}

export { validateSubreddit } from './fetchers.js'
export type { IPost, SortLevel } from './types.js'
