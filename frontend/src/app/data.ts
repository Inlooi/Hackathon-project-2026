import img1 from "../imports/thumbs_b_c_fa0a82b4f0e36d42365edfae93cba446.jpg";
import img2 from "../imports/IMG_7663-4.jpg";
import img3 from "../imports/gl_korpus_22_10_2024-_____-___-__-27.01.2025.jpg";
import img4 from "../imports/_______-1-1024x683.jpg";

export const universities = [
  {
    id: "uni-1",
    name: "Kyrgyz National University",
    location: "Bishkek, Kyrgyzstan",
    rating: 4.8,
    reviewsCount: 1240,
    tuition: "$1,700 / year",
    minOrtScore: 180,
    acceptanceRate: "18%",
    students: "15,000",
    image: img3,
    description: "Kyrgyz National University is a world-renowned institution focused on engineering, computer science, and design. Situated in the heart of Bishkek, it offers unparalleled networking and research opportunities.",
    majors: [
      { name: "Computer Science", degree: "B.S., M.S., Ph.D.", price: "$1,700" },
      { name: "Mechanical Engineering", degree: "B.S., M.S.", price: "$1,600" },
      { name: "Data Science", degree: "B.S., M.S.", price: "$1,700" },
      { name: "Business Administration", degree: "B.A., MBA", price: "$1,800" }
    ],
    reviews: [
      { id: 1, user: "Alex T.", rating: 5, text: "Amazing campus and professors! The computer science program is extremely rigorous but highly rewarding.", date: "2 months ago" },
      { id: 2, user: "Sarah L.", rating: 4, text: "Great facilities. Housing is a bit expensive given the location, but overall a great experience.", date: "4 months ago" }
    ]
  },
  {
    id: "uni-2",
    name: "Kyrgyz International University",
    location: "Bishkek, Kyrgyzstan",
    rating: 4.5,
    reviewsCount: 890,
    tuition: "$2,000/ year (In-state)",
    minOrtScore: 140,
    acceptanceRate: "45%",
    students: "38,000",
    image: img2,
    description: "Kyrgyz International University is a large public research university known for its vibrant campus life, athletics, and strong programs in business and liberal arts.",
    majors: [
      { name: "Accounting", degree: "B.B.A., M.Acc.", price: "$2,000" },
      { name: "Biology", degree: "B.S., Ph.D.", price: "$2,100" },
      { name: "Psychology", degree: "B.A.", price: "$1,900" },
      { name: "Nursing", degree: "B.S.N., M.S.N.", price: "$2,200" }
    ],
    reviews: [
      { id: 1, user: "Jordan M.", rating: 5, text: "The school spirit here is unmatched! The business school has great connections.", date: "1 month ago" },
      { id: 2, user: "Emily C.", rating: 4, text: "Huge campus, so be prepared to walk. The biology labs are newly renovated.", date: "5 months ago" }
    ]
  },
  {
    id: "uni-3",
    name: "Kyrgyz-Turkish \"Manas\" University",
    location: "Bishkek, Kyrgyzstan",
    rating: 4.7,
    reviewsCount: 450,
    tuition: "$3,700 / year",
    minOrtScore: 160,
    acceptanceRate: "12%",
    students: "4,500",
    image: img1,
    description: "Kyrgyz-Turkish \"Manas\" University is a premier college for the arts, offering intensive conservatory-style training in visual arts, design, and performing arts.",
    majors: [
      { name: "Fine Arts", degree: "B.F.A., M.F.A.", price: "$3,700" },
      { name: "Graphic Design", degree: "B.F.A.", price: "$3,700" },
      { name: "Film Production", degree: "B.F.A.", price: "$3,800" }
    ],
    reviews: [
      { id: 1, user: "Liam K.", rating: 5, text: "Incredible studio spaces and faculty who are active industry professionals.", date: "3 weeks ago" },
      { id: 2, user: "Sophia W.", rating: 4, text: "Intense workload but you learn so much. Living in Bishkek is a huge plus for networking.", date: "6 months ago" }
    ]
  },
  {
    id: "uni-4",
    name: "Ala-Too International University",
    location: "Bishkek, Kyrgyzstan",
    rating: 4.9,
    reviewsCount: 310,
    tuition: "$3,500 / year",
    minOrtScore: 210,
    acceptanceRate: "9%",
    students: "2,100",
    image: img4,
    description: "A small, prestigious liberal arts college offering an intimate learning environment, open curriculum, and small class sizes.",
    majors: [
      { name: "Political Science", degree: "B.A.", price: "$3,500" },
      { name: "English Literature", degree: "B.A.", price: "$3,500" },
      { name: "Economics", degree: "B.A.", price: "$3,500" },
      { name: "Environmental Studies", degree: "B.A.", price: "$3,500" }
    ],
    reviews: [
      { id: 1, user: "Noah R.", rating: 5, text: "The open curriculum let me explore exactly what I wanted. Professors actually know your name.", date: "1 week ago" },
      { id: 2, user: "Mia P.", rating: 5, text: "Beautiful, picturesque campus and an incredibly supportive community.", date: "8 months ago" }
    ]
  }
];

export const userProfile = {
  name: "Jane Doe",
  email: "jane.doe@example.com",
  avatar: "https://images.unsplash.com/photo-1695927621677-ec96e048dce2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwcHJvZmlsZSUyMHBlcnNvbnxlbnwxfHx8fDE3NzkxNzM2NDR8MA&ixlib=rb-4.1.0&q=80&w=1080",
  ortScore: 215, // Out of 245
  gpa: 3.8,
  preferences: {
    budget: 4000,
    city: "Bishkek",
    targetField: "Computer Science",
    interests: ["Technology", "Design", "Robotics"],
    languages: ["English", "Russian", "Kyrgyz"]
  },
  savedUniversities: ["uni-1", "uni-3"]
};

// Calculate match score based on user profile preferences
export function calculateMatch(university: typeof universities[0], profile: typeof userProfile) {
  let score = 20; // Base score
  const insights: { text: string; isPositive: boolean }[] = [];

  // 1. Check Location (City)
  const locMatch = profile.preferences.city 
    ? university.location.toLowerCase().includes(profile.preferences.city.toLowerCase())
    : false;
    
  if (locMatch) {
    score += 30;
    insights.push({ text: "In your preferred city", isPositive: true });
  } else {
    insights.push({ text: "Outside preferred city", isPositive: false });
  }

  // 2. Check Target Field
  const majorMatch = profile.preferences.targetField
    ? university.majors.some(major => major.name.toLowerCase().includes(profile.preferences.targetField.toLowerCase()))
    : false;
    
  if (majorMatch) {
    score += 30;
    insights.push({ text: "Offers your target field", isPositive: true });
  }

  // 3. Check Tuition Budget
  const tuitionStr = university.tuition.replace(/[^0-9]/g, '');
  const tuitionVal = parseInt(tuitionStr, 10);
  if (tuitionVal <= profile.preferences.budget) {
    score += 20;
    const diff = profile.preferences.budget - tuitionVal;
    insights.push({ text: diff === 0 ? "Exactly your budget" : `$${diff.toLocaleString()} under budget`, isPositive: true });
  } else {
    const diff = tuitionVal - profile.preferences.budget;
    insights.push({ text: `$${diff.toLocaleString()} over budget`, isPositive: false });
  }

  return { score: Math.min(score, 100), insights };
}