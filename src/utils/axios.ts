import Axios from 'axios'
import { readPackageUpSync as readPkg } from 'read-pkg-up'
import { env } from '~/env.js'

const pkg = readPkg()
const name = pkg?.packageJson.name ?? 'dreddit'
const version = pkg?.packageJson.version ?? 'Unknown'
const userAgent = `${name}/v${version}`

export const redditAxios = Axios.create({
  baseURL: 'https://www.reddit.com/',
  headers: {
    'User-Agent': userAgent,
  },
})

export const imgurAxios = Axios.create({
  baseURL: 'https://api.imgur.com/3/',
  headers: {
    'User-Agent': userAgent,
    Authorization: `Client-ID ${env.IMGUR_CLID}`,
  },
})
