import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  fields: [
    {
      name: 'addedDate',
      type: 'date',
      admin: {
        readOnly: true,
      },
      defaultValue: () => new Date(),
    },
    {
      name: 'alt',
      type: 'text',
      defaultValue: ({ req }) => {
        const filename = (req.body as any)?.filename
        return filename ? filename.replace(/\.[^/.]+$/, '') : 'Default alt text'
      },
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
    {
      name: 'poster',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        condition: (data, siblingData) => {
          return siblingData?.mimeType?.startsWith?.('video/')
        },
      },
    },
  ],
  upload: {
    mimeTypes: ['image/*', 'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],

    adminThumbnail: ({
      doc,
    }: {
      doc: { mimeType?: string; sizes?: { thumbnail?: { url?: string } } }
    }) => {
      if (doc.mimeType?.startsWith('video/')) {
        return '/media/youtube.png' // placeholder image
      }
      return doc.sizes?.thumbnail?.url ?? null
    },

    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
      {
        name: 'square',
        width: 500,
        height: 500,
      },
      {
        name: 'small',
        width: 600,
      },
      {
        name: 'medium',
        width: 900,
      },
      {
        name: 'large',
        width: 1400,
      },
      {
        name: 'xlarge',
        width: 1920,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
      },
    ],
  },
}
