import type { Buffer } from 'node:buffer'
import type { SubredditConfig } from '~/config/index.js'

export type SortLevel = Exclude<SubredditConfig['level'], undefined>

export interface PartialPost {
  id: string
  title: string
  nsfw: boolean

  source: string
  sourceURL: string
}

interface PostCommon extends PartialPost {
  size?: number
}

export interface TextPost extends PostCommon {
  type: 'text'
  text: string
}

export interface UploadUrlPost extends PostCommon {
  type: 'upload-url'

  url: string
  fallback?: string
}

export interface UploadBytesPost extends PostCommon {
  type: 'upload-bytes'

  bytes: Buffer
  name: string
  fallback?: string
}

export type Post = TextPost | UploadBytesPost | UploadUrlPost

export interface Response {
  kind: 'Listing'

  data: {
    modhash: string
    dist: number

    children: {
      kind: 't3'
      data: {
        subreddit: string
        id: string
        url: string
        title: string
        permalink: string
        over_18: boolean
      }
    }[]

    after: string | null
    before: string | null
  }
}
