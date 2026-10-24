-- Seed Pune Restaurants with exact geographical coordinates (Lat/Lng)
-- Kharadi: 18.5514, 73.9352 | Viman Nagar: 18.5679, 73.9143 | Koregaon Park: 18.5362, 73.8940 | Kalyani Nagar: 18.5463, 73.9033 | Aundh: 18.5583, 73.8078

INSERT INTO restaurants (id, owner_id, name, description, cuisine_types, address_line, city, latitude, longitude, is_open, is_active, average_rating, total_ratings_count, cost_for_two, image_url)
VALUES 
(101, 2, 'The Biryani Project', 'Authentic slow-cooked Awadhi and Hyderabadi Dum Biryanis prepared with traditional dum pukht techniques.', 'Biryani, North Indian, Mughlai', 'Shop 4, Ground Floor, World Trade Center, Kharadi', 'Pune', 18.5514, 73.9352, TRUE, TRUE, 4.60, 1840, 600, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80'),
(102, 2, 'Pizza Express & Artisan Cucina', 'Wood-fired sourdough Neapolitan pizzas, freshly rolled handmade pasta, and classic Italian antipasti.', 'Pizza, Italian, Fast Food', 'Phoenix Marketcity, Lower Ground Floor, Viman Nagar', 'Pune', 18.5679, 73.9143, TRUE, TRUE, 4.50, 1220, 750, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80'),
(103, 3, 'The Burger Barn & Grill', 'Gourmet smashed beef-style and spiced chicken burgers, loaded truffle fries, and thick artisanal shakes.', 'Burgers, American, Fast Food', 'Lane 5, North Main Road, Koregaon Park', 'Pune', 18.5362, 73.8940, TRUE, TRUE, 4.40, 950, 500, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80'),
(104, 3, 'Shawarma & Roll Club', 'Juicy rotisserie chicken shawarmas, crispy falafel wraps, and spicy Kolkata kathi rolls.', 'Rolls, Lebanese, Street Food', 'Central Avenue, Near Joggers Park, Kalyani Nagar', 'Pune', 18.5463, 73.9033, TRUE, TRUE, 4.30, 810, 350, 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80'),
(105, 4, 'Pure Punjabi & Thali Hub', 'Rich butter paneer, dal makhani slow cooked for 16 hours, stuffed kulchas, and wholesome grand thalis.', 'North Indian, Punjabi, Thali', 'DP Road, Opp Seasons Hotel, Aundh', 'Pune', 18.5583, 73.8078, TRUE, TRUE, 4.50, 1450, 450, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'),
(106, 4, 'Wok & Bowl Asian Kitchen', 'Sizzling wok-tossed Hakka noodles, crispy Manchurian, spicy Kung Pao chicken, and dim sums.', 'Chinese, Asian, Thai', 'EON Free Zone IT Park, Kharadi', 'Pune', 18.5540, 73.9405, TRUE, TRUE, 4.20, 680, 550, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80');

-- Reset identity sequence for restaurants
SELECT setval('restaurants_id_seq', (SELECT MAX(id) FROM restaurants));

-- Seed Menu Items for Restaurant 101 ('The Biryani Project')
INSERT INTO menu_items (restaurant_id, name, description, price, category, is_veg, is_available, is_active, image_url)
VALUES
(101, 'Hyderabadi Chicken Dum Biryani', 'Fragrant long-grain basmati rice layered with spiced marinated chicken and saffron milk, slow-cooked in sealed clay handi.', 349.00, 'Recommended', FALSE, TRUE, TRUE, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80'),
(101, 'Paneer Tikka Dum Biryani', 'Fresh cottage cheese cubes marinated in tandoori spices, layered with aromatic basmati rice and fried onions.', 299.00, 'Recommended', TRUE, TRUE, TRUE, 'https://images.unsplash.com/photo-1642821373181-696a54913e9a?w=800&q=80'),
(101, 'Murgh Galouti Kebab (4 Pcs)', 'Melt-in-mouth smoked chicken mince kebabs infused with royal Awadhi spices, served with mint chutney.', 249.00, 'Starters', FALSE, TRUE, TRUE, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80'),
(101, 'Crispy Corn & Water Chestnut Tikki', 'Golden fried sweet corn patties blended with green chilies, coriander, and chatpata chaat masala.', 199.00, 'Starters', TRUE, TRUE, TRUE, 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=800&q=80'),
(101, 'Butter Naan', 'Traditional tandoor-baked leavened bread brushed with pure Amul butter.', 45.00, 'Breads & Accompaniments', TRUE, TRUE, TRUE, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80'),
(101, 'Burani Garlic Raita', 'Thick creamy whisked curd tempered with roasted garlic flakes and roasted cumin powder.', 55.00, 'Breads & Accompaniments', TRUE, TRUE, TRUE, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80'),
(101, 'Shahi Tukda with Rabri', 'Crisp fried bread soaked in saffron sugar syrup, topped with rich condensed milk rabri and silver vark.', 129.00, 'Desserts', TRUE, TRUE, TRUE, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80');

-- Seed Menu Items for Restaurant 102 ('Pizza Express & Artisan Cucina')
INSERT INTO menu_items (restaurant_id, name, description, price, category, is_veg, is_available, is_active, image_url)
VALUES
(102, 'Margherita Burrata Sourdough Pizza', 'San Marzano tomato sauce, fresh creamy burrata heart, torn basil leaves, and extra virgin olive oil.', 420.00, 'Recommended', TRUE, TRUE, TRUE, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80'),
(102, 'Spicy Pepperoni & Hot Honey Pizza', 'Crispy cup-and-char pork pepperoni slices, crushed red pepper flakes, and hot chili-infused honey drizzle.', 490.00, 'Recommended', FALSE, TRUE, TRUE, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80'),
(102, 'Truffle Parmesan Fries', 'Twice-cooked golden fries tossed in black truffle oil, freshly grated parmesan cheese, and rosemary salt.', 220.00, 'Starters', TRUE, TRUE, TRUE, 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800&q=80'),
(102, 'Classic Tiramisu Cup', 'Espresso-soaked Italian savoiardi ladyfingers layered with whipped mascarpone cream and dusted cocoa.', 210.00, 'Desserts', TRUE, TRUE, TRUE, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80');

-- Seed Menu Items for Restaurant 103 ('The Burger Barn & Grill')
INSERT INTO menu_items (restaurant_id, name, description, price, category, is_veg, is_available, is_active, image_url)
VALUES
(103, 'Double Smash Cheeseburger', 'Two smashed crispy beef patties, melted sharp cheddar slices, caramelized onions, and secret barn sauce on brioche bun.', 360.00, 'Recommended', FALSE, TRUE, TRUE, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80'),
(103, 'Crispy Buttermilk Chicken Burger', '24-hour buttermilk brined fried chicken breast, dill pickles, spicy coleslaw, and honey mustard.', 320.00, 'Recommended', FALSE, TRUE, TRUE, 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&q=80'),
(103, 'Spicy Black Bean & Quinoa Burger', 'House-made spiced black bean and quinoa patty, smashed avocado, jalapeños, and chipotle mayo.', 280.00, 'Recommended', TRUE, TRUE, TRUE, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800&q=80');

-- Seed Menu Items for Restaurant 105 ('Pure Punjabi & Thali Hub')
INSERT INTO menu_items (restaurant_id, name, description, price, category, is_veg, is_available, is_active, image_url)
VALUES
(105, 'Grand Maharaja Veg Thali', 'Paneer Butter Masala, Dal Makhani, Pindi Chole, 2 Butter Naan, Jeera Rice, Gulab Jamun, Salad & Raita.', 380.00, 'Recommended', TRUE, TRUE, TRUE, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'),
(105, 'Slow-Cooked Dal Makhani', 'Black lentils simmered overnight with butter, fresh tomato puree, and a touch of cream.', 240.00, 'Main Course', TRUE, TRUE, TRUE, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80'),
(105, 'Amritsari Kulcha with Chole', 'Crispy layered flatbread stuffed with spiced potatoes and onions, served with tangy Punjabi chole.', 180.00, 'Main Course', TRUE, TRUE, TRUE, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80');
