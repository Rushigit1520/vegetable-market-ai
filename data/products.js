const products = [
  // ===== FRUITS =====
  { name: "Organic Bananas", category: "Fruits", price: 49, original_price: 65, unit: "bunch", description: "Sweet, ripe organic bananas. Perfect for smoothies, snacking, or baking.", image: "/assets/banana.png", rating: 4.7, reviews: 234, is_featured: true, is_deal: true },
  { name: "Fresh Strawberries", category: "Fruits", price: 199, original_price: 249, unit: "pack", description: "Hand-picked, juicy strawberries bursting with flavor.", image: "/assets/strawberry.png", rating: 4.8, reviews: 189, is_featured: true, is_deal: true },
  { name: "Avocados", category: "Fruits", price: 149, original_price: null, unit: "each", description: "Perfectly ripe Hass avocados, ready to eat today.", image: "/assets/avocado.png", rating: 4.5, reviews: 312, is_featured: true, is_deal: false },
  { name: "Red Apples", category: "Fruits", price: 179, original_price: 220, unit: "kg", description: "Crisp and sweet Fuji apples, farm fresh.", image: "/assets/apple.png", rating: 4.6, reviews: 198, is_featured: false, is_deal: true },
  { name: "Alphonso Mango", category: "Fruits", price: 499, original_price: 650, unit: "dozen", description: "Premium Ratnagiri Alphonso mangoes, the king of fruits.", image: "/assets/apple.png", rating: 4.9, reviews: 520, is_featured: true, is_deal: true },
  { name: "Watermelon", category: "Fruits", price: 59, original_price: null, unit: "each", description: "Sweet and refreshing seedless watermelon, perfect for summer.", image: "/assets/apple.png", rating: 4.4, reviews: 145, is_featured: false, is_deal: false },
  { name: "Green Grapes", category: "Fruits", price: 120, original_price: 150, unit: "kg", description: "Crisp seedless green grapes, perfect for snacking.", image: "/assets/apple.png", rating: 4.5, reviews: 167, is_featured: false, is_deal: true },
  { name: "Papaya", category: "Fruits", price: 45, original_price: null, unit: "each", description: "Ripe and sweet papaya, rich in vitamins and enzymes.", image: "/assets/apple.png", rating: 4.3, reviews: 89, is_featured: false, is_deal: false },

  // ===== VEGETABLES =====
  { name: "Fresh Broccoli", category: "Vegetables", price: 89, original_price: null, unit: "head", description: "Vibrant green broccoli crowns, packed with nutrients.", image: "/assets/broccoli.png", rating: 4.4, reviews: 156, is_featured: true, is_deal: false },
  { name: "Baby Spinach", category: "Vegetables", price: 45, original_price: null, unit: "bunch", description: "Tender baby spinach leaves, pre-washed and ready to use.", image: "/assets/spinach.png", rating: 4.6, reviews: 201, is_featured: false, is_deal: false },
  { name: "Sweet Carrots", category: "Vegetables", price: 35, original_price: 50, unit: "kg", description: "Crunchy, naturally sweet carrots. Great for snacking or cooking.", image: "/assets/carrot.png", rating: 4.5, reviews: 178, is_featured: false, is_deal: true },
  { name: "Cherry Tomatoes", category: "Vegetables", price: 60, original_price: null, unit: "kg", description: "Vine-ripened cherry tomatoes, bursting with sweetness.", image: "/assets/tomato.png", rating: 4.7, reviews: 220, is_featured: true, is_deal: false },
  { name: "Potato", category: "Vegetables", price: 30, original_price: null, unit: "kg", description: "Versatile starchy root vegetable, essential for Indian cooking.", image: "/assets/potato.png", rating: 4.8, reviews: 99, is_featured: false, is_deal: false },
  { name: "Onion", category: "Vegetables", price: 35, original_price: null, unit: "kg", description: "Essential culinary onion, pungent and flavorful.", image: "/assets/onion.png", rating: 4.6, reviews: 106, is_featured: false, is_deal: false },
  { name: "Cauliflower", category: "Vegetables", price: 40, original_price: null, unit: "head", description: "Fresh white cauliflower head, perfect for gobi dishes.", image: "/assets/cauliflower.png", rating: 4.7, reviews: 95, is_featured: false, is_deal: false },
  { name: "Cabbage", category: "Vegetables", price: 25, original_price: null, unit: "head", description: "Crisp green leafy cabbage for salads and sabzi.", image: "/assets/cabbage.png", rating: 4.4, reviews: 211, is_featured: false, is_deal: false },
  { name: "Capsicum (Bell Pepper)", category: "Vegetables", price: 120, original_price: 160, unit: "kg", description: "Crunchy green bell peppers for stir-fry and salads.", image: "/assets/pepper.png", rating: 4.2, reviews: 95, is_featured: false, is_deal: true },
  { name: "Green Peas", category: "Vegetables", price: 80, original_price: null, unit: "kg", description: "Sweet green peas in pod, fresh from the farm.", image: "/assets/peas.png", rating: 4.3, reviews: 72, is_featured: false, is_deal: false },
  { name: "Okra (Bhindi)", category: "Vegetables", price: 55, original_price: null, unit: "kg", description: "Tender green ladyfingers, perfect for bhindi masala.", image: "/assets/okra.png", rating: 4.3, reviews: 91, is_featured: false, is_deal: false },
  { name: "Pumpkin (Kaddu)", category: "Vegetables", price: 35, original_price: null, unit: "kg", description: "Sweet orange pumpkin for kaddu sabzi and halwa.", image: "/assets/pumpkin.png", rating: 4.9, reviews: 127, is_featured: false, is_deal: false },
  { name: "Coriander Leaves", category: "Vegetables", price: 15, original_price: null, unit: "bunch", description: "Fresh cilantro for garnish and chutney.", image: "/assets/coriander.png", rating: 4.5, reviews: 92, is_featured: false, is_deal: false },
  { name: "Green Chili", category: "Vegetables", price: 40, original_price: null, unit: "kg", description: "Spicy fresh green chilies, essential for Indian cuisine.", image: "/assets/pepper.png", rating: 4.1, reviews: 103, is_featured: false, is_deal: false },
  { name: "Bottle Gourd (Lauki)", category: "Vegetables", price: 30, original_price: null, unit: "piece", description: "Light green mild gourd, great for healthy cooking.", image: "/assets/bottlegourd.png", rating: 4.4, reviews: 218, is_featured: false, is_deal: false },
  { name: "Bitter Gourd (Karela)", category: "Vegetables", price: 50, original_price: null, unit: "kg", description: "Bitter but highly nutritious gourd, great for health.", image: "/assets/bittergourd.png", rating: 4.4, reviews: 69, is_featured: false, is_deal: false },

  // ===== DAIRY =====
  { name: "Whole Milk", category: "Dairy", price: 68, original_price: null, unit: "litre", description: "Farm-fresh whole milk, pasteurized and homogenized.", image: "/assets/milk.png", rating: 4.8, reviews: 340, is_featured: true, is_deal: false },
  { name: "Greek Yogurt", category: "Dairy", price: 120, original_price: 160, unit: "500g", description: "Thick, creamy Greek yogurt with live active cultures.", image: "/assets/yogurt.png", rating: 4.7, reviews: 287, is_featured: false, is_deal: true },
  { name: "Cheddar Cheese", category: "Dairy", price: 249, original_price: null, unit: "block", description: "Sharp aged cheddar cheese, perfect for sandwiches or snacking.", image: "/assets/cheese.png", rating: 4.6, reviews: 195, is_featured: false, is_deal: false },
  { name: "Free-Range Eggs", category: "Dairy", price: 99, original_price: 129, unit: "dozen", description: "Farm-fresh free-range eggs from pasture-raised hens.", image: "/assets/eggs.png", rating: 4.9, reviews: 412, is_featured: true, is_deal: true },
  { name: "Paneer (Cottage Cheese)", category: "Dairy", price: 90, original_price: null, unit: "200g", description: "Fresh soft paneer, perfect for curries and tikka.", image: "/assets/cheese.png", rating: 4.7, reviews: 256, is_featured: true, is_deal: false },
  { name: "Amul Butter", category: "Dairy", price: 56, original_price: null, unit: "100g", description: "Creamy salted butter, perfect for parathas and toast.", image: "/assets/milk.png", rating: 4.8, reviews: 389, is_featured: false, is_deal: false },

  // ===== BAKERY =====
  { name: "Sourdough Bread", category: "Bakery", price: 89, original_price: null, unit: "loaf", description: "Artisan sourdough bread with a crispy crust and tangy flavor.", image: "/assets/bread.png", rating: 4.8, reviews: 267, is_featured: true, is_deal: false },
  { name: "Croissants", category: "Bakery", price: 149, original_price: 199, unit: "4-pack", description: "Buttery, flaky French croissants, freshly baked.", image: "/assets/croissant.png", rating: 4.7, reviews: 198, is_featured: false, is_deal: true },
  { name: "Whole Wheat Bread", category: "Bakery", price: 45, original_price: null, unit: "loaf", description: "Healthy multigrain whole wheat bread, no preservatives.", image: "/assets/bread.png", rating: 4.5, reviews: 312, is_featured: false, is_deal: false },
  { name: "Chocolate Muffins", category: "Bakery", price: 120, original_price: 150, unit: "4-pack", description: "Rich, moist chocolate muffins with chocolate chips.", image: "/assets/croissant.png", rating: 4.6, reviews: 143, is_featured: false, is_deal: true },

  // ===== MEAT & SEAFOOD =====
  { name: "Chicken Breast", category: "Meat & Seafood", price: 320, original_price: null, unit: "kg", description: "Boneless, skinless chicken breast. Antibiotic-free.", image: "/assets/chicken.png", rating: 4.6, reviews: 301, is_featured: true, is_deal: false },
  { name: "Atlantic Salmon", category: "Meat & Seafood", price: 899, original_price: 1099, unit: "kg", description: "Fresh Atlantic salmon fillet, sustainably sourced.", image: "/assets/salmon.png", rating: 4.8, reviews: 176, is_featured: true, is_deal: true },
  { name: "Mutton (Goat Meat)", category: "Meat & Seafood", price: 750, original_price: null, unit: "kg", description: "Premium quality fresh goat meat, perfect for curry.", image: "/assets/chicken.png", rating: 4.7, reviews: 198, is_featured: false, is_deal: false },
  { name: "Prawns", category: "Meat & Seafood", price: 450, original_price: 550, unit: "500g", description: "Fresh tiger prawns, cleaned and deveined.", image: "/assets/salmon.png", rating: 4.5, reviews: 134, is_featured: false, is_deal: true },

  // ===== PANTRY =====
  { name: "Extra Virgin Olive Oil", category: "Pantry", price: 649, original_price: null, unit: "bottle", description: "Cold-pressed extra virgin olive oil from Mediterranean groves.", image: "/assets/oliveoil.png", rating: 4.9, reviews: 356, is_featured: true, is_deal: false },
  { name: "Jasmine Rice", category: "Pantry", price: 399, original_price: 499, unit: "5kg bag", description: "Premium Thai jasmine rice, fragrant and fluffy.", image: "/assets/rice.png", rating: 4.7, reviews: 289, is_featured: false, is_deal: true },
  { name: "Organic Honey", category: "Pantry", price: 349, original_price: null, unit: "500g", description: "Pure raw organic honey, unprocessed and unfiltered.", image: "/assets/oliveoil.png", rating: 4.8, reviews: 223, is_featured: false, is_deal: false },
  { name: "Penne Pasta", category: "Pantry", price: 89, original_price: null, unit: "500g", description: "Imported Italian durum wheat penne pasta.", image: "/assets/rice.png", rating: 4.4, reviews: 167, is_featured: false, is_deal: false },
  { name: "Toor Dal", category: "Pantry", price: 145, original_price: 180, unit: "kg", description: "Premium quality split pigeon pea dal for everyday cooking.", image: "/assets/rice.png", rating: 4.6, reviews: 298, is_featured: false, is_deal: true },

  // ===== BEVERAGES =====
  { name: "Sparkling Water", category: "Beverages", price: 149, original_price: null, unit: "12-pack", description: "Refreshing natural sparkling water with a hint of lime.", image: "/assets/sparklingwater.png", rating: 4.5, reviews: 167, is_featured: false, is_deal: false },
  { name: "Orange Juice", category: "Beverages", price: 189, original_price: 229, unit: "1 litre", description: "100% pure squeezed orange juice, no pulp, no concentrate.", image: "/assets/orangejuice.png", rating: 4.6, reviews: 234, is_featured: false, is_deal: true },
  { name: "Green Tea", category: "Beverages", price: 199, original_price: null, unit: "100 bags", description: "Organic Japanese green tea, rich in antioxidants.", image: "/assets/sparklingwater.png", rating: 4.7, reviews: 312, is_featured: false, is_deal: false },
  { name: "Cold Coffee", category: "Beverages", price: 79, original_price: null, unit: "bottle", description: "Ready-to-drink cold brew coffee with milk.", image: "/assets/orangejuice.png", rating: 4.3, reviews: 145, is_featured: false, is_deal: false },

  // ===== SNACKS =====
  { name: "Dark Chocolate 70%", category: "Snacks", price: 199, original_price: 249, unit: "100g", description: "Premium Belgian dark chocolate, 70% cocoa.", image: "/assets/croissant.png", rating: 4.8, reviews: 267, is_featured: true, is_deal: true },
  { name: "Mixed Nuts Trail Mix", category: "Snacks", price: 299, original_price: null, unit: "250g", description: "Roasted almonds, cashews, walnuts with dried berries.", image: "/assets/rice.png", rating: 4.6, reviews: 198, is_featured: false, is_deal: false },
  { name: "Masala Chips", category: "Snacks", price: 30, original_price: null, unit: "pack", description: "Crispy potato chips with tangy Indian masala seasoning.", image: "/assets/potato.png", rating: 4.2, reviews: 456, is_featured: false, is_deal: false },
  { name: "Protein Bars", category: "Snacks", price: 149, original_price: 199, unit: "3-pack", description: "High-protein energy bars with nuts and dark chocolate.", image: "/assets/bread.png", rating: 4.5, reviews: 178, is_featured: false, is_deal: true },
];

module.exports = products;
