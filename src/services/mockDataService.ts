import { Application } from '../types';

const MOCK_APPLICATIONS_KEY = 'scholarpath_mock_applications';

export const getMockApplications = (username?: string): Application[] => {
  const key = username ? `${MOCK_APPLICATIONS_KEY}_${username}` : MOCK_APPLICATIONS_KEY;
  try {
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to parse mock applications from local storage", e);
  }

  // To ensure a completely fresh workspace for newly registered users and guest pathfinders,
  // we do not generate mock applications by default. They start with an empty slate.
  return [];
};

export const saveMockApplications = (apps: Application[], username?: string) => {
  const key = username ? `${MOCK_APPLICATIONS_KEY}_${username}` : MOCK_APPLICATIONS_KEY;
  localStorage.setItem(key, JSON.stringify(apps));
};
