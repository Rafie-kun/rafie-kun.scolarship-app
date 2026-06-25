import { Application } from '../types';

const MOCK_APPLICATIONS_KEY = 'scholarpath_mock_applications';

export const getMockApplications = (): Application[] => {
  try {
    const data = localStorage.getItem(MOCK_APPLICATIONS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to parse mock applications from local storage", e);
  }

  // Generate initial mock applications
  const initialMocks: Application[] = [
    {
      id: 'app-mock-1',
      name: 'Global Excellence Scholarship',
      providerOrUni: 'Harvard University',
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'In Progress',
      notes: 'Need to get my recommendation letters translated and signed by my physics professor.',
      checklist: [
        { text: 'Review GPA requirements', done: true },
        { text: 'Write Statement of Purpose', done: false },
        { text: 'Submit transcript', done: false }
      ]
    },
    {
      id: 'app-mock-2',
      name: 'Fulbright Foreign Student Program',
      providerOrUni: 'US Government',
      deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Saved',
      notes: 'Waiting for the official portal to open for this year.',
      checklist: [
        { text: 'Check eligibility criteria', done: true },
        { text: 'Prepare CV', done: true },
        { text: 'Draft research proposal', done: false }
      ]
    }
  ];
  
  saveMockApplications(initialMocks);
  return initialMocks;
};

export const saveMockApplications = (apps: Application[]) => {
  localStorage.setItem(MOCK_APPLICATIONS_KEY, JSON.stringify(apps));
};
