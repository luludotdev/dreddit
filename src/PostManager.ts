import { WebhookClient } from 'discord.js'
import { config, IPostConfig } from './config'
import { getPosts, IPost, SortLevel } from './reddit'
import { redis } from './redis'
import { filterAsync, resolveArray } from './util'

export default class PostManager {
  private subreddit: string
  private level: SortLevel | undefined

  private webhooks: WebhookClient[]
  private interval: number

  private allowNSFW: boolean
  private postTitles: boolean
  private postURLs: boolean

  private postManager: AsyncIterableIterator<Readonly<IPost> | null>

  constructor(post: IPostConfig) {
    this.subreddit = post.subreddit
    this.level = post.level
    this.interval = Math.max(30, post.interval || config.interval)

    this.allowNSFW = post.allowNSFW || false
    this.postTitles = post.titles || false
    this.postURLs = post.urls || false

    this.webhooks = resolveArray(post.webhooks).map(hook => {
      const [id, token] = hook.split('/').slice(-2)
      return new WebhookClient(id, token)
    })

    this.postManager = this.getPost()
  }

  private postHook(message: string, file?: string | string[]) {
    const files = resolveArray(file || [])
    return Promise.all(this.webhooks.map(hook => hook.send(message, { files })))
  }

  private async *getPost() {
    let posts: Array<Readonly<IPost>> = []

    const loadPosts = async () => {
      const localPosts = (await getPosts(this.subreddit, this.level))
        .filter(p => (this.allowNSFW ? true : !p.nsfw))
        .slice(0, 10)

      const filtered = await filterAsync(localPosts, async p => {
        const exists = await redis.hexists(this.subreddit, p.id)
        return exists !== 1
      })

      return [
        ...posts,
        ...filtered.filter(p => !posts.map(x => x.id).includes(p.id)),
      ]
    }

    while (true) {
      posts = await loadPosts()
      if (posts.length === 0) {
        yield null
        continue
      }

      const [next] = posts
      yield next
      posts = posts.filter(p => p.id !== next.id)
    }
  }
}
