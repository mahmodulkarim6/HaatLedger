// Shared by the pages (forms, tables) and the API (field validation).
const days = ['Daily', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const entities = {
  farmers: { title: 'Farmers', one: 'farmer', pk: 'farmer_id',
    fields: [{ k: 'name', l: 'Full name' }, { k: 'phone', l: 'Phone' }, { k: 'village', l: 'Village' }, { k: 'district', l: 'District' }] },
  crops: { title: 'Crops', one: 'crop', pk: 'crop_id',
    fields: [{ k: 'crop_name', l: 'Crop name' }, { k: 'category', l: 'Category', t: 'select', o: ['Vegetable', 'Grain', 'Fruit', 'Spice', 'Pulse'] }] },
  markets: { title: 'Markets', one: 'market', pk: 'market_id',
    fields: [{ k: 'market_name', l: 'Market name' }, { k: 'district', l: 'District' }, { k: 'market_day', l: 'Market day', t: 'select', o: days }] },
  buyers: { title: 'Buyers', one: 'buyer', pk: 'buyer_id',
    fields: [{ k: 'name', l: 'Buyer name' }, { k: 'buyer_type', l: 'Buyer type', t: 'select', o: ['Wholesaler', 'Retailer', 'Restaurant'] }, { k: 'phone', l: 'Phone' }, { k: 'market_id', l: 'Market', t: 'ref', ref: 'markets' }],
    show: [{ k: 'name', l: 'Name' }, { k: 'buyer_type', l: 'Type' }, { k: 'phone', l: 'Phone' }, { k: 'market', l: 'Market' }] },
  supplies: { title: 'Supplies', one: 'supply', pk: 'supply_id',
    fields: [{ k: 'farmer_id', l: 'Farmer', t: 'ref', ref: 'farmers' }, { k: 'crop_id', l: 'Crop', t: 'ref', ref: 'crops' }, { k: 'market_id', l: 'Market', t: 'ref', ref: 'markets' }, { k: 'quantity_kg', l: 'Quantity (kg)', t: 'number' }, { k: 'price_per_kg', l: 'Price per kg (Tk)', t: 'number' }, { k: 'supply_date', l: 'Supply date', t: 'date' }],
    show: [{ k: 'supply_id', l: 'ID' }, { k: 'farmer', l: 'Farmer' }, { k: 'crop', l: 'Crop' }, { k: 'market', l: 'Market' }, { k: 'quantity_kg', l: 'Quantity', f: 'kg' }, { k: 'price_per_kg', l: 'Price', f: 'tk' }, { k: 'supply_date', l: 'Date' }] },
  purchases: { title: 'Purchases', one: 'purchase', pk: 'purchase_id',
    fields: [{ k: 'supply_id', l: 'Supply', t: 'ref', ref: 'supplies' }, { k: 'buyer_id', l: 'Buyer', t: 'ref', ref: 'buyers' }, { k: 'quantity_kg', l: 'Quantity (kg)', t: 'number' }, { k: 'purchase_date', l: 'Purchase date', t: 'date' }, { k: 'payment_status', l: 'Payment', t: 'select', o: ['Due', 'Paid'] }],
    show: [{ k: 'purchase_id', l: 'ID' }, { k: 'crop', l: 'Crop' }, { k: 'buyer', l: 'Buyer' }, { k: 'quantity_kg', l: 'Quantity', f: 'kg' }, { k: 'total_price', l: 'Total', f: 'tk' }, { k: 'purchase_date', l: 'Date' }, { k: 'payment_status', l: 'Payment', f: 'badge' }],
    quick: { k: 'payment_status', from: 'Due', to: 'Paid', label: 'Mark paid' } },
};
