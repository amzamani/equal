export interface Product {
    id: string;
    name: string;
    brand: string;
    category: string;
    price: number;
    features: string[];
    inStock: boolean;
    relevanceScore?: number;
}

export const MOCK_PRODUCTS: Product[] = [
    {
        id: '1',
        name: 'Sony WH-1000XM5 Wireless Headphones',
        brand: 'Sony',
        category: 'headphones',
        price: 399,
        features: ['noise-canceling', 'wireless', 'bluetooth', '30hr-battery'],
        inStock: true
    },
    {
        id: '2',
        name: 'Bose QuietComfort 45',
        brand: 'Bose',
        category: 'headphones',
        price: 329,
        features: ['noise-canceling', 'wireless', 'bluetooth', '24hr-battery'],
        inStock: true
    },
    {
        id: '3',
        name: 'Apple AirPods Max',
        brand: 'Apple',
        category: 'headphones',
        price: 549,
        features: ['noise-canceling', 'wireless', 'spatial-audio'],
        inStock: false
    },
    {
        id: '4',
        name: 'Sennheiser Momentum 4',
        brand: 'Sennheiser',
        category: 'headphones',
        price: 379,
        features: ['noise-canceling', 'wireless', 'bluetooth', '60hr-battery'],
        inStock: true
    },
    {
        id: '5',
        name: 'Beats Studio Pro',
        brand: 'Beats',
        category: 'headphones',
        price: 349,
        features: ['noise-canceling', 'wireless', 'spatial-audio'],
        inStock: true
    },
    {
        id: '6',
        name: 'JBL Tour One M2',
        brand: 'JBL',
        category: 'headphones',
        price: 299,
        features: ['noise-canceling', 'wireless', 'bluetooth'],
        inStock: true
    },
    {
        id: '7',
        name: 'Anker Soundcore Space Q45',
        brand: 'Anker',
        category: 'headphones',
        price: 149,
        features: ['noise-canceling', 'wireless', '50hr-battery'],
        inStock: true
    },
    {
        id: '8',
        name: 'Audio-Technica ATH-M50xBT2',
        brand: 'Audio-Technica',
        category: 'headphones',
        price: 199,
        features: ['wireless', 'bluetooth', 'studio-quality'],
        inStock: true
    }
];

export const TAXONOMY = [
    'Electronics > Audio > Headphones',
    'Electronics > Audio > Speakers',
    'Electronics > Computers > Laptops',
    'Electronics > Computers > Accessories',
    'Electronics > Mobile > Phones',
    'Electronics > Mobile > Accessories',
    'Home > Furniture > Office Chairs',
    'Home > Furniture > Desks',
    'Home > Kitchen > Appliances',
    'Home > Decor > Lighting',
    'Office > Supplies > Paper',
    'Office > Supplies > Writing Instruments',
    'Office > Technology > Printers',
    'Sports > Gym > Equipment',
    'Sports > Outdoor > Camping'
];
