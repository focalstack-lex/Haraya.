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
      <ModalHeader title="Add to List" subtitle="Build collections like Work Cafes or Weekend Pour-Overs" onClose={onClose} />
      <div className="px-4 sm:px-6 py-4 space-y-4">
        {lists.length === 0 && (
          <p className="text-xs font-sans text-[#55615D]">
            No lists yet. Name your first one below: a list keeps cafes and beans together and can be shared with one link.
          </p>
        )}

        <div className="space-y-2">
          {lists.map((list) => {
            const has = containsItem(list.id);
            return (
              <button
                key={list.id}
                onClick={() => addToList(list.id)}
                disabled={has}
                className={`w-full h-11 px-3 rounded-xl border flex items-center justify-between text-sm font-semibold font-sans transition-colors ${
                  has
                    ? 'bg-[#F3ECD8] border-[#E6DCC0] text-[#55615D] cursor-default'
                    : 'bg-[#FFF9E9] border-[#E6DCC0] text-[#1A2225] hover:bg-[#F3ECD8]'
                }`}
              >
                <span className="truncate">{list.name}</span>
                <span className="text-[10px] text-[#55615D] flex items-center gap-1.5">
                  {list.cafeIds.length + list.beanIds.length} items
                  {has && <Check className="w-3.5 h-3.5 text-[#3E5C48]" />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-2 pt-2 border-t border-[#E6DCC0]">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-[#55615D] font-sans">New List</span>
          <div className="flex gap-2">
            <TextInput value={newListName} onChange={setNewListName} placeholder="e.g. Work Cafes with Good WiFi" />
            <PrimaryButton onClick={createAndAdd} disabled={!newListName.trim()} className="shrink-0">
              <Plus className="w-4 h-4" />
            </PrimaryButton>
          </div>
          {error && <ErrorNote message={error} />}
        </div>
      </div>
    </Modal>
  );
};
