'use client'

import { use } from 'react'
import Link from 'next/link'
import { Breadcrumbs, Skeleton, EmptyState, Typography, Button } from '@heroui/react'
import { ArrowLeft } from 'lucide-react'
import { usePost } from '@/hooks/usePosts'
import PostCard from '@/components/posts/PostCard'

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { post, loading, mutate } = usePost(id)

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Breadcrumbs>
        <Breadcrumbs.Item href="/feed">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item>Post</Breadcrumbs.Item>
      </Breadcrumbs>

      <Link
        href="/feed"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[--muted] transition-colors hover:text-[--foreground]"
      >
        <ArrowLeft size={15} /> Back to feed
      </Link>

      {loading ? (
        <div className="space-y-3 rounded-lg border border-[--surface-secondary] bg-[--surface] p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-2.5 w-16 rounded" />
            </div>
          </div>
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
      ) : !post ? (
        <EmptyState className="flex flex-col items-center rounded-lg border border-dashed border-[--surface-secondary] bg-[--surface] py-16 text-center">
          <Typography.Heading level={4} className="text-[--foreground]">Post not found</Typography.Heading>
          <Typography.Paragraph size="sm" color="muted" className="mt-1">
            This post may have been deleted.
          </Typography.Paragraph>
          <Button size="sm" className="mt-4 bg-[--accent] text-[--accent-foreground]" onPress={() => { window.location.href = '/feed' }}>
            Go to feed
          </Button>
        </EmptyState>
      ) : (
        <PostCard post={post} onMutate={mutate} detail />
      )}
    </div>
  )
}
