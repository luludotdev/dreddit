import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

export const MIN_INTERVAL = 10

export type SubredditConfig = z.infer<typeof SubredditSchema>
export const SubredditSchema = z.object({
  subreddit: z.string().min(0),
  level: z.enum(['hot', 'new', 'rising', 'controversial', 'top']).optional(),

  webhooks: z.string().or(z.array(z.string())),
  interval: z.number().min(MIN_INTERVAL).optional(),

  allowNSFW: z.boolean().optional(),
  titles: z.boolean().optional(),
  urls: z.boolean().optional(),
})

export type Config = z.infer<typeof ConfigSchema>
export const ConfigSchema = z.object({
  $schema: z.string().min(1).optional(),
  interval: z.number().min(10),
  subreddits: z.array(SubredditSchema),
})

export const jsonSchema = zodToJsonSchema(ConfigSchema)
