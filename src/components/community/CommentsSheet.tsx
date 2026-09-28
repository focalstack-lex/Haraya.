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
      <ModalHeader
        title="Comments"
        subtitle={`${post.comments.length} ${post.comments.length === 1 ? 'comment' : 'comments'}`}
        onClose={onClose}
      />
      <div className="px-4 sm:px-6 py-4 space-y-4">
        {post.comments.length === 0 ? (
          <p className="py-6 text-center text-[14px] font-sans text-[#594C3D]">No comments yet. Ask what grinder they used.</p>
        ) : (
          <ul className="ios-group !bg-[#766046]/[0.07]">
            {post.comments.map((comment) => (
              <li key={comment.id} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="ios-headline text-[#13191F] truncate">{comment.author}</span>
                  <span className="shrink-0 ios-footnote font-mono text-[#594C3D]">
                    {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-[14px] leading-[1.45] font-sans text-[#13191F]/85 mt-0.5">{comment.body}</p>
              </li>
            ))}
          </ul>
        )}

        {/* Composer */}
        <div className="space-y-2">
          <TextInput value={author} onChange={setAuthor} placeholder="Your name" />
          <div className="flex gap-2">
            <TextInput value={body} onChange={setBody} placeholder="Add a comment" />
            <button
              onClick={submit}
              className="h-11 px-4.5 shrink-0 rounded-full bg-[#906D4B] text-[#FFFDF9] text-[15px] font-semibold font-sans hover:bg-[#7D5C3D] ios-press"
            >
              Post
            </button>
          </div>
          {error && <p role="alert" className="px-1 ios-footnote text-[#8C3A2E]">{error}</p>}
        </div>
      </div>
    </Modal>
  );
};
