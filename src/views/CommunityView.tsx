import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { communityService } from '../services/communityService';
import { useCommunityVersion } from '../hooks/useServiceVersions';
import { CupCheckCard, CupCheckEmpty } from '../components/community/CupCheckCard';
import { NewPostSheet } from '../components/community/NewPostSheet';
import { CommentsSheet } from '../components/community/CommentsSheet';

interface CommunityViewProps {
  cafes: { id: string; name: string }[];
  authorName: string;
  authorHandle: string;
  onOpenCafe: (cafeId: string) => void;
}

/** Cup Check community feed: two-to-three column masonry of today's brews. */
export const CommunityView: React.FC<CommunityViewProps> = ({ cafes, authorName, authorHandle, onOpenCafe }) => {
  useCommunityVersion();
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  const posts = useMemo(() => communityService.getPosts(), []);
  const commentsPost = commentsPostId ? posts.find((post) => post.id === commentsPostId) ?? null : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
      <div className="relative overflow-hidden bg-[#1A2225] text-[#FFF9E9] p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-xl space-y-2">
        <h1 className="font-cooper text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Cup Check, Davao</h1>
        <p className="text-xs sm:text-sm lg:text-base text-[#FFF9E9]/75 max-w-2xl font-sans leading-relaxed">
          Daily brews, latte art, and cafe aesthetics from local cuppers. Tap a pin on any photo to read the
          tasting tag, or post your own cup and pin your notes.
        </p>
        <button
          onClick={() => setIsNewPostOpen(true)}
          className="h-10 px-5 rounded-full bg-[#FFF9E9] text-[#1A2225] text-xs font-bold font-sans inline-flex items-center gap-2 hover:bg-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Post a Cup Check
        </button>
      </div>

      {posts.length === 0 ? (
        <CupCheckEmpty onNewPost={() => setIsNewPostOpen(true)} />
      ) : (
        <div className="columns-2 lg:columns-3 gap-3 [&>*]:mb-3">
          {posts.map((post) => (
            <CupCheckCard key={post.id} post={post} onOpenComments={setCommentsPostId} onOpenCafe={onOpenCafe} />
          ))}
        </div>
      )}

      <NewPostSheet
        isOpen={isNewPostOpen}
        onClose={() => setIsNewPostOpen(false)}
        cafes={cafes}
        author={authorName}
        authorHandle={authorHandle}
        onPosted={() => setIsNewPostOpen(false)}
      />

      <CommentsSheet post={commentsPost} onClose={() => setCommentsPostId(null)} />
    </div>
  );
};
