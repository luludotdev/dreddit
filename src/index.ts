import signale from 'signale'
import { config } from './config'
import PostManager from './manager'

signale.start('Starting dreddit...')
const managers = config.subreddits.map(post => new PostManager(post))
