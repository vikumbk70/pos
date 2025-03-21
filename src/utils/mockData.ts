
// Mock data for the POS system - used for development and demo purposes
// In a real app, this would be stored in a local SQLite database

import { Product, Customer } from '../contexts/PosContext';

// Mock Products
export const mockProducts: Product[] = [
  {
    id: 1,
    name: "Coffee - Large",
    barcode: "100001",
    price: 4.99,
    stock: 100,
    category: "Beverages"
  },
  {
    id: 2,
    name: "Tea - Herbal",
    barcode: "100002",
    price: 3.99,
    stock: 80,
    category: "Beverages"
  },
  {
    id: 3,
    name: "Chocolate Chip Cookie",
    barcode: "100003",
    price: 2.49,
    stock: 30,
    category: "Bakery"
  },
  {
    id: 4,
    name: "Blueberry Muffin",
    barcode: "100004",
    price: 3.29,
    stock: 25,
    category: "Bakery"
  },
  {
    id: 5,
    name: "Ham & Cheese Sandwich",
    barcode: "100005",
    price: 7.99,
    stock: 15,
    category: "Sandwiches"
  },
  {
    id: 6,
    name: "Chicken Caesar Wrap",
    barcode: "100006",
    price: 8.49,
    stock: 12,
    category: "Sandwiches"
  },
  {
    id: 7,
    name: "Bottled Water",
    barcode: "100007",
    price: 1.99,
    stock: 50,
    category: "Beverages"
  },
  {
    id: 8,
    name: "Fresh Orange Juice",
    barcode: "100008",
    price: 4.49,
    stock: 20,
    category: "Beverages"
  },
  {
    id: 9,
    name: "Fruit Cup",
    barcode: "100009",
    price: 3.99,
    stock: 10,
    category: "Snacks"
  },
  {
    id: 10,
    name: "Greek Yogurt",
    barcode: "100010",
    price: 4.29,
    stock: 15,
    category: "Dairy"
  },
  {
    id: 11,
    name: "Protein Bar",
    barcode: "100011",
    price: 2.99,
    stock: 40,
    category: "Snacks"
  },
  {
    id: 12,
    name: "Chocolate Croissant",
    barcode: "100012",
    price: 3.79,
    stock: 18,
    category: "Bakery"
  },
  {
    id: 13,
    name: "Veggie Wrap",
    barcode: "100013",
    price: 7.99,
    stock: 8,
    category: "Sandwiches"
  },
  {
    id: 14,
    name: "Iced Latte",
    barcode: "100014",
    price: 5.49,
    stock: 45,
    category: "Beverages"
  },
  {
    id: 15,
    name: "Chips",
    barcode: "100015",
    price: 1.79,
    stock: 35,
    category: "Snacks"
  },
  {
    id: 16,
    name: "Chocolate Bar",
    barcode: "100016",
    price: 2.29,
    stock: 28,
    category: "Snacks"
  },
  {
    id: 17,
    name: "Granola Cup",
    barcode: "100017",
    price: 4.99,
    stock: 12,
    category: "Breakfast"
  },
  {
    id: 18,
    name: "Chicken Salad",
    barcode: "100018",
    price: 9.99,
    stock: 7,
    category: "Lunch"
  },
  {
    id: 19,
    name: "Sparkling Water",
    barcode: "100019",
    price: 2.49,
    stock: 30,
    category: "Beverages"
  },
  {
    id: 20,
    name: "Espresso Shot",
    barcode: "100020",
    price: 2.99,
    stock: 50,
    category: "Beverages"
  },
];

// Mock Customers
export const mockCustomers: Customer[] = [
  {
    id: 1,
    name: "John Smith",
    phone: "555-123-4567",
    email: "john.smith@example.com"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    phone: "555-987-6543",
    email: "sarah.j@example.com"
  },
  {
    id: 3,
    name: "Michael Brown",
    phone: "555-456-7890",
    email: "michael.b@example.com"
  },
  {
    id: 4,
    name: "Emily Davis",
    phone: "555-789-0123",
    email: "emily.d@example.com"
  },
  {
    id: 5,
    name: "Robert Wilson",
    phone: "555-321-6547",
    email: "robert.w@example.com"
  },
  {
    id: 6,
    name: "Jennifer Garcia",
    phone: "555-852-9631",
    email: "jennifer.g@example.com"
  },
  {
    id: 7,
    name: "David Martinez",
    phone: "555-741-8520",
    email: "david.m@example.com"
  },
  {
    id: 8,
    name: "Lisa Thompson",
    phone: "555-369-1470",
    email: "lisa.t@example.com"
  },
  {
    id: 9,
    name: "Daniel Rodriguez",
    phone: "555-258-7412",
    email: "daniel.r@example.com"
  },
  {
    id: 10,
    name: "Jessica White",
    phone: "555-963-8521",
    email: "jessica.w@example.com"
  }
];

// Mock database functions (simplified for demo)
export const db = {
  getProducts: () => mockProducts,
  getCustomers: () => mockCustomers,
};
