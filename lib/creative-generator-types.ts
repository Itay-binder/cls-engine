export type AwarenessLevel = 'unaware' | 'problem_aware' | 'solution_aware' | 'brand_aware';
export type SophisticationLevel = 'new' | 'experienced' | 'sophisticated';
export type BuyingReadiness = 'browsing' | 'considering' | 'ready';

export interface SubAvatar {
  id: string;
  parentAvatarId: string;
  name: string;
  stage: string;
  specificPain: string;
  buyingReadiness: BuyingReadiness;
  ownWords: string;
}

export interface Avatar {
  id: string;
  emoji: string;
  name: string;
  ageRange: string;
  role: string;
  painPoint: string;
  coreDesire: string;
  buyingTrigger: string;
  awarenessLevel?: AwarenessLevel;
  primaryObjection?: string;
  voiceOfCustomer?: string;
  sophisticationLevel?: SophisticationLevel;
  subAvatars?: SubAvatar[];
}

export interface Angle {
  id: string;
  avatarId: string;
  name: string;
  hookLine: string;
  format: 'UGC' | 'Static' | 'Video' | 'Carousel';
}

export interface CreativeBrief {
  avatarName: string;
  angleName: string;
  concept: string;
  hook: string;
  script: string;
  caption: string;
  visualDirection: string;
  productionNotes: string;
  visualPrompt: string;
}

export interface BusinessProfile {
  id: string;
  business_name: string | null;
  product_description: string | null;
  current_offer: string | null;
  market_notes: string | null;
}
