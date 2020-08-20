import Axios from 'axios'
import { sync as readPkg } from 'read-pkg-up'

const pkg = readPkg()
const name = pkg?.packageJson.name ?? 'dreddit'
const version = pkg?.packageJson.version ?? 'Unknown'

export const axios = Axios.create({
  baseURL: 'https://www.reddit.com/',
  headers: {
    'User-Agent': `${name}/v${version}`,
  },
})
