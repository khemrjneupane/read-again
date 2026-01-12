'use client'

import {
  LucideBan,
  LucideCheckCircle,
  LucideShoppingCart,
  LucideXCircle,
  PlusCircleIcon,
  Tag,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/utilities/ui'
import { motion } from 'framer-motion'
import { Media } from '@/components/Media'
import { useCartStore } from '@/lib/useCartStore'
import { RootState } from '@/app/(frontend)/store'
import * as Tooltip from '@radix-ui/react-tooltip'
import type { Customer, Post } from '@/payload-types'
import { useDispatch, useSelector } from 'react-redux'
import { getUser } from '@/app/(frontend)/actions/getUser'
import useClickableCard from '@/utilities/useClickableCard'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import React, { Fragment, useEffect, useRef, useState } from 'react'
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline'
import { resetCartClicked, setCartClicked } from '@/app/(frontend)/store/slices/cartClickSlice'

export type CardPostData = Pick<
  Post,
  | 'slug'
  | 'categories'
  | 'meta'
  | 'title'
  | 'bookauthor'
  | 'id'
  | 'price'
  | 'originalPrice'
  | 'relatedPosts'
  | 'stock'
>

export const Card: React.FC<{
  alignItems?: 'center'
  className?: string
  doc?: CardPostData
  relationTo?: 'posts'
  showCategories?: boolean
  title?: string
  bookauthor: string
  relatedPosts?: (string | Post)[] | null
}> = (props) => {
  const { card, link } = useClickableCard({})
  const { className, doc, relationTo, showCategories, title: titleFromProps } = props

  const { slug, categories, meta, title, bookauthor, price, originalPrice, id } = doc || {}
  const { description, image: metaImage } = meta || {}
  const { addItem, hasItem, fetchCart, cart } = useCartStore()
  const clicked = useSelector((state: RootState) => state.cartClick.clicked)
  const [alreadyAdded, setAlreadyAdded] = useState(false)
  const hasCategories = categories && Array.isArray(categories) && categories.length > 0
  const titleToUse = titleFromProps || title
  const sanitizedDescription = description?.replace(/\s/g, ' ')
  const href = `/${relationTo}/${slug}`

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
  }
  const [loggedInUserEmail, setLoggedInUserEmail] = useState<string | undefined>()

  useEffect(() => {
    const getLoggedUser = async () => {
      const user = (await getUser()) as Customer
      if (user) {
        setLoggedInUserEmail(user.email)
      }
    }
    getLoggedUser()
  }, [])
  function useStopPropagation() {
    const buttonRef = useRef<HTMLButtonElement>(null)
    const divRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const stop = (e: MouseEvent) => e.stopPropagation()

      const button = buttonRef.current
      const div = divRef.current

      if (button) {
        button.addEventListener('mousedown', stop)
        button.addEventListener('mouseup', stop)
      }

      if (div) {
        div.addEventListener('mousedown', stop)
        div.addEventListener('mouseup', stop)
      }

      // Cleanup
      return () => {
        if (button) {
          button.removeEventListener('mousedown', stop)
          button.removeEventListener('mouseup', stop)
        }
        if (div) {
          div.removeEventListener('mousedown', stop)
          div.removeEventListener('mouseup', stop)
        }
      }
    }, [])

    return { buttonRef, divRef }
  }
  const { buttonRef, divRef } = useStopPropagation()
  const dispatch = useDispatch()

  useEffect(() => {
    const checkCart = async () => {
      if (!cart) {
        await fetchCart()
      }
      if (id) {
        if (hasItem(id)) {
          setAlreadyAdded(true)
        } else {
          setAlreadyAdded(false)
        }
      }
    }
    checkCart()
  }, [clicked, id])

  const handleAddToCart = async (bookId: string) => {
    dispatch(setCartClicked())
    const error = await addItem(bookId)

    if (error) {
      if (error === 'OUT_OF_STOCK') {
        toast.info('Item is out of stock!', {
          icon: <LucideXCircle className="text-brands-600 w-5 h-5" />,
        })
      } else if (error === 'ALREADY_IN_CART') {
        alert('Item already in cart!')
      } else if (error === 'USER_NOT_LOGGED_IN') {
        toast.warning('Please login!', {
          icon: <LucideBan className="text-brands-600 w-5 h-5" />,
        })
      }
    }

    setTimeout(() => {
      dispatch(resetCartClicked())
    }, 1000)
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()

    if (alreadyAdded) {
      toast.warning(<div className="text-brands-700">This item is already in your cart.</div>, {
        icon: <LucideCheckCircle className="text-brands-700 w-5 h-5" />,
      })
    } else if (id) {
      handleAddToCart(id)
    }
  }

  const LOCAL_KEY = 'favorites'

  const [isFavorited, setIsFavorited] = useState(false)

  const toggleFavorite = () => {
    try {
      if (!id || !loggedInUserEmail) {
        toast.warning(<div className="text-brands-700">Please login first.</div>, {
          icon: <LucideBan className="text-brands-700 w-5 h-5" />,
        })
        return
      }

      const stored = localStorage.getItem(LOCAL_KEY)
      const favorites: Record<string, string[]> = stored ? JSON.parse(stored) : {}

      const userFavorites = favorites[loggedInUserEmail] || []

      let updatedFavorites
      if (userFavorites.includes(id)) {
        updatedFavorites = {
          ...favorites,
          [loggedInUserEmail]: userFavorites.filter((itemId) => itemId !== id),
        }
        setIsFavorited(false)
      } else {
        updatedFavorites = {
          ...favorites,
          [loggedInUserEmail]: [...userFavorites, id],
        }
        setIsFavorited(true)
      }

      localStorage.setItem(LOCAL_KEY, JSON.stringify(updatedFavorites))
    } catch (err) {
      console.error('Error updating favorites in localStorage', err)
    }
  }

  useEffect(() => {
    try {
      if (!id || !loggedInUserEmail) return

      const stored = localStorage.getItem(LOCAL_KEY)
      if (stored) {
        const favorites: Record<string, string[]> = JSON.parse(stored)
        const userFavorites = favorites[loggedInUserEmail] || []
        setIsFavorited(userFavorites.includes(id))
      }
    } catch (err) {
      console.error('Error reading favorites from localStorage', err)
    }
  }, [id, loggedInUserEmail])

  return (
    <motion.div
      className="group relative flex flex-col rounded-xl ring-1 ring-brands-200 bg-white dark:bg-brands-950 shadow-sm hover:shadow-md transition duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Image area (fixed height) */}
      <Link
        href={href}
        ref={link.ref}
        className="relative w-full h-56 overflow-hidden rounded-t-xl bg-gray-100"
      >
        {metaImage ? (
          <Media
            resource={metaImage}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}

        {/* Price overlay */}
        <div className="absolute top-2 right-2 flex flex-col items-baseline space-y-1">
          {originalPrice && (
            <span className=" text-red-400/90 line-through bg-white/80 dark:bg-black/70 px-2 py-0.5 rounded-lg">
              {originalPrice}€
            </span>
          )}
          <span className="text-sm font-semibold bg-brands-600 text-white px-2 py-0.5 rounded-lg">
            {price}€
          </span>
        </div>
      </Link>

      {/* Content area (fixed min height for consistency) */}
      <div className="flex flex-col flex-grow p-3 min-h-[140px]">
        {/* Title */}
        {titleToUse && (
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[40px]">
            {titleToUse}
          </h3>
        )}

        {/* Author */}
        {bookauthor && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">{bookauthor}</p>
        )}

        {/* Categories */}
        {showCategories && hasCategories && (
          <div className="flex flex-wrap gap-1 mb-2">
            {categories?.map((cat, i) =>
              typeof cat === 'object' ? (
                <span
                  key={i}
                  className="text-[10px] uppercase bg-brands-100 dark:bg-brands-800 text-brands-700 dark:text-white px-1.5 py-0.5 rounded"
                >
                  {cat.title || 'Untitled'}
                </span>
              ) : null,
            )}
          </div>
        )}

        {/* Spacer to push buttons down consistently */}
        <div className="flex-grow" />

        {/* Action buttons */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-brands-800">
          {/* Favourite */}
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  ref={buttonRef}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleFavorite()
                  }}
                  className="p-1"
                >
                  {isFavorited ? (
                    <HeartSolid className="w-5 h-5 text-red-600" />
                  ) : (
                    <HeartOutline className="w-5 h-5 text-gray-500 hover:text-brands-600" />
                  )}
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="top"
                  className="p-1.5 rounded text-xs bg-black text-white dark:bg-white dark:text-black shadow-md z-50"
                >
                  {isFavorited ? 'Added to favourites' : 'Add to favourites'}
                  <Tooltip.Arrow className="dark:fill-white" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>

          {/* Add to cart */}
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  ref={buttonRef}
                  onClick={handleClick}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium transition-colors
                  ${
                    alreadyAdded
                      ? 'bg-brands-100 dark:bg-brands-800 text-gray-600 dark:text-white'
                      : 'bg-brands-600 hover:bg-brands-700 text-white'
                  }`}
                >
                  {alreadyAdded ? (
                    <>
                      <LucideCheckCircle className="w-4 h-4" />
                      Added
                    </>
                  ) : (
                    <>
                      <LucideShoppingCart className="w-4 h-4" />
                      Add
                    </>
                  )}
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="top"
                  className="p-1.5 rounded text-xs bg-black text-white dark:bg-white dark:text-black shadow-md z-50"
                >
                  {alreadyAdded ? 'Already in cart' : 'Add to cart'}
                  <Tooltip.Arrow className="dark:fill-white" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>
      </div>
    </motion.div>
  )
}
