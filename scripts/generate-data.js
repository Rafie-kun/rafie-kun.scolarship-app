import fs from 'fs';
import path from 'path';

const regions = ['North America', 'Europe', 'Asia', 'Oceania'];
const countries = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'Singapore', 'Japan', 'France', 'Switzerland'];
const cities = ['New York', 'London', 'Toronto', 'Sydney', 'Berlin', 'Singapore', 'Tokyo', 'Paris', 'Zurich', 'Boston', 'Los Angeles', 'Chicago'];

const majors = ['Computer Science', 'Engineering', 'Business', 'Medicine', 'Law', 'Arts', 'Design', 'Economics', 'Psychology', 'Data Science', 'Information Technology', 'Architecture', 'Biology'];

const unis = [];

for (let i = 1; i <= 200; i++) {
  const country = countries[Math.floor(Math.random() * countries.length)];
  const isUS = country === 'United States';
  const tuitionMin = isUS ? 30000 + Math.random() * 20000 : 10000 + Math.random() * 15000;
  const tuitionMax = tuitionMin + 15000 + Math.random() * 10000;
  
  unis.push({
    id: `uni-${i.toString().padStart(3, '0')}`,
    name: `Global University ${i}`,
    country: country,
    type: Math.random() > 0.4 ? 'public' : 'private',
    ranking: i,
    acceptanceRate: `${(5 + Math.random() * 50).toFixed(1)}%`,
    averageGpa: 3.0 + Math.random() * 1.0,
    tuitionMin: Math.floor(tuitionMin),
    tuitionMax: Math.floor(tuitionMax),
    popularMajors: [
      majors[Math.floor(Math.random() * majors.length)],
      majors[Math.floor(Math.random() * majors.length)],
      majors[Math.floor(Math.random() * majors.length)]
    ],
    offeredScholarships: [`sch-${Math.floor(Math.random() * 50).toString().padStart(3, '0')}`],
    city: cities[Math.floor(Math.random() * cities.length)],
    hasOnCampusHousing: Math.random() > 0.3,
    website: `https://www.globaluni${i}.edu/`,
    applicationUrl: `https://apply.globaluni${i}.edu/`,
    region: regions[Math.floor(Math.random() * regions.length)]
  });
}

// Add top unis
unis.unshift(
  { id: 'uni-harvard', name: 'Harvard University', country: 'United States', type: 'private', ranking: 1, acceptanceRate: '3.4%', averageGpa: 3.95, tuitionMin: 54000, tuitionMax: 61200, popularMajors: ['Economics', 'Computer Science', 'Political Science'], offeredScholarships: ['sch-001'], city: 'Cambridge', hasOnCampusHousing: true, website: 'https://www.harvard.edu/', applicationUrl: 'https://apply.college.harvard.edu/', region: 'North America' },
  { id: 'uni-mit', name: 'Massachusetts Institute of Technology', country: 'United States', type: 'private', ranking: 2, acceptanceRate: '4.1%', averageGpa: 3.96, tuitionMin: 55500, tuitionMax: 59750, popularMajors: ['Computer Science', 'Mechanical Engineering', 'Physics'], offeredScholarships: ['sch-002'], city: 'Cambridge', hasOnCampusHousing: true, website: 'https://www.mit.edu/', applicationUrl: 'https://apply.mit.edu/', region: 'North America' }
);

const scholarships = [];
for (let i = 1; i <= 100; i++) {
  scholarships.push({
    id: `sch-${i.toString().padStart(3, '0')}`,
    name: `Global Excellence Scholarship ${i}`,
    provider: `Foundation ${i}`,
    description: `A fully funded scholarship for outstanding students in ${majors[Math.floor(Math.random() * majors.length)]}.`,
    amountMin: 10000 + Math.random() * 20000,
    amountMax: 30000 + Math.random() * 30000,
    currency: ['USD', 'EUR', 'GBP'][Math.floor(Math.random() * 3)],
    applicationDeadline: `2026-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-01`,
    eligibilityCriteria: ['High GPA', 'Leadership skills', 'International student'],
    targetDegree: ['Undergraduate', 'Postgraduate'][Math.floor(Math.random() * 2)],
    url: `https://scholarships.org/sch-${i}`,
    country: countries[Math.floor(Math.random() * countries.length)],
    region: regions[Math.floor(Math.random() * regions.length)]
  });
}

const pubDataPath = path.join(process.cwd(), 'public', 'data');
if (!fs.existsSync(pubDataPath)) {
  fs.mkdirSync(pubDataPath, { recursive: true });
}

fs.writeFileSync(path.join(pubDataPath, 'universities.json'), JSON.stringify(unis, null, 2));
fs.writeFileSync(path.join(pubDataPath, 'scholarships.json'), JSON.stringify(scholarships, null, 2));

console.log('✅ Fallback data generated in public/data');
