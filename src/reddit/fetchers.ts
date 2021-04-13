import { redditAxios as axios } from '~utils/axios.js'
import { escapePings } from '~utils/pings.js'
import type { IPartialPost, IResponse, SortLevel } from './types.js'

export const validateSubreddit = async (subreddit: string) => {
  try {
    const resp = await axios.get<IResponse>(`/r/${subreddit}.json?limit=1`)
    return resp.status === 200
  } catch {
    return false
  }
}

export const fetchPosts: (
  subreddit: string,
  level?: SortLevel
) => Promise<readonly IPartialPost[]> = async (subreddit, level = 'hot') => {
  const resp = await axios.get<IResponse>(
    `/r/${subreddit}/${level}.json?limit=100`
  )

  const posts: IPartialPost[] = resp.data.data.children
    .map(({ data }) => data)
    .map(({ id, title, url, over_18, permalink }) => ({
      id,
      nsfw: over_18,
      source: `https://reddit.com${permalink}`,
      title: escapePings(title),
      url,
    }))

  return posts
}
