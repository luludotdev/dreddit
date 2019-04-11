import { config } from './config'
import PostManager from './manager'

const managers = config.subreddits.map(post => new PostManager(post))
