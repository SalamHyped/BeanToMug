-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 12, 2025 at 02:52 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `beantomug`
--
CREATE DATABASE IF NOT EXISTS `beantomug` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `beantomug`;

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(255) NOT NULL,
  `category_photo_url` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`category_id`, `category_name`, `category_photo_url`) VALUES
(1, 'Hot-Coffee', 'http://localhost/photos_db_beanToMug/hot-coffee.png'),
(2, 'Cold-Tea', 'http://localhost/photos_db_beanToMug/cold-coffee.png'),
(3, 'Hot-Tea', 'http://localhost/photos_db_beanToMug/hot-tea.png'),
(4, 'Cold-Tea', 'http://localhost/photos_db_beanToMug/cold-tea.png'),
(5, 'Bottled-Beverages', '');

-- --------------------------------------------------------

--
-- Table structure for table `dish`
--

CREATE TABLE `dish` (
  `item_id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `price` decimal(8,2) DEFAULT NULL,
  `item_type` varchar(255) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `item_photo_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `dish`
--

INSERT INTO `dish` (`item_id`, `item_name`, `status`, `price`, `item_type`, `category_id`, `item_photo_url`) VALUES
(1, 'Americano', 1, 13.00, 'drink', 1, 'http://localhost/photos_db_beanToMug/Americano.webp'),
(2, 'Big Cappuccino', 1, 17.00, 'drink', 1, NULL),
(3, 'Small Cappuccino', 1, 15.00, 'drink', 1, NULL),
(4, 'Espresso', 1, 10.00, 'drink', 1, NULL),
(5, 'Espresso Macchiato\r\n', 1, 10.00, 'drink', 1, NULL),
(6, 'Big Latte', 1, 17.00, 'drink', 1, NULL),
(7, 'Small Latte', 1, 15.00, 'drink', 1, NULL),
(8, 'Mocha', 1, 20.00, 'drink', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `gallery`
--

CREATE TABLE `gallery` (
  `post_id` int(11) NOT NULL,
  `photo-url` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `description` text DEFAULT NULL,
  `file_type` varchar(20) DEFAULT NULL,
  `publish_date` date DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ingredient`
--

CREATE TABLE `ingredient` (
  `ingredient_id` int(11) NOT NULL,
  `ingredient_name` varchar(255) NOT NULL,
  `price` decimal(8,2) NOT NULL,
  `brand` varchar(255) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `expiration` date NOT NULL,
  `unit` varchar(20) NOT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `quantity_in_stock` decimal(10,2) DEFAULT 0.00,
  `low_stock_threshold` decimal(10,2) DEFAULT 100.00,
  `type_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `ingredient`
--

INSERT INTO `ingredient` (`ingredient_id`, `ingredient_name`, `price`, `brand`, `status`, `expiration`, `unit`, `supplier_id`, `quantity_in_stock`, `low_stock_threshold`, `type_id`) VALUES
(1, 'Extra Shot', 2.00, 'Premium Coffee', 1, '2025-12-31', 'shot', NULL, 100.00, 10.00, 1),
(2, 'Caramel Syrup', 1.50, 'Monin', 1, '2025-12-31', 'ml', NULL, 500.00, 50.00, 2),
(3, 'Vanilla Syrup', 1.50, 'Monin', 1, '2025-12-31', 'ml', NULL, 500.00, 50.00, 2),
(4, 'Whipped Cream', 1.00, 'Fresh Dairy', 1, '2025-12-31', 'serving', NULL, 200.00, 20.00, 3),
(5, 'Chocolate Sauce', 1.00, 'Hershey', 1, '2025-12-31', 'ml', NULL, 300.00, 30.00, 2),
(6, 'Almond Milk', 2.00, 'Silk', 1, '2025-12-31', 'ml', NULL, 1000.00, 100.00, 4),
(7, 'Soy Milk', 1.80, 'Silk', 1, '2025-12-31', 'ml', NULL, 1000.00, 100.00, 4),
(8, 'Oat Milk', 2.20, 'Oatly', 1, '2025-12-31', 'ml', NULL, 800.00, 80.00, 4);

-- --------------------------------------------------------

--
-- Table structure for table `ingredients_in_item`
--

CREATE TABLE `ingredients_in_item` (
  `ingredient_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity_required` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`ingredient_id`,`item_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `ingredients_in_item_ibfk_1` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredient` (`ingredient_id`),
  CONSTRAINT `ingredients_in_item_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `dish` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `ingredients_in_item`
--

INSERT INTO `ingredients_in_item` (`ingredient_id`, `item_id`, `quantity_required`) VALUES
(1, 1, 0.00),
(2, 1, 0.00),
(3, 1, 0.00),
(4, 1, 0.00),
(5, 1, 0.00),
(6, 1, 0.00),
(7, 1, 0.00),
(8, 1, 0.00),
(1, 2, 0.00),
(2, 2, 0.00),
(3, 2, 0.00),
(4, 2, 0.00),
(5, 2, 0.00),
(6, 2, 0.00),
(7, 2, 0.00),
(8, 2, 0.00),
(1, 3, 0.00),
(2, 3, 0.00),
(3, 3, 0.00),
(4, 3, 0.00),
(5, 3, 0.00),
(6, 3, 0.00),
(7, 3, 0.00),
(8, 3, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `ingredient_category`
--

CREATE TABLE `ingredient_category` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `type_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `ingredient_category`
--

INSERT INTO `ingredient_category` (`id`, `name`, `type_id`) VALUES
(1, 'Coffee Additions', 1),
(2, 'Syrups', 2),
(3, 'Toppings', 3),
(4, 'Milk Alternatives', 4);

-- --------------------------------------------------------

--
-- Table structure for table `ingredient_type`
--

CREATE TABLE `ingredient_type` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `option_group` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `ingredient_type`
--

INSERT INTO `ingredient_type` (`id`, `name`, `option_group`) VALUES
(1, 'Extra Shot', 'Coffee Additions'),
(2, 'Syrup', 'Syrups'),
(3, 'Topping', 'Toppings'),
(4, 'Milk Alternative', 'Milk Alternatives');

-- --------------------------------------------------------

--
-- Table structure for table `item_option_type`
--

CREATE TABLE `item_option_type` (
  `item_id` int(11) NOT NULL,
  `type_id` int(11) NOT NULL,
  `is_required` tinyint(1) DEFAULT 0,
  `is_multiple` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `paypal_order_id` varchar(255) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `order_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','completed','failed','refunded') NOT NULL,
  `rating` int(11) DEFAULT 0,
  `phone_number` char(10) DEFAULT NULL,
  `order_type` enum('Dine In','Take Away') NOT NULL DEFAULT 'Dine In',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` varchar(255) NOT NULL DEFAULT current_timestamp(),
  `is_cart` tinyint(4) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `paypal_order_id`, `user_id`, `total_price`, `order_date`, `status`, `rating`, `phone_number`, `order_type`, `created_at`, `updated_at`, `is_cart`) VALUES
(1, '70C78950VM5551054', NULL, 39.00, '2025-06-03 08:03:52', 'pending', 0, NULL, 'Dine In', '2025-06-03 08:03:52', '2025-06-03 11:03:52', 0),
(2, '2NU703855X541215K', NULL, 39.00, '2025-06-03 08:05:10', 'pending', 0, NULL, 'Dine In', '2025-06-03 08:05:10', '2025-06-03 11:05:10', 0),
(3, '1ET61850J5372533X', NULL, 65.00, '2025-06-03 08:07:01', 'completed', 0, NULL, 'Dine In', '2025-06-03 08:07:01', '2025-06-03 11:07:37', 0),
(18, '92N858329F657122N', 17, 103.00, '2025-06-07 13:05:39', 'completed', 4, NULL, 'Take Away', '2025-06-07 13:05:39', '2025-06-09 23:45:09', 0),
(19, '2B604811LT504811P', NULL, 26.00, '2025-06-08 17:56:49', 'completed', 0, NULL, 'Dine In', '2025-06-08 17:56:49', '2025-06-08 20:57:47', 0),
(20, '9NA93475LH905481X', NULL, 13.00, '2025-06-08 18:34:28', 'completed', 0, NULL, 'Dine In', '2025-06-08 18:34:28', '2025-06-08 21:35:21', 0),
(21, '8UP01057SB848751H', NULL, 13.00, '2025-06-08 18:47:16', 'completed', 0, NULL, 'Dine In', '2025-06-08 18:47:16', '2025-06-08 21:48:15', 0),
(22, '51P32874MV041581G', NULL, 13.00, '2025-06-08 18:52:34', 'pending', 0, NULL, 'Dine In', '2025-06-08 18:52:34', '2025-06-08 21:52:34', 0),
(23, '1A290307CV5463728', NULL, 13.00, '2025-06-08 18:52:49', 'pending', 0, NULL, 'Dine In', '2025-06-08 18:52:49', '2025-06-08 21:52:49', 0),
(24, '0DK87719RS4025219', NULL, 13.00, '2025-06-08 18:54:21', 'completed', 0, NULL, 'Dine In', '2025-06-08 18:54:21', '2025-06-08 21:55:21', 0),
(25, '7KE63609JR522000W', NULL, 13.00, '2025-06-08 18:58:46', 'completed', 0, NULL, 'Dine In', '2025-06-08 18:58:46', '2025-06-08 21:59:41', 0),
(26, '3NY073892H629521X', NULL, 52.00, '2025-06-08 19:02:51', 'completed', 0, NULL, 'Dine In', '2025-06-08 19:02:51', '2025-06-08 22:03:59', 0),
(27, '87329554AN9389155', NULL, 13.00, '2025-06-08 19:05:46', 'completed', 0, NULL, 'Dine In', '2025-06-08 19:05:46', '2025-06-08 22:06:32', 0),
(28, '4PG27800S1835694B', NULL, 13.00, '2025-06-08 19:39:57', 'pending', 0, NULL, 'Dine In', '2025-06-08 19:39:57', '2025-06-08 22:39:57', 0),
(29, '385588592S635043L', NULL, 13.00, '2025-06-08 19:40:43', 'pending', 0, NULL, 'Dine In', '2025-06-08 19:40:43', '2025-06-08 22:40:43', 0),
(30, '15J60042WE665223T', NULL, 13.00, '2025-06-08 19:41:45', 'pending', 0, NULL, 'Dine In', '2025-06-08 19:41:45', '2025-06-08 22:41:45', 0),
(31, '3RA17980JG015050H', NULL, 13.00, '2025-06-08 19:44:21', 'pending', 0, NULL, 'Dine In', '2025-06-08 19:44:21', '2025-06-08 22:44:21', 0),
(32, '01S681377N429721F', NULL, 13.00, '2025-06-08 19:44:45', 'pending', 0, NULL, 'Dine In', '2025-06-08 19:44:45', '2025-06-08 22:44:45', 0),
(33, '5KV74371U9917193S', NULL, 13.00, '2025-06-08 19:52:54', 'pending', 0, NULL, 'Dine In', '2025-06-08 19:52:54', '2025-06-08 22:52:54', 0),
(34, '1SU39328BM871610K', NULL, 13.00, '2025-06-08 20:00:56', 'pending', 0, NULL, 'Dine In', '2025-06-08 20:00:56', '2025-06-08 23:00:56', 0),
(35, '9L0624922E0828047', NULL, 13.00, '2025-06-08 20:06:38', 'pending', 0, NULL, 'Dine In', '2025-06-08 20:06:38', '2025-06-08 23:06:38', 0),
(36, '3HG705253L4773530', NULL, 13.00, '2025-06-08 21:17:24', 'pending', 0, NULL, 'Dine In', '2025-06-08 21:17:24', '2025-06-09 00:17:24', 0),
(37, '88D4273846412862T', NULL, 13.00, '2025-06-08 21:18:53', 'completed', 0, NULL, 'Dine In', '2025-06-08 21:18:53', '2025-06-09 00:19:41', 0),
(38, '0WV13643YX075861M', NULL, 13.00, '2025-06-08 21:45:37', 'pending', 0, NULL, 'Dine In', '2025-06-08 21:45:37', '2025-06-09 00:45:37', 0),
(39, '0C3869462D542925U', NULL, 13.00, '2025-06-08 21:46:29', 'pending', 0, NULL, 'Dine In', '2025-06-08 21:46:29', '2025-06-09 00:46:29', 0),
(40, '9RT08000M4200805A', NULL, 13.00, '2025-06-08 21:46:55', 'pending', 0, NULL, 'Dine In', '2025-06-08 21:46:55', '2025-06-09 00:46:55', 0),
(41, '4GV00359FT5605932', NULL, 13.00, '2025-06-08 21:47:01', 'completed', 0, NULL, 'Dine In', '2025-06-08 21:47:01', '2025-06-09 00:47:47', 0),
(42, '6WR39395NE101264D', NULL, 26.00, '2025-06-08 21:49:24', 'completed', 0, NULL, 'Dine In', '2025-06-08 21:49:24', '2025-06-09 00:50:15', 0),
(43, '01052486L4241103G', NULL, 13.00, '2025-06-08 21:54:36', 'completed', 0, NULL, 'Dine In', '2025-06-08 21:54:36', '2025-06-09 00:55:34', 0),
(44, '0XT00842FH020752M', NULL, 13.00, '2025-06-08 21:57:13', 'completed', 0, NULL, 'Dine In', '2025-06-08 21:57:13', '2025-06-09 00:57:52', 0),
(45, '0SY67607UC898711V', NULL, 39.00, '2025-06-08 22:15:26', 'completed', 4, NULL, 'Dine In', '2025-06-08 22:15:26', '2025-06-09 01:16:13', 0),
(46, '5SH67821EY488473C', 17, 13.00, '2025-06-09 20:46:44', 'pending', 0, NULL, 'Dine In', '2025-06-09 20:46:44', '2025-06-09 23:48:14', 0),
(47, NULL, 17, 13.00, '2025-06-09 20:48:48', 'pending', 0, NULL, 'Dine In', '2025-06-09 20:48:48', '2025-06-11 00:04:40', 1),
(48, NULL, 16, 0.00, '2025-06-09 22:33:25', 'pending', 0, NULL, 'Dine In', '2025-06-09 22:33:25', '2025-06-10 01:33:25', 1),
(49, '5MW927578W325693P', NULL, 13.00, '2025-06-10 09:02:51', 'completed', 3, NULL, 'Dine In', '2025-06-10 09:02:51', '2025-06-10 12:03:35', 0);

-- --------------------------------------------------------

--
-- Table structure for table `order_ingredients`
--

CREATE TABLE `order_ingredients` (
  `product_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `quantity_in_order` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `item_id`, `quantity`, `price`, `created_at`, `updated_at`) VALUES
(38, 1, 1, 2, 13.00, '0000-00-00 00:00:00', '2025-06-07 13:25:26'),
(39, 1, 1, 1, 13.00, '0000-00-00 00:00:00', '2025-06-07 13:25:26'),
(40, 2, 1, 2, 13.00, '0000-00-00 00:00:00', '2025-06-07 13:25:26'),
(41, 2, 1, 1, 13.00, '0000-00-00 00:00:00', '2025-06-07 13:25:26'),
(42, 3, 1, 3, 13.00, '0000-00-00 00:00:00', '2025-06-07 13:25:26'),
(43, 3, 1, 1, 13.00, '0000-00-00 00:00:00', '2025-06-07 13:25:26'),
(44, 3, 1, 1, 13.00, '0000-00-00 00:00:00', '2025-06-07 13:25:26'),
(56, 19, 1, 2, 13.00, '2025-06-08 17:56:49', '2025-06-08 17:56:49'),
(57, 20, 1, 1, 13.00, '2025-06-08 18:34:28', '2025-06-08 18:34:28'),
(58, 21, 1, 1, 13.00, '2025-06-08 18:47:16', '2025-06-08 18:47:16'),
(59, 22, 1, 1, 13.00, '2025-06-08 18:52:34', '2025-06-08 18:52:34'),
(60, 23, 1, 1, 13.00, '2025-06-08 18:52:49', '2025-06-08 18:52:49'),
(61, 24, 1, 1, 13.00, '2025-06-08 18:54:21', '2025-06-08 18:54:21'),
(62, 25, 1, 1, 13.00, '2025-06-08 18:58:46', '2025-06-08 18:58:46'),
(63, 26, 1, 4, 13.00, '2025-06-08 19:02:51', '2025-06-08 19:02:51'),
(64, 27, 1, 1, 13.00, '2025-06-08 19:05:46', '2025-06-08 19:05:46'),
(65, 18, 1, 1, 13.00, '2025-06-08 19:19:18', '2025-06-08 19:19:18'),
(66, 28, 1, 1, 13.00, '2025-06-08 19:39:57', '2025-06-08 19:39:57'),
(67, 29, 1, 1, 13.00, '2025-06-08 19:40:43', '2025-06-08 19:40:43'),
(68, 30, 1, 1, 13.00, '2025-06-08 19:41:45', '2025-06-08 19:41:45'),
(69, 31, 1, 1, 13.00, '2025-06-08 19:44:21', '2025-06-08 19:44:21'),
(70, 32, 1, 1, 13.00, '2025-06-08 19:44:45', '2025-06-08 19:44:45'),
(71, 33, 1, 1, 13.00, '2025-06-08 19:52:54', '2025-06-08 19:52:54'),
(72, 34, 1, 1, 13.00, '2025-06-08 20:00:56', '2025-06-08 20:00:56'),
(73, 35, 1, 1, 13.00, '2025-06-08 20:06:38', '2025-06-08 20:06:38'),
(74, 36, 1, 1, 13.00, '2025-06-08 21:17:24', '2025-06-08 21:17:24'),
(75, 37, 1, 1, 13.00, '2025-06-08 21:18:53', '2025-06-08 21:18:53'),
(76, 38, 1, 1, 13.00, '2025-06-08 21:45:37', '2025-06-08 21:45:37'),
(77, 39, 1, 1, 13.00, '2025-06-08 21:46:29', '2025-06-08 21:46:29'),
(78, 40, 1, 1, 13.00, '2025-06-08 21:46:55', '2025-06-08 21:46:55'),
(79, 41, 1, 1, 13.00, '2025-06-08 21:47:01', '2025-06-08 21:47:01'),
(80, 42, 1, 2, 13.00, '2025-06-08 21:49:24', '2025-06-08 21:49:24'),
(81, 43, 1, 1, 13.00, '2025-06-08 21:54:36', '2025-06-08 21:54:36'),
(82, 44, 1, 1, 13.00, '2025-06-08 21:57:13', '2025-06-08 21:57:13'),
(83, 45, 1, 3, 13.00, '2025-06-08 22:15:26', '2025-06-08 22:15:26'),
(84, 18, 2, 1, 17.00, '2025-06-08 22:39:19', '2025-06-08 22:39:19'),
(85, 18, 6, 2, 17.00, '2025-06-08 22:39:24', '2025-06-08 22:39:24'),
(86, 18, 1, 3, 13.00, '2025-06-09 20:10:37', '2025-06-09 20:10:37'),
(88, 46, 1, 1, 13.00, '2025-06-09 20:47:27', '2025-06-09 20:47:27'),
(92, 49, 1, 1, 13.00, '2025-06-10 09:02:51', '2025-06-10 09:02:51'),
(97, 47, 1, 1, 13.00, '2025-06-10 21:04:21', '2025-06-10 21:04:21');

-- --------------------------------------------------------

--
-- Table structure for table `order_item`
--

CREATE TABLE order_item (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES dish(item_id) ON DELETE CASCADE
);

-- --------------------------------------------------------

--
-- Table structure for table `order_item_ingredient`
--

CREATE TABLE order_item_ingredient (
    order_item_ingredient_id INT PRIMARY KEY AUTO_INCREMENT,
    order_item_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_item_id) REFERENCES order_item(order_item_id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredient(ingredient_id) ON DELETE CASCADE
);

-- Update foreign key constraint to reference the correct table
ALTER TABLE order_item_ingredient
DROP FOREIGN KEY order_item_ingredient_ibfk_1,
ADD CONSTRAINT order_item_ingredient_ibfk_1 
FOREIGN KEY (order_item_id) REFERENCES order_item(order_item_id) ON DELETE CASCADE;

-- Add price column to order_item_ingredient if it doesn't exist
ALTER TABLE order_item_ingredient 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- --------------------------------------------------------

--
-- Table structure for table `product_order`
--

CREATE TABLE `product_order` (
  `order_id` int(11) NOT NULL,
  `total_price` decimal(10,2) DEFAULT NULL,
  `order_start_date` datetime DEFAULT current_timestamp(),
  `order_end_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `supplier`
--

CREATE TABLE `supplier` (
  `supplier_id` int(11) NOT NULL,
  `supplier_name` varchar(255) DEFAULT NULL,
  `phone_number` char(10) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `task_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `due_date` datetime DEFAULT NULL,
  `assigned_by` int(11) NOT NULL,
  `estimated_hours` decimal(5,2) DEFAULT NULL,
  `actual_hours` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`task_id`),
  KEY `assigned_by` (`assigned_by`),
  CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_assignments`
--

CREATE TABLE `task_assignments` (
  `assignment_id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `assigned_by` int(11) NOT NULL,
  PRIMARY KEY (`assignment_id`),
  UNIQUE KEY `unique_task_user` (`task_id`, `user_id`),
  KEY `task_id` (`task_id`),
  KEY `user_id` (`user_id`),
  KEY `assigned_by` (`assigned_by`),
  CONSTRAINT `task_assignments_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE CASCADE,
  CONSTRAINT `task_assignments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_assignments_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_comments`
--

CREATE TABLE `task_comments` (
  `comment_id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `comment` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`comment_id`),
  KEY `task_id` (`task_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `task_comments_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE CASCADE,
  CONSTRAINT `task_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `phone_number` int(10) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `email_verified` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `phone_number`, `username`, `email`, `password`, `role`, `email_verified`) VALUES
(11, '', '', 0, 'fdgdfgdf', 'bewhouaremate@outlook.com', '$2b$10$JsuAqfwSsg3cvHaLl6dsVuGNlNl5DGNj9up5oRD.BzMYKsXPR56Ju', 'customer', 1),
(16, '', '', 0, 'salam', 'shibli.salam30@gmail.com', '$2b$10$BBjbjNXqKz5m5DTaquK./.XZA11GQpdLe30Hw09EmfCVgizna3TES', 'staff', 1),
(17, '', '', 0, 'tyroneHype', 'shiblislam@gmail.com', '$2b$10$fcLbh3IqsOFNhX4UClHoYuvKzXh/vcx5G9kRcTPv3zDvjBMxiv7Ri', 'customer', 1);

-- --------------------------------------------------------

--
-- Table structure for table `workschedule`
--

CREATE TABLE `workschedule` (
  `schedule_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `dish`
--
ALTER TABLE `dish`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `category_id`