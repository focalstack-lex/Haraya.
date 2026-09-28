import React from 'react';
import { Heart, MessageCircle, Plus } from 'lucide-react';
import type { CupPost } from '../../types/coffee';
import { communityService } from '../../services/communityService';
import { useCommunityVersion } from '../../hooks/useServiceVersions';
import { catalogService } from '../../services/catalogService';

interface CupCheckCardProps {
  post: CupPost;
  onOpenComments: (postId: string) => void;
  onOpenCafe?: (cafeId: string) => void;
}

/** Community cup post: photo with floating tasting-tag pins, brew method, likes. */
export const CupCheckCard: React.FC<CupCheckCardProps> = ({ post, onOpenComments, onOpenCafe }) => {
  useCommunityVersion();
  const liked = communityService.isLiked(post.id);
  const cafe = post.cafeId ? catalogService.getCafeById(post.cafeId) : undefined;

  const likeCount = post.likes + (liked ? 1 : 0);

  return (
    <article className="card-ambient bg-[#FFFDF9] rounded-[20px] overflow-hidden break-inside-avoid">
      {/* Author row */}
      <header className="flex items-center justify-between gap-2 px-3.5 pt-3 pb-2.5">
        <div className="min-w-0">
          <span className="ios-headline text-[#13191F] truncate block">{post.author}</span>
          <span className="ios-footnote text-[#594C3D] truncate block">
            @{post.authorHandle}
            {cafe && onOpenCafe ? (
              <>
                {' at '}
                <button onClick={() => onOpenCafe(cafe.id)} className="font-medium text-[#7D5C3D] hover:underline underline-offset-2">
                  {cafe.name}
                </button>
              </>
            ) : cafe ? (
              ` at ${cafe.name}`
            ) : null}
          </span>
        </div>
        {post.brewMethod && (
          <span className="shrink-0 h-6 px-2.5 rounded-full ios-fill text-[11px] font-medium font-sans text-[#594C3D] flex items-center">
            {post.brewMethod}
          </span>
        )}
      </header>

      <div className="relative aspect-[4/5] bg-[#13191F] overflow-hidden">
        <img src={post.image} alt={`${post.author}'s cup`} loading="lazy" className="w-full h-full object-cover" />

        {/* Floating tasting tag pins */}
        {post.pins.map((pin) => (
          <span
            key={pin.id}
            className="flavor-pin absolute -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full ios-material-dark text-[11px] font-semibold font-sans text-[#FFFDF9] whitespace-nowrap cursor-default"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            title={`Tasting note: ${pin.label}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#FFFDF9] shrink-0" aria-hidden="true" />
            {pin.label}
          </span>
        ))}
      </div>

      {/* Action row: icon buttons on 44px targets */}
      <div className="flex items-center px-1.5 pt-1">
        <button
          onClick={() => communityService.toggleLike(post.id)}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike post' : 'Like post'}
          className="h-11 min-w-11 px-2 inline-flex items-center justify-center gap-1.5 ios-press active:scale-90"
        >
          <Heart
            className={`w-6 h-6 transition-colors ${liked ? 'fill-[#906D4B] text-[#906D4B]' : 'text-[#13191F]'}`}
            strokeWidth={1.75}
          />
          <span className="text-[14px] font-semibold font-mono text-[#13191F]">{likeCount}</span>
        </button>
        <button
          onClick={() => onOpenComments(post.id)}
          aria-label={`Comments, ${post.comments.length}`}
          className="h-11 min-w-11 px-2 inline-flex items-center justify-center gap-1.5 ios-press"
        >
          <MessageCircle className="w-6 h-6 text-[#13191F]" strokeWidth={1.75} />
          <span className="text-[14px] font-semibold font-mono text-[#13191F]">{post.comments.length}</span>
        </button>
        <span className="ml-auto pr-2 ios-footnote text-[#594C3D] font-mono">
          {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      </div>

      <p className="px-3.5 pb-3.5 text-[14px] leading-[1.45] font-sans text-[#13191F]/85 line-clamp-3">{post.caption}</p>
    </article>
  );
};

/** Empty state for the community feed with a compose shortcut. */
export const CupCheckEmpty: React.FC<{ onNewPost: () => void }> = ({ onNewPost }) => (
  <div className="py-16 text-center space-y-2">
    <h3 className="ios-title text-[19px]">No cups checked yet today</h3>
    <p className="text-[14px] font-sans text-[#594C3D] max-w-sm mx-auto">
      Be the first to post a brew. Pin your tasting notes right on the photo.
    </p>
    <button
      onClick={onNewPost}
      className="mt-2 h-11 px-5 rounded-full bg-[#906D4B] text-[#FFFDF9] text-[15px] font-semibold font-sans inline-flex items-center gap-1.5 hover:bg-[#7D5C3D] ios-press"
    >
      <Plus className="w-4.5 h-4.5" strokeWidth={2.5} />
      Post a Cup Check
    </button>
  </div>
);
