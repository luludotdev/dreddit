export type SortLevel = 'hot' | 'new' | 'rising' | 'controversial' | 'top'

export interface IPost {
  id: string
  title: string
  source: string

  url: string
  nsfw: boolean
}

export interface IResponse {
  kind: 'Listing'

  data: {
    modhash: string
    dist: number

    children: Array<{
      kind: 't3'
      data: {
        subreddit: string
        id: string
        url: string
        title: string
        permalink: string
        over_18: boolean
      }
    }>

    after: string | null
    before: string | null
  }
}
