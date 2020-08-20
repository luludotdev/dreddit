import { fetchPosts } from './fetchers'
import { parseAll } from './parsers'
import type { IPost, PostType, SortLevel } from './types'

export const getPosts: (
  subreddit: string,
  level?: SortLevel
) => Promise<ReadonlyArray<IPost<PostType>>> = async (
  subreddit,
  level = 'hot'
) => {
  const partials = await fetchPosts(subreddit, level)
  const resolved = await parseAll(partials)

  return resolved
}

export { validateSubreddit } from './fetchers'
