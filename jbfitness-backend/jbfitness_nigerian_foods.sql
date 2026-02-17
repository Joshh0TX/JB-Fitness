-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: jbfitness
-- Nigerian Foods Reference Table
-- ------------------------------------------------------
-- Server version	8.4.7

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET @OLD_TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `nigerian_foods`
--

DROP TABLE IF EXISTS `nigerian_foods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nigerian_foods` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `food_name` VARCHAR(100) NOT NULL,
  `serving_size` VARCHAR(50),
  `calories` INT,
  `protein` DECIMAL(5,2),
  `carbs` DECIMAL(5,2),
  `fat` DECIMAL(5,2),
  KEY `idx_food_name` (`food_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET @saved_cs_client = @@character_set_client */;

--
-- Dumping data for table `nigerian_foods`
--

LOCK TABLES `nigerian_foods` WRITE;
/*!40000 ALTER TABLE `nigerian_foods` DISABLE KEYS */;
INSERT INTO nigerian_foods (food_name, serving_size, calories, protein, carbs, fat) VALUES
('Jollof Rice', '1 cup', 320, 6, 55, 8),
('Fried Rice', '1 cup', 350, 7, 50, 12),
('White Rice', '1 cup', 205, 4, 45, 0.5),
('Coconut Rice', '1 cup', 380, 5, 52, 15),
('Ofada Rice', '1 cup', 210, 5, 44, 1),
('Brown Rice', '1 cup', 216, 5, 45, 2),
('Pounded Yam', '1 wrap', 420, 4, 95, 1),
('Amala', '1 wrap', 350, 3, 80, 0.5),
('Eba (Garri)', '1 wrap', 360, 2, 85, 0.5),
('Semovita', '1 wrap', 400, 3, 88, 1),
('Fufu', '1 wrap', 380, 2, 90, 0.5),
('Tuwo Shinkafa', '1 wrap', 390, 4, 87, 0.5),
('Wheat Swallow', '1 wrap', 340, 6, 70, 2),
('Oat Swallow', '1 wrap', 300, 7, 55, 4),
('Egusi Soup', '1 serving', 450, 18, 10, 35),
('Ogbono Soup', '1 serving', 420, 15, 8, 34),
('Okra Soup', '1 serving', 180, 10, 12, 9),
('Efo Riro', '1 serving', 220, 12, 8, 14),
('Afang Soup', '1 serving', 300, 20, 7, 20),
('Edikang Ikong', '1 serving', 320, 22, 6, 22),
('Bitterleaf Soup', '1 serving', 310, 18, 9, 21),
('Oha Soup', '1 serving', 290, 16, 10, 19),
('Banga Soup', '1 serving', 350, 14, 12, 26),
('Fisherman Soup', '1 serving', 330, 25, 5, 20),
('Pepper Soup (Goat)', '1 bowl', 180, 22, 3, 8),
('Pepper Soup (Chicken)', '1 bowl', 150, 20, 2, 6),
('Moi Moi', '1 wrap', 250, 12, 28, 10),
('Akara', '3 balls', 270, 9, 20, 16),
('Beans (Plain)', '1 cup', 240, 15, 40, 1),
('Beans Porridge', '1 cup', 300, 14, 42, 6),
('Beans and Plantain', '1 plate', 420, 12, 65, 10),
('Yam (Boiled)', '1 cup', 180, 3, 42, 0.5),
('Yam (Fried)', '1 cup', 350, 4, 45, 15),
('Plantain (Boiled)', '1 cup', 220, 2, 58, 0.5),
('Plantain (Fried)', '1 cup', 365, 2, 58, 14),
('Roasted Plantain (Boli)', '1 serving', 280, 2, 65, 1),
('Boli and Fish', '1 plate', 450, 25, 60, 10),
('Suya (Beef)', '100g', 330, 30, 5, 20),
('Grilled Chicken', '1 piece', 250, 28, 0, 14),
('Fried Chicken', '1 piece', 320, 25, 8, 20),
('Boiled Egg', '1 large', 78, 6, 1, 5),
('Fried Egg', '1 large', 90, 6, 1, 7),
('Scrambled Eggs', '2 eggs', 180, 12, 2, 14),
('Spaghetti (Jollof)', '1 cup', 310, 8, 55, 6),
('Spaghetti (Plain)', '1 cup', 220, 7, 43, 1),
('Indomie Noodles', '1 pack', 380, 8, 54, 14),
('Bread (White)', '2 slices', 160, 6, 30, 2),
('Bread (Wheat)', '2 slices', 140, 7, 24, 2),
('Butter Bread', '2 slices', 200, 5, 28, 8),
('Meat Pie', '1 piece', 320, 8, 28, 18),
('Chicken Pie', '1 piece', 300, 10, 26, 15),
('Fish Roll', '1 piece', 280, 9, 30, 14),
('Sausage Roll', '1 piece', 290, 8, 25, 18),
('Puff Puff', '5 balls', 350, 4, 50, 15),
('Doughnut', '1 piece', 260, 4, 31, 14),
('Chin Chin', '1 cup', 400, 6, 50, 18),
('Coconut Candy', '1 piece', 120, 1, 20, 4),
('Kuli Kuli', '50g', 280, 14, 10, 22),
('Groundnuts', '50g', 290, 13, 10, 24),
('Cashew Nuts', '50g', 270, 9, 15, 22),
('Tiger Nuts', '1 cup', 350, 6, 50, 18),
('Zobo Drink', '1 cup', 90, 0, 22, 0),
('Kunu', '1 cup', 120, 3, 25, 2),
('Palm Wine', '1 cup', 150, 1, 18, 0),
('Chapman', '1 glass', 180, 0, 45, 0),
('Malt Drink', '1 bottle', 210, 2, 50, 0),
('Soft Drink', '1 can', 140, 0, 39, 0),
('Yoghurt', '1 cup', 150, 8, 17, 5),
('Ice Cream', '1 cup', 270, 5, 30, 14),
('Custard', '1 cup', 220, 5, 35, 6),
('Pap (Akamu)', '1 cup', 120, 3, 25, 1),
('Ogi with Milk', '1 cup', 180, 6, 28, 5),
('Tea with Milk', '1 cup', 90, 4, 10, 3),
('Coffee with Milk', '1 cup', 60, 3, 6, 2),
('Hot Chocolate', '1 cup', 190, 5, 30, 6),
('Corn (Boiled)', '1 cob', 150, 5, 32, 2),
('Corn (Roasted)', '1 cob', 160, 5, 34, 2),
('Popcorn', '1 cup', 110, 3, 22, 1),
('Sweet Potato (Boiled)', '1 cup', 180, 4, 41, 0.5),
('Sweet Potato (Fried)', '1 cup', 360, 4, 45, 18),
('Irish Potato (Boiled)', '1 cup', 160, 4, 37, 0.2),
('Irish Potato (Fried)', '1 cup', 365, 4, 48, 17),
('Chicken Stew', '1 serving', 220, 18, 5, 14),
('Beef Stew', '1 serving', 280, 20, 6, 20),
('Fish Stew', '1 serving', 240, 22, 4, 16),
('Tomato Stew', '1 serving', 150, 4, 10, 10),
('Egg Sauce', '1 serving', 210, 12, 5, 15),
('Vegetable Sauce', '1 serving', 160, 6, 8, 10),
('Cabbage Salad', '1 cup', 90, 2, 10, 5),
('Coleslaw', '1 cup', 180, 2, 15, 12),
('Avocado', '1 fruit', 240, 3, 12, 22),
('Banana', '1 medium', 105, 1, 27, 0.3),
('Orange', '1 medium', 62, 1, 15, 0.2),
('Apple', '1 medium', 95, 0.5, 25, 0.3),
('Pineapple', '1 cup', 82, 1, 22, 0.2),
('Watermelon', '1 cup', 46, 1, 11, 0.2),
('Mango', '1 cup', 100, 1, 25, 0.4),
('Abacha (African Salad)', '1 plate', 420, 12, 50, 18),
('Ukwa (Breadfruit Porridge)', '1 cup', 350, 10, 55, 10),
('Ekpang Nkukwo', '1 serving', 400, 14, 45, 18),
('Nkwobi', '1 plate', 480, 22, 8, 38),
('Isi Ewu', '1 plate', 500, 25, 6, 40),
('Asun (Spicy Goat Meat)', '1 plate', 450, 28, 5, 35),
('Kilishi', '50g', 220, 30, 6, 8),
('Dambu Nama', '1 serving', 250, 32, 4, 10),
('Dambu Kifi', '1 serving', 230, 28, 5, 9),
('Balangu', '100g', 270, 26, 0, 18),
('Tuwon Masara', '1 wrap', 360, 5, 80, 1),
('Tuwon Dawa', '1 wrap', 340, 6, 70, 2),
('Miyan Kuka', '1 serving', 210, 15, 10, 12),
('Miyan Taushe', '1 serving', 230, 12, 18, 10),
('Miyan Zogale', '1 serving', 200, 14, 12, 9),
('Danwake', '1 plate', 380, 14, 60, 8),
('Fura da Nono', '1 bowl', 320, 10, 45, 12),
('Kosai', '4 balls', 300, 10, 22, 18),
('Waina (Rice Cake)', '2 pieces', 240, 6, 42, 5),
('Masa', '2 pieces', 260, 7, 44, 6),
('Sinasir', '2 pieces', 250, 6, 43, 5),
('Kunun Gyada', '1 cup', 210, 7, 25, 9),
('Kunun Zaki', '1 cup', 140, 3, 30, 2),
('Kunun Aya', '1 cup', 190, 5, 28, 7),
('Lamb Pepper Soup', '1 bowl', 200, 24, 2, 9),
('Catfish Pepper Soup', '1 bowl', 160, 22, 1, 6),
('Tilapia Pepper Soup', '1 bowl', 170, 23, 1, 7),
('Stockfish Pepper Soup', '1 bowl', 150, 20, 1, 6),
('Smoked Fish', '100g', 210, 28, 0, 11),
('Grilled Fish', '100g', 190, 26, 0, 9),
('Fried Fish', '100g', 280, 25, 8, 18),
('Goat Meat Stew', '1 serving', 300, 22, 5, 22),
('Turkey Stew', '1 serving', 310, 24, 4, 23),
('Gizzard Stew', '1 serving', 260, 20, 6, 18),
('Gizzard and Plantain', '1 plate', 480, 18, 60, 20),
('Shawarma (Chicken)', '1 wrap', 450, 22, 45, 20),
('Shawarma (Beef)', '1 wrap', 500, 25, 40, 28),
('Burger (Beef)', '1 burger', 520, 26, 45, 28),
('Burger (Chicken)', '1 burger', 480, 24, 42, 22),
('Hot Dog', '1 piece', 290, 10, 24, 18),
('Sandwich (Egg)', '1 sandwich', 260, 12, 28, 10),
('Sandwich (Chicken)', '1 sandwich', 320, 18, 30, 12),
('Sandwich (Tuna)', '1 sandwich', 300, 20, 28, 10),
('Pizza (1 slice)', '1 slice', 285, 12, 36, 10),
('Pancakes', '2 pieces', 230, 6, 38, 6),
('Waffles', '2 pieces', 290, 7, 35, 12),
('French Toast', '2 slices', 300, 10, 35, 14),
('Omelette', '2 eggs', 190, 13, 2, 15),
('Boiled Chicken', '1 piece', 220, 26, 0, 12),
('Boiled Turkey', '1 piece', 240, 28, 0, 13),
('Boiled Goat Meat', '100g', 250, 26, 0, 17),
('Boiled Beef', '100g', 270, 25, 0, 18),
('Coconut', '1 cup', 280, 3, 12, 26),
('Dates', '5 pieces', 120, 1, 31, 0.2),
('Raisins', '1 small box', 90, 1, 22, 0),
('Guava', '1 fruit', 68, 3, 14, 1),
('Pawpaw (Papaya)', '1 cup', 55, 1, 14, 0.2),
('Soursop', '1 cup', 148, 2, 37, 1),
('Agbalumo (African Star Apple)', '1 fruit', 70, 1, 18, 0.5),
('Garden Egg', '1 cup', 40, 1, 10, 0.2),
('Garden Egg Sauce', '1 serving', 160, 5, 15, 9),
('Okpa', '1 wrap', 300, 15, 30, 14),
('Ukodo (Yam Pepper Soup)', '1 bowl', 280, 10, 35, 10),
('Yam and Egg Sauce', '1 plate', 450, 14, 60, 16),
('Rice and Beans', '1 plate', 380, 14, 60, 6),
('Rice and Egg Sauce', '1 plate', 420, 12, 65, 12),
('Rice and Chicken', '1 plate', 500, 28, 60, 15),
('Rice and Beef', '1 plate', 520, 30, 58, 18),
('Rice and Fish', '1 plate', 480, 28, 55, 14),
('Beans and Bread', '1 plate', 420, 18, 60, 8),
('Beans and Yam', '1 plate', 460, 16, 70, 8),
('Yam and Fish', '1 plate', 430, 22, 55, 10),
('Plantain and Egg', '1 plate', 410, 12, 58, 14),
('Plantain and Chicken', '1 plate', 480, 25, 55, 18),
('Plantain and Fish', '1 plate', 450, 24, 54, 16),
('Spaghetti and Chicken', '1 plate', 480, 26, 60, 14),
('Spaghetti and Beef', '1 plate', 500, 28, 58, 18),
('Noodles and Egg', '1 plate', 450, 14, 60, 16),
('Noodles and Chicken', '1 plate', 500, 22, 58, 18),
('Noodles and Beef', '1 plate', 520, 24, 55, 22),
('Bread and Beans', '1 plate', 380, 15, 55, 8),
('Bread and Egg', '1 plate', 320, 12, 35, 14),
('Bread and Sausage', '1 plate', 350, 12, 30, 18),
('Bread and Butter', '2 slices', 220, 5, 28, 10),
('Bread and Jam', '2 slices', 240, 5, 40, 4),
('Cereal with Milk', '1 bowl', 220, 8, 35, 5),
('Cornflakes', '1 bowl', 150, 3, 36, 1),
('Granola', '1 cup', 300, 10, 45, 10),
('Energy Drink', '1 can', 110, 0, 28, 0),
('Fruit Juice', '1 cup', 120, 1, 28, 0),
('Smoothie', '1 cup', 180, 4, 35, 3),
('Milk (Full Cream)', '1 cup', 150, 8, 12, 8),
('Milk (Low Fat)', '1 cup', 100, 8, 12, 2),
('Chocolate Milk', '1 cup', 210, 8, 26, 8),
('Cheese', '1 slice', 110, 7, 1, 9),
('Butter', '1 tbsp', 100, 0, 0, 11),
('Mayonnaise', '1 tbsp', 94, 0, 0, 10),
('Salad Dressing', '2 tbsp', 120, 0, 4, 12),
('Vegetable Soup', '1 bowl', 140, 6, 12, 7),
('Chicken Salad', '1 bowl', 280, 20, 10, 18),
('Tuna Salad', '1 bowl', 260, 22, 8, 16);
/*!40000 ALTER TABLE `nigerian_foods` ENABLE KEYS */;
UNLOCK TABLES;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET @OLD_UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40101 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-17 00:00:00
