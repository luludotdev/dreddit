import { fetchPosts } from './fetchers.js'
import { parseAll } from './parsers.js'
import type { Post, SortLevel } from './types.js'

export const getPosts: (
  subreddit: string,
  level?: SortLevel
) => Promise<readonly Post[]> = async (subreddit, level = 'hot') => {
  const partials = await fetchPosts(subreddit, level)
  const resolved = await parseAll(partials)

  return resolved
}

export { validateSubreddit } from './fetchers.js'
export type { Post, SortLevel } from './types.js'
