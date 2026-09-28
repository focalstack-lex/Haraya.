/** Remembers that the first-visit tour was finished or skipped. Storage can throw in private
 * windows or with blocked site data; the tour is a convenience, so failures only log. */
const TOUR_DONE_KEY = 'haraya_tour_done';

export const isTourDone = (): boolean => {
  try {
    return localStorage.getItem(TOUR_DONE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const markTourDone = (): void => {
  try {
    localStorage.setItem(TOUR_DONE_KEY, 'true');
  } catch (error) {
    console.warn('Haraya: could not persist the tour flag', error);
  }
};
