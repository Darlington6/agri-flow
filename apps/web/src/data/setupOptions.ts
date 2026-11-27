import type { Option, SetupOptions } from '@/lib/apiClient'

// The pick lists for the demo's sign-up walkthrough, which runs without the
// API. A copy of apps/api/apps/network/options.py: the API's own test
// (apps/api/apps/network/tests/test_demo_copy.py) fails if the two drift apart.

const CROPS: Option[] = [
  { value: 'maize', label: 'Maize' },
  { value: 'beans', label: 'Beans' },
  { value: 'rice', label: 'Rice' },
  { value: 'sorghum', label: 'Sorghum' },
  { value: 'wheat', label: 'Wheat' },
  { value: 'soybean', label: 'Soybeans' },
  { value: 'groundnut', label: 'Groundnuts' },
  { value: 'cassava', label: 'Cassava' },
  { value: 'irish_potato', label: 'Irish potatoes' },
  { value: 'sweet_potato', label: 'Sweet potatoes' },
  { value: 'yam', label: 'Yams' },
  { value: 'banana', label: 'Bananas' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'tea', label: 'Tea' },
  { value: 'cocoa', label: 'Cocoa' },
  { value: 'avocado', label: 'Avocados' },
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'other', label: 'Other' },
]

const BUYER_TYPES: Option[] = [
  { value: 'processor', label: 'Processor' },
  { value: 'exporter', label: 'Exporter' },
  { value: 'wholesaler', label: 'Wholesaler' },
  { value: 'retailer', label: 'Retailer or supermarket' },
  { value: 'hospitality', label: 'Hotel or restaurant' },
  { value: 'institution', label: 'School, hospital or other institution' },
  { value: 'aggregator', label: 'Aggregator or trader' },
  { value: 'other', label: 'Other' },
]

const VEHICLE_TYPES: Option[] = [
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'motorbike', label: 'Motorbike' },
  { value: 'car', label: 'Car' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'truck', label: 'Truck' },
  { value: 'refrigerated_truck', label: 'Refrigerated truck' },
]

/** Rwanda's provinces and districts; elsewhere people type their region. */
const PLACES: Record<string, NonNullable<SetupOptions['regions']>> = {
  RW: [
    { name: 'City of Kigali', districts: ['Gasabo', 'Kicukiro', 'Nyarugenge'] },
    {
      name: 'Eastern Province',
      districts: ['Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana'],
    },
    { name: 'Northern Province', districts: ['Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo'] },
    {
      name: 'Southern Province',
      districts: ['Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango'],
    },
    {
      name: 'Western Province',
      districts: ['Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro'],
    },
  ],
}

export function demoSetupOptions(country: string): SetupOptions {
  return {
    country,
    regions: PLACES[country] ?? null,
    crops: CROPS,
    buyer_types: BUYER_TYPES,
    vehicle_types: VEHICLE_TYPES,
    cooperatives: country === 'RW' ? DEMO_COOPERATIVES : [],
  }
}

/** Sample cooperatives for the demo walkthrough (made up; nothing is saved). */
const DEMO_COOPERATIVES: SetupOptions['cooperatives'] = [
  { id: 1, name: 'Abahuzamugambi ba Musanze', region: 'Northern Province', district: 'Musanze', verified: true },
  { id: 2, name: 'Twisungane Kayonza', region: 'Eastern Province', district: 'Kayonza', verified: false },
]
