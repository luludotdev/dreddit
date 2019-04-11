import { WebhookClient } from 'discord.js'
import { config, IPostConfig } from './config'
import { getPosts, SortLevel } from './reddit'
import { resolveArray } from './util'

export default class PostManager {
  private subreddit: string
  private level: SortLevel | undefined

  private webhooks: WebhookClient[]
  private interval: number

  private allowNSFW: boolean
  private postTitles: boolean
  private postURLs: boolean

  constructor(post: IPostConfig) {
    this.subreddit = post.subreddit
    this.level = post.level
    this.interval = post.interval || config.interval

    this.allowNSFW = post.allowNSFW || false
    this.postTitles = post.titles || false
    this.postURLs = post.urls || false

    this.webhooks = resolveArray(post.webhooks).map(hook => {
      const [id, token] = hook.split('/').slice(-2)
      return new WebhookClient(id, token)
    })
  }

  private postHook(message: string, file?: string | string[]) {
    const files = resolveArray(file || [])
    return Promise.all(this.webhooks.map(hook => hook.send(message, { files })))
  }
}
