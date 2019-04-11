import { config } from './config'
import PostManager from './PostManager'

const managers = config.subreddits.map(post => new PostManager(post))
