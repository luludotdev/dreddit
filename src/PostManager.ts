import { WebhookClient } from 'discord.js'
import signale from 'signale'
import { config, IPostConfig } from './config'
import { getPosts, IPost, SortLevel, validateSubreddit } from './reddit'
import { redis } from './redis'
import { filterAsync, resolveArray } from './util'

export default class PostManager {
  private ready: boolean = false

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
    this.level = post.level || 'hot'
    this.interval = Math.max(30, post.interval || config.interval)

    this.allowNSFW = post.allowNSFW || false
    this.postTitles = post.titles || false
    this.postURLs = post.urls || false

    this.webhooks = resolveArray(post.webhooks).map(hook => {
      const [id, token] = hook.split('/').slice(-2)
      return new WebhookClient(id, token)
    })

    this.postManager = this.getPost()
    this.init()
  }

  private get redditURL() {
    return `/r/${this.subreddit}/${this.level}`
  }

  private get redditURLShort() {
    return `/r/${this.subreddit}`
  }

  private async init() {
    const valid = await validateSubreddit(this.subreddit)
    if (!valid) {
      signale.warn(`${this.redditURLShort} could not be reached!`)
      return undefined
    }

    signale.info(`Posting from ${this.redditURL} every ${this.interval}s`)

    this.ready = true
    this.postLoop()
    setInterval(() => this.postLoop(), 1000 * this.interval)
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
      if (!this.ready) {
        yield null
        continue
      }

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

  private async postLoop() {
    // TODO
  }
}
