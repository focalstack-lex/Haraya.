import React, { useState } from 'react';
import type { CupPost } from '../../types/coffee';
import { communityService } from '../../services/communityService';
import { useCommunityVersion } from '../../hooks/useServiceVersions';
import { Modal, ModalHeader, TextInput } from '../common/FormControls';

interface CommentsSheetProps {
  post: CupPost | null;
  onClose: () => void;
}

/** Comments for a cup post; seed posts are read-only, browser posts are live. */
export const CommentsSheet: React.FC<CommentsSheetProps> = ({ post, onClose }) => {
  useCommunityVersion();
  const [author, setAuthor] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  if (!post) return null;

  const submit = () => {
    try {
      communityService.addComment(post.id, author, body);
      setBody('');
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not post the comment.');
    }
  };

  return (
    <Modal isOpen={Boolean(post)} onClose={onClose} maxWidth="sm:max-w-md" labelledBy="comments-title">
      <ModalHeader title="Cup Talk" subtitle={`${post.comments.length} comments`} onClose={onClose} />
      <div className="px-4 sm:px-6 py-4 space-y-3">
        {post.comments.length === 0 && (
          <p className="text-xs font-sans text-[#55615D]">No comments yet. Ask what grinder they used.</p>
        )}
        {post.comments.map((comment) => (
          <div key={comment.id} className="rounded-xl bg-[#F3ECD8] border border-[#E6DCC0] px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-sans font-bold text-[#1A2225]">{comment.author}</span>
              <span className="text-[10px] font-sans text-[#55615D]">
                {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <p className="text-xs font-sans text-[#1A2225]/85 mt-1 leading-relaxed">{comment.body}</p>
          </div>
        ))}

        <div className="space-y-2 pt-2 border-t border-[#E6DCC0]">
          <TextInput value={author} onChange={setAuthor} placeholder="Your name" />
          <div className="flex gap-2">
            <TextInput value={body} onChange={setBody} placeholder="Add a comment" />
            <button
              onClick={submit}
              className="h-10 px-4 shrink-0 rounded-full bg-[#1A2225] text-[#FFF9E9] text-xs font-bold font-sans hover:bg-[#26302F] transition-colors"
            >
              Post
            </button>
          </div>
          {error && <p className="text-[11px] font-sans text-[#8C3A2E]">{error}</p>}
        </div>
      </div>
    </Modal>
  );
};
