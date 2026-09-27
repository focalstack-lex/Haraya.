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

  return (
    <article className="bg-[#FFF9E9] border border-[#E6DCC0] rounded-2xl overflow-hidden shadow-sm">
      <div className="relative aspect-[4/5] bg-[#1A2225]">
        <img src={post.image} alt={`${post.author}'s cup`} loading="lazy" className="w-full h-full object-cover" />

        {/* Floating tasting tag pins */}
        {post.pins.map((pin) => (
          <span
            key={pin.id}
            className="flavor-pin absolute -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-[#1A2225]/85 border border-[#FFF9E9]/30 text-[10px] font-bold font-sans text-[#FFF9E9] whitespace-nowrap"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            title={`Tasting note: ${pin.label}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#C86428]" />
            {pin.label}
          </span>
        ))}
      </div>

      <div className="p-3 sm:p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-sm font-sans font-bold text-[#1A2225] truncate block">{post.author}</span>
            <span className="text-[10px] font-sans text-[#55615D] truncate block">
              @{post.authorHandle}
              {cafe && onOpenCafe ? (
                <>
                  {' at '}
                  <button onClick={() => onOpenCafe(cafe.id)} className="font-bold text-[#C86428] hover:underline">
                    {cafe.name}
                  </button>
                </>
              ) : cafe ? (
                ` at ${cafe.name}`
              ) : null}
            </span>
          </div>
          {post.brewMethod && (
            <span className="shrink-0 h-6 px-2 rounded-full bg-[#F3ECD8] border border-[#E6DCC0] text-[9px] font-bold font-sans text-[#55615D] flex items-center tracking-wide">
              {post.brewMethod}
            </span>
          )}
        </div>

        <p className="text-xs font-sans text-[#1A2225]/85 leading-relaxed line-clamp-3">{post.caption}</p>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => communityService.toggleLike(post.id)}
            aria-pressed={liked}
            aria-label={liked ? 'Unlike post' : 'Like post'}
            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[11px] font-bold font-sans border transition-colors ${
              liked ? 'bg-[#C86428] border-[#C86428] text-[#FFF9E9]' : 'border-[#E6DCC0] text-[#1A2225] hover:bg-[#F3ECD8]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
            {post.likes + (liked ? 1 : 0)}
          </button>
          <button
            onClick={() => onOpenComments(post.id)}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[11px] font-bold font-sans border border-[#E6DCC0] text-[#1A2225] hover:bg-[#F3ECD8] transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {post.comments.length}
          </button>
          <span className="ml-auto text-[10px] font-sans text-[#55615D]">
            {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </article>
  );
};

/** Small helper badge shown in the view header. */
export const CupCheckEmpty: React.FC<{ onNewPost: () => void }> = ({ onNewPost }) => (
  <div className="py-16 text-center space-y-3">
    <h3 className="font-cooper text-xl font-bold text-[#1A2225]">No cups checked yet today</h3>
    <p className="text-sm font-sans text-[#55615D] max-w-sm mx-auto">
      Be the first to post a brew. Pin your tasting notes right on the photo.
    </p>
    <button
      onClick={onNewPost}
      className="h-10 px-5 rounded-full bg-[#1A2225] text-[#FFF9E9] text-xs font-bold font-sans inline-flex items-center gap-2"
    >
      <Plus className="w-4 h-4" />
      Post a Cup Check
    </button>
  </div>
);
