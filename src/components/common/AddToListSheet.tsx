import React, { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { userPrefsService } from '../../services/userPrefsService';
import { usePrefsVersion } from '../../hooks/useServiceVersions';
import { Modal, ModalHeader, TextInput, PrimaryButton, ErrorNote } from './FormControls';

interface AddToListSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cafeId?: string;
  beanId?: string;
}

/** List picker used by the cafe and bean modals and the saved view. */
export const AddToListSheet: React.FC<AddToListSheetProps> = ({ isOpen, onClose, cafeId, beanId }) => {
  usePrefsVersion();
  const [newListName, setNewListName] = useState('');
  const [error, setError] = useState('');

  const lists = userPrefsService.getLists();

  const addToList = (listId: string) => {
    if (cafeId) userPrefsService.addCafeToList(listId, cafeId);
    if (beanId) userPrefsService.addBeanToList(listId, beanId);
    onClose();
  };

  const createAndAdd = () => {
    try {
      const list = userPrefsService.createList(newListName);
      setNewListName('');
      setError('');
      addToList(list.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the list.');
    }
  };

  const containsItem = (listId: string): boolean => {
    const list = lists.find((candidate) => candidate.id === listId);
    if (!list) return false;
    return (cafeId ? list.cafeIds.includes(cafeId) : false) || (beanId ? list.beanIds.includes(beanId) : false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm:max-w-md" labelledBy="add-to-list-title">
      <ModalHeader title="Add to list" subtitle="Build collections like Work Cafes or Weekend Pour-Overs" onClose={onClose} />
      <div className="px-4 sm:px-6 py-4 space-y-6">
        {lists.length === 0 && (
          <p className="px-1 text-[15px] font-sans text-[#594C3D] leading-relaxed">
            No lists yet. Name your first one below: a list keeps cafes and beans together and can be shared with one link.
          </p>
        )}

        {lists.length > 0 && (
          <section className="space-y-1.5">
            <h3 className="px-4 text-[13px] text-[#594C3D] font-sans">Your lists</h3>
            <div className="ios-group bg-[#FAF5EB]">
              {lists.map((list) => {
                const has = containsItem(list.id);
                const count = list.cafeIds.length + list.beanIds.length;
                return (
                  <button
                    key={list.id}
                    onClick={() => addToList(list.id)}
                    disabled={has}
                    className={`ios-group-row font-sans ${has ? 'cursor-default' : 'ios-press'}`}
                  >
                    <span className={`min-w-0 flex-1 truncate text-[15px] ${has ? 'text-[#594C3D]' : 'text-[#13191F]'}`}>
                      {list.name}
                    </span>
                    <span className="shrink-0 font-mono text-[13px] text-[#594C3D]">
                      {count} {count === 1 ? 'item' : 'items'}
                    </span>
                    {has ? (
                      <>
                        <Check className="w-4.5 h-4.5 text-[#3E5C48] shrink-0" strokeWidth={2.5} aria-hidden="true" />
                        <span className="sr-only">Already in this list</span>
                      </>
                    ) : (
                      <Plus className="w-4.5 h-4.5 text-[#906D4B] shrink-0" strokeWidth={2.5} aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="space-y-1.5">
          <h3 className="px-4 text-[13px] text-[#594C3D] font-sans">New list</h3>
          <div className="flex gap-2">
            <TextInput value={newListName} onChange={setNewListName} placeholder="e.g. Work Cafes with Good WiFi" />
            <PrimaryButton onClick={createAndAdd} disabled={!newListName.trim()} className="shrink-0 w-11 px-0 flex items-center justify-center">
              <Plus className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
              <span className="sr-only">Create list and add</span>
            </PrimaryButton>
          </div>
          {error && <ErrorNote message={error} />}
        </section>
      </div>
    </Modal>
  );
};
