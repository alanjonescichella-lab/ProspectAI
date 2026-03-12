export type Review = {
  rating?: number;
  text?: { text: string };
};

export type Photo = {
  name?: string;
  widthPx?: number;
  heightPx?: number;
};

export type OpeningHours = {
  openNow?: boolean;
  periods?: Array<{
    open: { day: number; hour: number; minute: number };
    close?: { day: number; hour: number; minute: number };
  }>;
  weekdayDescriptions?: string[];
};

export type Lead = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  rating: number;
  userRatingCount: number;
  types: string[];
  primaryType: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: OpeningHours;
  photos?: Photo[];
  reviews?: Review[];
  businessStatus?: string;
  googleMapsUri?: string;
  digitalPainScore: number;
  aiSummary: string;
};

export type SearchParams = {
  icp: string;
  service: string;
  state: string;
  city: string;
};
