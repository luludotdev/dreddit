import { WebhookClient } from 'discord.js'
import { config, IPostConfig } from './config'
import { getPosts, IPost, SortLevel, validateSubreddit } from './reddit'
import { redis } from './redis'
import signale from './signale'
import { filterAsync, resolveArray } from './util'

export default class PostManager {
  private ready: boolean = false
  private noNew: boolean = false

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

  public async cleanup() {
    if (!this.ready) return undefined
    signale.complete(`Stopping posts from ${this.redditURL}`)
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
      try {
        const localPosts = (await getPosts(this.subreddit, this.level)).filter(
          p => (this.allowNSFW ? true : !p.nsfw)
        )

        const filtered = await filterAsync(localPosts, async p => {
          const exists = await redis.hexists(this.subreddit, p.id)
          return exists !== 1
        })

        return [
          ...posts,
          ...filtered.filter(p => !posts.map(x => x.id).includes(p.id)),
        ]
      } catch (err) {
        signale.error(err)
        return posts
      }
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

      const next = posts[Math.floor(Math.random() * posts.length)]
      yield next
      posts = posts.filter(p => p.id !== next.id)
    }
  }

  private async postLoop() {
    const { value: post } = await this.postManager.next()
    if (post === null) {
      if (!this.noNew) {
        signale.note(`No new posts on ${this.redditURL}`)
        this.noNew = true
      }

      return undefined
    } else {
      this.noNew = false
    }

    try {
      const meta: string[] = []

      if (this.postTitles) meta.push(post.title)
      if (this.postURLs) meta.push(`<${post.source}>`)
      if (post.type === 'gfy') meta.push(post.url)

      const message = meta.join('\n')
      if (post.type === 'gfy') await this.postHook(message)
      else await this.postHook(message, post.url)

      await redis.hset(this.subreddit, post.id, 1)
      signale.info(`Posted ${post.id} from ${this.redditURL}`)
    } catch (err) {
      signale.error(`Failed to post ${post.id} from ${this.redditURL}`)
    }
  }
}
