import type { CupPost, FlavorPin, PostComment, BrewMethod } from '../types/coffee';
import { mockPosts } from '../data/mockPosts';

/**
 * Cup Check community layer: seed posts merged with browser-created posts,
 * likes, and comments. Likes are stored per browser (no accounts needed to
 * double-tap a cup).
 */

const KEYS = {
  POSTS: 'haraya_community_posts',
  LIKES: 'haraya_community_likes',
} as const;

export interface NewPostInput {
  author: string;
  authorHandle: string;
  cafeId: string | null;
  caption: string;
  image: string;
  pins: FlavorPin[];
  brewMethod: BrewMethod | null;
}

const listeners = new Set<() => void>();
let version = 0;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function notify(): void {
  version += 1;
  listeners.forEach((listener) => listener());
}

function makePostId(): string {
  return `post-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export const communityService = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getVersion(): number {
    return version;
  },

  getPosts(): CupPost[] {
    const custom = readJson<CupPost[]>(KEYS.POSTS, []);
    return [...custom, ...mockPosts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getPostById(id: string): CupPost | undefined {
    return this.getPosts().find((post) => post.id === id);
  },

  createPost(input: NewPostInput): CupPost {
    if (!input.caption.trim()) throw new Error('A caption is required.');
    if (!input.image) throw new Error('Attach a cup photo before posting.');
    if (input.pins.length === 0) throw new Error('Pin at least one tasting tag on the photo.');

    const post: CupPost = {
      ...input,
      caption: input.caption.trim().slice(0, 280),
      author: input.author.trim() || 'Anonymous Cupper',
      id: makePostId(),
      likes: 0,
      comments: [],
      createdAt: new Date().toISOString(),
    };
    const custom = readJson<CupPost[]>(KEYS.POSTS, []);
    custom.unshift(post);
    writeJson(KEYS.POSTS, custom);
    notify();
    return post;
  },

  removePost(postId: string): void {
    writeJson(KEYS.POSTS, readJson<CupPost[]>(KEYS.POSTS, []).filter((post) => post.id !== postId));
    notify();
  },

  getLikedIds(): string[] {
    return readJson<string[]>(KEYS.LIKES, []);
  },

  isLiked(postId: string): boolean {
    return this.getLikedIds().includes(postId);
  },

  toggleLike(postId: string): boolean {
    const liked = this.getLikedIds();
    const index = liked.indexOf(postId);
    let nowLiked: boolean;
    if (index === -1) {
      liked.push(postId);
      nowLiked = true;
    } else {
      liked.splice(index, 1);
      nowLiked = false;
    }
    writeJson(KEYS.LIKES, liked);
    notify();
    return nowLiked;
  },

  addComment(postId: string, author: string, body: string): PostComment {
    const trimmed = body.trim();
    if (!trimmed) throw new Error('Comment cannot be empty.');
    const comment: PostComment = {
      id: `cmt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      author: author.trim() || 'Anonymous Cupper',
      body: trimmed.slice(0, 240),
      createdAt: new Date().toISOString(),
    };
    const custom = readJson<CupPost[]>(KEYS.POSTS, []);
    const index = custom.findIndex((post) => post.id === postId);
    if (index === -1) {
      throw new Error('Comments on seed posts are read-only in this demo.');
    }
    custom[index] = { ...custom[index], comments: [...custom[index].comments, comment] };
    writeJson(KEYS.POSTS, custom);
    notify();
    return comment;
  },
};
