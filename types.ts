export interface SalesData {
  id?: string;
  date: string;
  talentName: string;
  accountName: string;
  type: 'general' | 'content'; // 'content' type is now used for Product-specific sales
  
  // General Sales Metrics
  gmv?: number;
  productViews?: number;
  productClicks?: number;
  
  // Product/Content Sales Metrics
  linkedPostId?: string; // Deprecated but kept for backward compatibility
  productId?: string; // NEW: Reference to ProductData id
  productName?: string; // Optional context
  
  // Shared Metrics
  quantity: number; // Items sold
  revenue: number; // Omset (for Product Sales) or used generally
  commission: number; // Estimated Commission
  
  timestamp: number;
}

export interface ProductData {
  id?: string;
  name: string;
  url?: string;
  talentName?: string; // NEW: Link product to talent
  accountName?: string; // NEW: Link product to specific account
  timestamp: number;
}

export interface PostData {
  id?: string;
  date: string;
  talentName: string;
  accountName: string;
  platform: 'TikTok' | 'Instagram' | 'Shopee' | 'YouTube' | 'Other';
  link: string;
  
  // Product Link
  productId?: string;
  productName?: string;

  views?: number;
  likes?: number;
  timestamp: number;
}

export interface TalentReference {
  id?: string;
  name: string;
  accounts: string[];
}

export type ViewState = 'dashboard' | 'sales-entry' | 'post-entry' | 'product-entry' | 'settings';