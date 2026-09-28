import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { communityService } from '../services/communityService';
import { useCommunityVersion } from '../hooks/useServiceVersions';
import { CupCheckCard, CupCheckEmpty } from '../components/community/CupCheckCard';
import { NewPostSheet } from '../components/community/NewPostSheet';
import { CommentsSheet } from '../components/community/CommentsSheet';
import { LargeTitle } from '../components/common/LargeTitle';

interface CommunityViewProps {
  cafes: { id: string; name: string }[];
  authorName: string;
  authorHandle: string;
  onOpenCafe: (cafeId: string) => void;
}

/** Cup Check community feed: one-to-three column masonry of today's brews. */
export const CommunityView: React.FC<CommunityViewProps> = ({ cafes, authorName, authorHandle, onOpenCafe }) => {
  useCommunityVersion();
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  const posts = useMemo(() => communityService.getPosts(), []);
  const commentsPost = commentsPostId ? posts.find((post) => post.id === commentsPostId) ?? null : null;

  const totalLikes = useMemo(() => posts.reduce((sum, p) => sum + p.likes, 0), [posts]);
  const totalPins = useMemo(() => posts.reduce((sum, p) => sum + p.pins.length, 0), [posts]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-6 sm:pt-4 space-y-5">
      <LargeTitle
        title="Cup Check"
        subtitle={
          <span className="font-mono">
            {posts.length} brews, {totalPins} flavor pins, {totalLikes} likes
          </span>
        }
        trailing={
          <button
            onClick={() => setIsNewPostOpen(true)}
            aria-label="Post a Cup Check"
            className="h-11 w-11 -mr-1.5 flex items-center justify-center ios-press"
          >
            <span className="h-9 w-9 rounded-full bg-[#906D4B] text-[#FFFDF9] flex items-center justify-center hover:bg-[#7D5C3D] transition-colors">
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </span>
          </button>
        }
      />

      {posts.length === 0 ? (
        <CupCheckEmpty onNewPost={() => setIsNewPostOpen(true)} />
      ) : (
        <div className="columns-1 min-[480px]:columns-2 lg:columns-3 gap-3 sm:gap-4 [&>*]:mb-3 sm:[&>*]:mb-4">
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
