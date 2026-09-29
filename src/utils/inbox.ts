/**
 * Where a visitor reads their mail, from the address they signed up with. Only providers with a stable web
 * inbox are listed; on phones these links open the provider's app when it is installed. Anything else gets no
 * link, because a mailto: link opens a new message, not the inbox.
 */
export interface Inbox {
  name: string;
  url: string;
}

const INBOXES: Record<string, Inbox> = {
  'gmail.com': { name: 'Gmail', url: 'https://mail.google.com/' },
  'googlemail.com': { name: 'Gmail', url: 'https://mail.google.com/' },
  'outlook.com': { name: 'Outlook', url: 'https://outlook.live.com/mail/' },
  'hotmail.com': { name: 'Outlook', url: 'https://outlook.live.com/mail/' },
  'live.com': { name: 'Outlook', url: 'https://outlook.live.com/mail/' },
  'yahoo.com': { name: 'Yahoo Mail', url: 'https://mail.yahoo.com/' },
  'icloud.com': { name: 'iCloud Mail', url: 'https://www.icloud.com/mail' },
};

export function inboxFor(email: string): Inbox | null {
  const domain = email.trim().toLowerCase().split('@')[1];
  return (domain && INBOXES[domain]) || null;
}
