import { addNotification } from '../../db/index';

export function notifyNewScholarship(name: string, provider: string) {
  const timestamp = 'Just now';
  const message = `[🔥 SCRAPER] New opportunity added: "${name}" from ${provider}! Check your qualifications and eligibility match.`;
  
  console.log(`[📢 NOTIFICATION] ${message}`);
  
  addNotification({
    id: `notif-scraped-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type: 'info',
    message,
    timestamp,
  });
}

export function notifyNewUniversity(name: string, country: string, rank?: number) {
  const timestamp = 'Just now';
  let message = `[🏫 SCRAPER] New university profiled: ${name} in ${country}! `;
  if (rank && rank !== 9999) {
    message += `Ranked #${rank} worldwide.`;
  } else {
    message += `Explore their entry criteria and direct applications.`;
  }
  
  console.log(`[📢 NOTIFICATION] ${message}`);
  
  addNotification({
    id: `notif-scraped-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type: 'info',
    message,
    timestamp,
  });
}

export function notifyUpdatedScholarship(name: string) {
  const timestamp = 'Just now';
  const message = `[💡 SCRAPER Update] Scholarship info changed: "${name}". Fresh deadline or criteria added.`;
  
  console.log(`[📢 NOTIFICATION] ${message}`);
  
  addNotification({
    id: `notif-scraped-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type: 'warning',
    message,
    timestamp,
  });
}
