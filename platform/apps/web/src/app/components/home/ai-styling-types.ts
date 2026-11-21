export interface HairProfile {
  faceShape: 'oval' | 'square' | 'round' | 'heart' | 'diamond';
  hairType: 'straight' | 'wavy' | 'curly' | 'coily';
  lifestyle: 'business' | 'casual' | 'active' | 'creative';
  beardGoal: 'clean' | 'stubble' | 'full' | 'faded';
}

export interface Recommendation {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  matchScore: number;
  price: number;
  duration: number;
  recommendedBarber: string;
  benefits: string[];
}
