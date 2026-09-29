/** Remembers that Aya already offered to install Haraya. Storage can throw in private
 * windows or with blocked site data; the offer is a convenience, so failures only log. */
const INSTALL_OFFERED_KEY = 'haraya_install_offered';

export const hasOfferedInstall = (): boolean => {
  try {
    return localStorage.getItem(INSTALL_OFFERED_KEY) === 'true';
  } catch {
    return false;
  }
};

export const markInstallOffered = (): void => {
  try {
    localStorage.setItem(INSTALL_OFFERED_KEY, 'true');
  } catch (error) {
    console.warn('Haraya: could not persist the install flag', error);
  }
};
