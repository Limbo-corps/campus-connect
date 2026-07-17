"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { User } from "@/types";
import {
  Card,
  Avatar,
  Chip,
  Skeleton,
  Separator,
  ProgressBar,
  Tooltip,
  EmptyState,
  Typography,
  Button,
  Breadcrumbs,
  Accordion,
} from "@heroui/react";
import {
  MapPin,
  Mail,
  BookOpen,
  Edit3,
  Heart,
  FileText,
  TrendingUp,
  Users,
  Award,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCampuses } from "@/hooks/useCampuses";
import PostCard from "@/components/posts/PostCard";
import CreatePostModal from "@/components/posts/CreatePostModal";
import EditProfileModal from "@/components/profile/EditProfileModal";
import FollowersModal from "@/components/profile/FollowersModal";
import FollowingModal from "@/components/profile/FollowingModal";
import { CAMPUS_HERO, IMG_FADE } from "@/lib/banners";
import { getTemplate } from "@/lib/templates";
import CampusEmblem from "@/components/campus/CampusEmblem";
import Link from "next/link";

import { getUserByUsername } from "@/lib/users/api";
import { useUserPosts } from "@/hooks/usePosts";

// Import your follow/following hooks and actions
import {
  useFollowers,
  useFollowing,
  followUser,
  unfollowUser,
} from "@/hooks/useFollow";

export default function GlobalProfilePage() {
  const params = useParams();
  const username = params?.username as string;

  const { user: currentUser } = useAuth();
  const { campuses } = useCampuses();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followStatusOverride, setFollowStatusOverride] = useState<{
    userId: string;
    value: boolean;
  } | null>(null);

  // Determine if the visitor owns this profile context
  const isOwnProfile =
    currentUser?.username?.toLowerCase() === username?.toLowerCase();

  // Fetch target dynamic profile if viewing someone else
  useEffect(() => {
    if (!username) return;

    if (isOwnProfile) {
      return;
    }

    let isMounted = true;
    async function loadTargetProfile() {
      try {
        setProfileError(null);
        const data = await getUserByUsername(username);
        if (isMounted) {
          setProfileUser(data);
        }
      } catch (err) {
        console.error("Error setting profile perspective:", err);
        if (isMounted) {
          setProfileError("Could not find student account.");
        }
      }
    }

    loadTargetProfile();

    return () => {
      isMounted = false;
    };
  }, [username, isOwnProfile]);

  // Context-aware target user model
  const viewedUser = isOwnProfile && currentUser ? currentUser : profileUser;

  // Real-time Follower and Following metrics for the viewed user profile
  const { followers, mutate: mutateFollowers } = useFollowers(viewedUser?.id);
  const { following } = useFollowing(viewedUser?.id);

  // Check relationship status from the current logged-in user's follow network
  const { following: myFollowingList, mutate: mutateMyFollowing } =
    useFollowing(currentUser?.id);

  // Determine if current user is currently following the viewed user
  const isFollowingFromServer = myFollowingList.some(
    (followedUser: User) => String(followedUser.id) === String(viewedUser?.id),
  );
  const matchingFollowOverride =
    followStatusOverride && followStatusOverride.userId === viewedUser?.id
      ? followStatusOverride
      : null;
  const isFollowing = matchingFollowOverride
    ? matchingFollowOverride.value
    : isFollowingFromServer;

  // Context-aware posts custom hook
  const {
    posts = [],
    loading: postsLoading,
    mutate: mutatePosts,
  } = useUserPosts(viewedUser ? String(viewedUser.id) : null);

  const template = getTemplate(viewedUser?.profile_template);
  const userCampus = campuses.find(
    (c) => c.id === String(viewedUser?.campus ?? ""),
  );

  const totalLikes = posts.reduce((acc, p) => acc + p.likes_count, 0);
  const mostLikedPost =
    posts.length > 0
      ? posts.reduce((a, b) => (a.likes_count > b.likes_count ? a : b))
      : null;

  const initials = viewedUser
    ? `${viewedUser.first_name?.[0] ?? ""}${viewedUser.last_name?.[0] ?? ""}`.toUpperCase() ||
      viewedUser.username[0].toUpperCase()
    : "?";

  // ── Follower / Following Action Handlers with Cache Mutation ──

  const handleFollow = async () => {
    if (!viewedUser?.id || followLoading) return;
    setFollowLoading(true);

    try {
      await followUser(viewedUser.id);

      // Revalidate cache feeds to keep client visual states instantly updated
      setFollowStatusOverride({ userId: viewedUser.id, value: true });
      await Promise.all([
        mutateMyFollowing(), // Updates current user's "following" list
        mutateFollowers(), // Updates viewed user's "followers" count visually
      ]);
    } catch (err) {
      console.error("Failed to follow target user:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!viewedUser?.id || followLoading) return;
    setFollowLoading(true);

    try {
      await unfollowUser(viewedUser.id);

      // Revalidate cache feeds to keep client visual states instantly updated
      setFollowStatusOverride({ userId: viewedUser.id, value: false });
      await Promise.all([mutateMyFollowing(), mutateFollowers()]);
    } catch (err) {
      console.error("Failed to unfollow target user:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const openFollowersModal = () => {
    setFollowersOpen(true);
  };

  const openFollowingModal = () => {
    setFollowingOpen(true);
  };

  const completionSteps = [
    {
      done: !!(viewedUser?.first_name && viewedUser?.last_name),
      label: "Full name",
    },
    { done: !!viewedUser?.bio, label: "Bio" },
    { done: !!viewedUser?.email, label: "Email" },
    { done: !!userCampus, label: "Campus" },
    { done: posts.length > 0, label: "First post" },
  ];
  const completionPct = Math.round(
    (completionSteps.filter((s) => s.done).length / completionSteps.length) *
      100,
  );

  const BADGES = [
    {
      emoji: "🎓",
      label: "Student",
      desc: "Joined Campus Connect",
      unlocked: true,
    },
    {
      emoji: "✍️",
      label: "Author",
      desc: "Created first post",
      unlocked: posts.length > 0,
    },
    {
      emoji: "❤️",
      label: "Liked",
      desc: "Received first like",
      unlocked: totalLikes > 0,
    },
    {
      emoji: "🏛️",
      label: "Campus",
      desc: "Joined a campus",
      unlocked: !!userCampus,
    },
    {
      emoji: "🔥",
      label: "Trending",
      desc: "Received 10+ likes total",
      unlocked: totalLikes >= 10,
    },
  ];

  if (!viewedUser && !profileError) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto p-4">
        <Skeleton className="h-6 w-48 rounded" />
        <Card className="h-64 w-full rounded-2xl">
          <Card.Content />
        </Card>
      </div>
    );
  }

  if (profileError || !viewedUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
        <Typography.Heading level={3} className="text-danger">
          Profile Missing
        </Typography.Heading>
        <Typography.Paragraph size="sm" color="muted" className="mt-2">
          {profileError ||
            "The target campus classmate account could not be located or has been deactivated."}
        </Typography.Paragraph>
        <Link href="/feed" className="mt-4">
          <Button
            size="sm"
            className="bg-[--accent] text-[--accent-foreground]"
          >
            Return to Feed
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-1">
      {/* Breadcrumbs */}
      <Breadcrumbs>
        <Breadcrumbs.Item href="/feed">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/search">Directory</Breadcrumbs.Item>
        <Breadcrumbs.Item>{viewedUser.username}</Breadcrumbs.Item>
      </Breadcrumbs>

      <div className="grid grid-cols-12 gap-4">
        {/* ── Main column ── */}
        <div className="col-span-12 space-y-4 lg:col-span-8">
          {/* Profile card */}
          <Card className="border border-[--surface-secondary] shadow-sm">
            <div
              className="relative h-36 overflow-hidden rounded-t-3xl bg-cover bg-center"
              style={{
                backgroundImage: `${IMG_FADE}, url('${template.banner}')`,
              }}
            />

            <Card.Content className="relative pb-5">
              <div className="-mt-12 flex items-end justify-between">
                <div className="relative">
                  <Avatar
                    color="accent"
                    className="size-20 ring-4 ring-[--surface] shadow-xl"
                  >
                    {viewedUser.avatar_url ? (
                      <Avatar.Image
                        src={viewedUser.avatar_url}
                        alt={viewedUser.username ?? ""}
                      />
                    ) : (
                      <Avatar.Fallback className="text-3xl font-extrabold">
                        {initials}
                      </Avatar.Fallback>
                    )}
                  </Avatar>
                  <span className="absolute bottom-1.5 right-1.5 h-3.5 w-3.5 rounded-full border-2 border-[--surface] bg-emerald-500 shadow-sm" />
                </div>

                {/* Dynamic context-aware profile actions */}
                <div className="flex gap-2 mb-1">
                  {isOwnProfile ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => setEditOpen(true)}
                      className="gap-1.5 rounded-full border-[--surface-secondary] text-xs font-semibold"
                    >
                      <Edit3 size={12} />
                      Edit profile
                    </Button>
                  ) : (
                    <>
                      {isFollowing ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onPress={handleUnfollow}
                          isPending={followLoading}
                          className="gap-1.5 rounded-full text-xs font-semibold"
                        >
                          <UserCheck size={12} />
                          Following
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onPress={handleFollow}
                          isPending={followLoading}
                          className="gap-1.5 rounded-full text-xs font-semibold"
                        >
                          <UserPlus size={12} />
                          Follow
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Name + meta */}
              <div className="mt-3">
                <Typography.Heading
                  level={2}
                  weight="bold"
                  className="text-[--foreground]"
                >
                  {viewedUser.first_name} {viewedUser.last_name}
                </Typography.Heading>
                <Typography.Paragraph
                  size="sm"
                  color="muted"
                  className="mt-0.5"
                >
                  @{viewedUser.username}
                </Typography.Paragraph>
                {viewedUser.tagline && (
                  <p className="mt-1.5 text-sm font-medium text-[--foreground]">
                    {viewedUser.tagline}
                  </p>
                )}
              </div>

              {/* About accordion */}
              <Accordion variant="default" hideSeparator className="mt-2">
                <Accordion.Item id="about">
                  <Accordion.Heading>
                    <Accordion.Trigger className="py-1.5 text-xs font-semibold text-[--muted]">
                      About
                      <Accordion.Indicator />
                    </Accordion.Trigger>
                  </Accordion.Heading>
                  <Accordion.Panel>
                    <Accordion.Body className="pb-2 pt-0">
                      {viewedUser.bio ? (
                        <Typography.Paragraph
                          size="sm"
                          className="leading-relaxed text-[--foreground]"
                        >
                          {viewedUser.bio}
                        </Typography.Paragraph>
                      ) : (
                        <Typography.Paragraph
                          size="sm"
                          className="italic text-[--muted]"
                        >
                          No bio summary listed yet.
                        </Typography.Paragraph>
                      )}
                    </Accordion.Body>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {userCampus && (
                  <span className="flex items-center gap-1.5 text-xs text-[--muted]">
                    <BookOpen size={13} className="text-[--accent]" />
                    {userCampus.name}
                    {userCampus.city ? ` · ${userCampus.city}` : ""}
                  </span>
                )}
                {viewedUser.email && (
                  <span className="flex items-center gap-1.5 text-xs text-[--muted]">
                    <Mail size={13} />
                    {viewedUser.email}
                  </span>
                )}
              </div>

              <Separator className="my-4" />

              {/* Enhanced Stats with Actual Follow hook lengths */}
              <div className="flex divide-x divide-[--surface-secondary]">
                {[
                  {
                    icon: FileText,
                    label: "Posts",
                    value: posts.length,
                    color: "text-violet-400",
                    onClick: undefined,
                  },
                  {
                    icon: Users,
                    label: "Followers",
                    value: followers.length,
                    color: "text-blue-400",
                    onClick: openFollowersModal,
                  },
                  {
                    icon: Users,
                    label: "Following",
                    value: following.length,
                    color: "text-indigo-400",
                    onClick: openFollowingModal,
                  },
                  {
                    icon: Heart,
                    label: "Likes",
                    value: totalLikes,
                    color: "text-rose-400",
                    onClick: undefined,
                  },
                ].map(({ icon: Icon, label, value, color, onClick }) => {
                  const Container = onClick ? "button" : "div";
                  return (
                    <Container
                      key={label}
                      onClick={onClick}
                      className={`flex flex-1 flex-col items-center gap-1 px-4 first:pl-0 last:pr-0 outline-none transition-opacity ${
                        onClick ? "cursor-pointer hover:opacity-80" : ""
                      }`}
                    >
                      <Icon size={16} className={color} />
                      <span className="text-xl font-bold text-[--foreground]">
                        {value}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-[--muted]">
                        {label}
                      </span>
                    </Container>
                  );
                })}
              </div>

              <Separator className="my-4" />

              {/* Profile strength */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Typography.Paragraph
                    size="xs"
                    weight="medium"
                    className="text-[--foreground]"
                  >
                    {isOwnProfile ? "Profile strength" : "Completion Track"}
                  </Typography.Paragraph>
                  <Chip
                    size="sm"
                    variant="soft"
                    color={
                      completionPct === 100
                        ? "success"
                        : completionPct >= 60
                          ? "warning"
                          : "default"
                    }
                  >
                    {completionPct}%
                  </Chip>
                </div>
                <ProgressBar
                  value={completionPct}
                  aria-label="Profile strength"
                  color={completionPct === 100 ? "success" : "accent"}
                >
                  <ProgressBar.Track>
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
              </div>
            </Card.Content>
          </Card>

          {/* Create dynamic posts stream contextually */}
          {isOwnProfile && <CreatePostModal onSuccess={mutatePosts} />}

          {/* Activity stream */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Typography.Heading
                level={3}
                weight="semibold"
                className="text-[--foreground]"
              >
                Activity
              </Typography.Heading>
              <Chip size="sm" variant="soft" color="accent">
                {posts.length} posts
              </Chip>
            </div>

            {postsLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Card
                  key={i}
                  className="mb-3 border border-[--surface-secondary]"
                >
                  <Card.Content className="space-y-3 p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-32 rounded" />
                        <Skeleton className="h-2.5 w-20 rounded" />
                      </div>
                    </div>
                    <Skeleton className="h-12 w-full rounded" />
                  </Card.Content>
                </Card>
              ))
            ) : posts.length === 0 ? (
              <EmptyState className="flex flex-col items-center rounded-xl border border-dashed border-[--surface-secondary] bg-[--surface] py-14 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[--surface-secondary]">
                  <TrendingUp size={22} className="text-[--muted]" />
                </div>
                <Typography.Heading level={4} className="text-[--foreground]">
                  No timeline activity
                </Typography.Heading>
                <Typography.Paragraph size="sm" color="muted" className="mt-1">
                  This user hasn&apos;t published updates on the network feed
                  yet.
                </Typography.Paragraph>
              </EmptyState>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} onMutate={mutatePosts} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="sticky top-20 space-y-3">
            {/* Campus metrics widget */}
            {userCampus ? (
              <Card className="border border-[--surface-secondary] shadow-sm">
                <div
                  className="h-12 rounded-t-3xl bg-cover bg-center"
                  style={{
                    backgroundImage: `${IMG_FADE}, url('${CAMPUS_HERO}')`,
                  }}
                />
                <Card.Header className="gap-1 pt-3">
                  <div className="flex items-start justify-between">
                    <CampusEmblem
                      campus={userCampus}
                      className="size-11 rounded-lg"
                      textClassName="text-lg"
                    />
                    <Chip size="sm" color="success" variant="soft">
                      Member
                    </Chip>
                  </div>
                  <Card.Title className="mt-1 font-bold">
                    {userCampus.name}
                  </Card.Title>
                  {(userCampus.city || userCampus.state) && (
                    <Card.Description className="flex items-center gap-1 text-xs">
                      <MapPin size={11} />
                      {[userCampus.city, userCampus.state]
                        .filter(Boolean)
                        .join(", ")}
                    </Card.Description>
                  )}
                </Card.Header>
                <Card.Footer className="border-t border-[--surface-secondary] pt-3">
                  <Users size={12} className="mr-1.5 text-[--muted]" />
                  <span className="text-xs text-[--muted]">
                    {userCampus.students_count.toLocaleString()} students
                  </span>
                </Card.Footer>
              </Card>
            ) : (
              <Card className="border border-dashed border-[--surface-secondary] shadow-sm">
                <Card.Header className="items-center text-center">
                  <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-[--surface-secondary]">
                    <BookOpen size={22} className="text-[--muted]" />
                  </div>
                  <Card.Title>No campus</Card.Title>
                </Card.Header>
              </Card>
            )}

            {/* Badges */}
            <Card className="border border-[--surface-secondary] shadow-sm">
              <Card.Header className="pb-1">
                <Card.Title className="text-xs uppercase tracking-wider text-[--muted]">
                  Badges
                </Card.Title>
              </Card.Header>
              <Card.Content className="pt-1">
                <div className="grid grid-cols-5 gap-1.5">
                  {BADGES.map(({ emoji, label, desc, unlocked }) => (
                    <Tooltip key={label}>
                      <Tooltip.Trigger>
                        <div
                          className={`flex cursor-default flex-col items-center gap-1 rounded-xl border p-2 text-center transition-all ${
                            unlocked
                              ? "border-[--accent]/30 bg-[--accent]/8"
                              : "border-[--surface-secondary] opacity-35 grayscale"
                          }`}
                        >
                          <span className="text-xl leading-none">{emoji}</span>
                          <span className="text-[8px] font-semibold leading-tight text-[--muted]">
                            {label}
                          </span>
                        </div>
                      </Tooltip.Trigger>
                      <Tooltip.Content showArrow>
                        <Typography.Paragraph size="xs">
                          {unlocked ? `✓ ${desc}` : `🔒 ${desc}`}
                        </Typography.Paragraph>
                      </Tooltip.Content>
                    </Tooltip>
                  ))}
                </div>
              </Card.Content>
            </Card>

            {/* Highlights */}
            {posts.length > 0 && (
              <Card className="border border-[--surface-secondary] shadow-sm">
                <Card.Header className="pb-1">
                  <Card.Title className="text-xs uppercase tracking-wider text-[--muted]">
                    Highlights
                  </Card.Title>
                </Card.Header>
                <Card.Content className="space-y-3 pt-1">
                  {mostLikedPost && (
                    <div className="flex gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30">
                        <Heart size={14} className="text-rose-500" />
                      </div>
                      <div className="min-w-0">
                        <Typography.Paragraph
                          size="xs"
                          weight="medium"
                          className="text-[--foreground]"
                        >
                          Top Performance
                        </Typography.Paragraph>
                        <Typography.Paragraph
                          size="xs"
                          color="muted"
                          className="mt-0.5 line-clamp-2 leading-relaxed"
                        >
                          {mostLikedPost.content}
                        </Typography.Paragraph>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/30">
                      <Award size={14} className="text-pink-500" />
                    </div>
                    <div>
                      <Typography.Paragraph
                        size="xs"
                        weight="medium"
                        className="text-[--foreground]"
                      >
                        Total engagement
                      </Typography.Paragraph>
                      <Typography.Paragraph size="xs" color="muted">
                        {totalLikes} engagement reactions
                      </Typography.Paragraph>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            )}
          </div>
        </aside>
      </div>

      {/* Profile Modification Modals */}
      {isOwnProfile && (
        <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
      )}

      {/* Network Modals */}
      {viewedUser?.id && (
        <>
          <FollowersModal
            isOpen={followersOpen}
            onOpenChange={setFollowersOpen}
            userId={viewedUser.id}
          />
          <FollowingModal
            isOpen={followingOpen}
            onOpenChange={setFollowingOpen}
            userId={viewedUser.id}
          />
        </>
      )}
    </div>
  );
}
