const products = [
  {
    "name": "Organic Bananas",
    "category": "Fruits",
    "price": 49,
    "unit": "bunch",
    "description": "Sweet, ripe organic bananas. Perfect for smoothies, snacking, or baking.",
    "image": "/assets/banana.png",
    "rating": 4.7,
    "reviews": 234
  },
  {
    "name": "Fresh Strawberries",
    "category": "Fruits",
    "price": 199,
    "unit": "pack",
    "description": "Hand-picked, juicy strawberries bursting with flavor.",
    "image": "/assets/strawberry.png",
    "rating": 4.8,
    "reviews": 189
  },
  {
    "name": "Avocados",
    "category": "Fruits",
    "price": 149,
    "unit": "each",
    "description": "Perfectly ripe Hass avocados, ready to eat today.",
    "image": "/assets/avocado.png",
    "rating": 4.5,
    "reviews": 312
  },
  {
    "name": "Red Apples",
    "category": "Fruits",
    "price": 179,
    "unit": "kg",
    "description": "Crisp and sweet Fuji apples, farm fresh.",
    "image": "/assets/apple.png",
    "rating": 4.6,
    "reviews": 198
  },
  {
    "name": "Fresh Broccoli",
    "category": "Vegetables",
    "price": 89,
    "unit": "head",
    "description": "Vibrant green broccoli crowns, packed with nutrients.",
    "image": "/assets/broccoli.png",
    "rating": 4.4,
    "reviews": 156
  },
  {
    "name": "Baby Spinach",
    "category": "Vegetables",
    "price": 45,
    "unit": "bunch",
    "description": "Tender baby spinach leaves, pre-washed and ready to use.",
    "image": "/assets/spinach.png",
    "rating": 4.6,
    "reviews": 201
  },
  {
    "name": "Sweet Carrots",
    "category": "Vegetables",
    "price": 35,
    "unit": "kg",
    "description": "Crunchy, naturally sweet carrots. Great for snacking or cooking.",
    "image": "/assets/carrot.png",
    "rating": 4.5,
    "reviews": 178
  },
  {
    "name": "Cherry Tomatoes",
    "category": "Vegetables",
    "price": 60,
    "unit": "kg",
    "description": "Vine-ripened cherry tomatoes, bursting with sweetness.",
    "image": "/assets/tomato.png",
    "rating": 4.7,
    "reviews": 220
  },
  {
    "name": "Whole Milk",
    "category": "Dairy",
    "price": 68,
    "unit": "litre",
    "description": "Farm-fresh whole milk, pasteurized and homogenized.",
    "image": "/assets/milk.png",
    "rating": 4.8,
    "reviews": 340
  },
  {
    "name": "Greek Yogurt",
    "category": "Dairy",
    "price": 120,
    "unit": "500g",
    "description": "Thick, creamy Greek yogurt with live active cultures.",
    "image": "/assets/yogurt.png",
    "rating": 4.7,
    "reviews": 287
  },
  {
    "name": "Cheddar Cheese",
    "category": "Dairy",
    "price": 249,
    "unit": "block",
    "description": "Sharp aged cheddar cheese, perfect for sandwiches or snacking.",
    "image": "/assets/cheese.png",
    "rating": 4.6,
    "reviews": 195
  },
  {
    "name": "Free-Range Eggs",
    "category": "Dairy",
    "price": 99,
    "unit": "dozen",
    "description": "Farm-fresh free-range eggs from pasture-raised hens.",
    "image": "/assets/eggs.png",
    "rating": 4.9,
    "reviews": 412
  },
  {
    "name": "Sourdough Bread",
    "category": "Bakery",
    "price": 89,
    "unit": "loaf",
    "description": "Artisan sourdough bread with a crispy crust and tangy flavor.",
    "image": "/assets/bread.png",
    "rating": 4.8,
    "reviews": 267
  },
  {
    "name": "Croissants",
    "category": "Bakery",
    "price": 149,
    "unit": "4-pack",
    "description": "Buttery, flaky French croissants, freshly baked.",
    "image": "/assets/croissant.png",
    "rating": 4.7,
    "reviews": 198
  },
  {
    "name": "Chicken Breast",
    "category": "Meat",
    "price": 320,
    "unit": "kg",
    "description": "Boneless, skinless chicken breast. Antibiotic-free.",
    "image": "/assets/chicken.png",
    "rating": 4.6,
    "reviews": 301
  },
  {
    "name": "Atlantic Salmon",
    "category": "Meat",
    "price": 899,
    "unit": "kg",
    "description": "Fresh Atlantic salmon fillet, sustainably sourced.",
    "image": "/assets/salmon.png",
    "rating": 4.8,
    "reviews": 176
  },
  {
    "name": "Extra Virgin Olive Oil",
    "category": "Pantry",
    "price": 649,
    "unit": "bottle",
    "description": "Cold-pressed extra virgin olive oil from Mediterranean groves.",
    "image": "/assets/oliveoil.png",
    "rating": 4.9,
    "reviews": 356
  },
  {
    "name": "Jasmine Rice",
    "category": "Pantry",
    "price": 399,
    "unit": "5kg bag",
    "description": "Premium Thai jasmine rice, fragrant and fluffy.",
    "image": "/assets/rice.png",
    "rating": 4.7,
    "reviews": 289
  },
  {
    "name": "Sparkling Water",
    "category": "Beverages",
    "price": 149,
    "unit": "12-pack",
    "description": "Refreshing natural sparkling water with a hint of lime.",
    "image": "/assets/sparklingwater.png",
    "rating": 4.5,
    "reviews": 167
  },
  {
    "name": "Orange Juice",
    "category": "Beverages",
    "price": 189,
    "unit": "1 litre",
    "description": "100% pure squeezed orange juice, no pulp, no concentrate.",
    "image": "/assets/orangejuice.png",
    "rating": 4.6,
    "reviews": 234
  },
  {
    "name": "Potato",
    "category": "Vegetables",
    "price": 30,
    "unit": "kg",
    "description": "Versatile starchy root vegetable, essential for Indian cooking.",
    "image": "/assets/potato.png",
    "rating": 4.8,
    "reviews": 99
  },
  {
    "name": "Onion",
    "category": "Vegetables",
    "price": 35,
    "unit": "kg",
    "description": "Essential culinary onion, pungent and flavorful.",
    "image": "/assets/onion.png",
    "rating": 4.6,
    "reviews": 106
  },
  {
    "name": "Cauliflower",
    "category": "Vegetables",
    "price": 40,
    "unit": "head",
    "description": "Fresh white cauliflower head, perfect for gobi dishes.",
    "image": "/assets/cauliflower.png",
    "rating": 4.7,
    "reviews": 95
  },
  {
    "name": "Cabbage",
    "category": "Vegetables",
    "price": 25,
    "unit": "head",
    "description": "Crisp green leafy cabbage for salads and sabzi.",
    "image": "/assets/cabbage.png",
    "rating": 4.4,
    "reviews": 211
  },
  {
    "name": "Spinach (Palak)",
    "category": "Vegetables",
    "price": 30,
    "unit": "bunch",
    "description": "Fresh green spinach leaves, perfect for palak paneer.",
    "image": "/assets/spinach.png",
    "rating": 5,
    "reviews": 179
  },
  {
    "name": "Fenugreek Leaves (Methi)",
    "category": "Vegetables",
    "price": 25,
    "unit": "bunch",
    "description": "Slightly bitter aromatic methi leaves for parathas and sabzi.",
    "image": "/assets/methi.png",
    "rating": 4.4,
    "reviews": 232
  },
  {
    "name": "Coriander Leaves",
    "category": "Vegetables",
    "price": 15,
    "unit": "bunch",
    "description": "Fresh cilantro for garnish and chutney.",
    "image": "/assets/coriander.png",
    "rating": 4.5,
    "reviews": 92
  },
  {
    "name": "Green Chili",
    "category": "Vegetables",
    "price": 40,
    "unit": "kg",
    "description": "Spicy fresh green chilies, essential for Indian cuisine.",
    "image": "/assets/pepper.png",
    "rating": 4.1,
    "reviews": 103
  },
  {
    "name": "Green Peas",
    "category": "Vegetables",
    "price": 80,
    "unit": "kg",
    "description": "Sweet green peas in pod, fresh from the farm.",
    "image": "/assets/peas.png",
    "rating": 4.3,
    "reviews": 72
  },
  {
    "name": "Capsicum (Bell Pepper)",
    "category": "Vegetables",
    "price": 120,
    "unit": "kg",
    "description": "Crunchy green bell peppers for stir-fry and salads.",
    "image": "/assets/pepper.png",
    "rating": 4.2,
    "reviews": 95
  },
  {
    "name": "Bottle Gourd (Lauki)",
    "category": "Vegetables",
    "price": 30,
    "unit": "piece",
    "description": "Light green mild gourd, great for healthy cooking.",
    "image": "/assets/bottlegourd.png",
    "rating": 4.4,
    "reviews": 218
  },
  {
    "name": "Ridge Gourd (Turai)",
    "category": "Vegetables",
    "price": 45,
    "unit": "kg",
    "description": "Ridged green vegetable, popular in Indian cuisine.",
    "image": "/assets/ridgegourd.png",
    "rating": 4.5,
    "reviews": 138
  },
  {
    "name": "Bitter Gourd (Karela)",
    "category": "Vegetables",
    "price": 50,
    "unit": "kg",
    "description": "Bitter but highly nutritious gourd, great for health.",
    "image": "/assets/bittergourd.png",
    "rating": 4.4,
    "reviews": 69
  },
  {
    "name": "Okra (Bhindi)",
    "category": "Vegetables",
    "price": 55,
    "unit": "kg",
    "description": "Tender green ladyfingers, perfect for bhindi masala.",
    "image": "/assets/okra.png",
    "rating": 4.3,
    "reviews": 91
  },
  {
    "name": "Pumpkin (Kaddu)",
    "category": "Vegetables",
    "price": 35,
    "unit": "kg",
    "description": "Sweet orange pumpkin for kaddu sabzi and halwa.",
    "image": "/assets/pumpkin.png",
    "rating": 4.9,
    "reviews": 127
  },
  {
    "name": "Drumstick (Moringa)",
    "category": "Vegetables",
    "price": 60,
    "unit": "bunch",
    "description": "Long green moringa pods for sambar and curry.",
    "image": "/assets/drumstick.png",
    "rating": 4.2,
    "reviews": 176
  },
  {
    "name": "Radish (Mooli)",
    "category": "Vegetables",
    "price": 25,
    "unit": "kg",
    "description": "Crisp white radish for salads, parathas, and sabzi.",
    "image": "/assets/carrot.png",
    "rating": 4.2,
    "reviews": 115
  },
  {
    "name": "Brinjal (Eggplant)",
    "category": "Vegetables",
    "price": 40,
    "unit": "kg",
    "description": "Premium quality purple brinjal for baingan bharta.",
    "image": "/assets/onion.png",
    "rating": 4.7,
    "reviews": 142
  }
];

module.exports = products;
