-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 15, 2025 at 05:47 PM
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
(1, 'Hot-Coffee', '/uploads/category-photos/category-1755270232724-636896056.png'),
(2, 'Cold-Coffee', '/uploads/category-photos/category-1755270220774-217621319.png'),
(3, 'Hot-Tea', '/uploads/category-photos/category-1755263123184-3685086.png'),
(4, 'Cold-Tea', '/uploads/category-photos/category-1755263113577-566433885.png'),
(5, 'Bottled-Beverages', '/uploads/category-photos/category-1755269258680-531210634.png');

-- --------------------------------------------------------

--
-- Table structure for table `dish`
--

CREATE TABLE `dish` (
  `item_id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `price` decimal(8,2) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `item_photo_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `dish`
--

INSERT INTO `dish` (`item_id`, `item_name`, `status`, `price`, `category_id`, `item_photo_url`) VALUES
(1, 'latte', 1, 0.10, 5, '/uploads/dish-photos/dish-1755181149789-734756887.webp'),
(2, 'test dish ', 1, 15.00, 1, '/uploads/dish-photos/dish-1755181267813-395983654.jpg'),
(3, 'first item', 1, 10.00, 1, '/uploads/dish-photos/dish-1755184312653-617944680.jpg'),
(4, 'Americano', 1, 18.00, 1, '/uploads/dish-photos/dish-1755219462820-367198186.jpg'),
(5, 'Americano', 1, 15.00, 1, '/uploads/dish-photos/dish-1755220416206-996602715.jpg');

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

--
-- Dumping data for table `gallery`
--

INSERT INTO `gallery` (`post_id`, `photo-url`, `description`, `file_type`, `publish_date`, `user_id`) VALUES
(8, '/uploads/gallery/photos/image-1752275917981-47923721.jpg', '', 'image/jpeg', '2025-07-12', 16),
(9, '/uploads/gallery/photos/image-1752275924310-213172704.jpg', '', 'image/jpeg', '2025-07-12', 16),
(10, '/uploads/gallery/photos/image-1752275928309-91429374.jpg', '', 'image/jpeg', '2025-07-12', 16),
(11, '/uploads/gallery/photos/image-1752275934262-387004883.jpg', '', 'image/jpeg', '2025-07-12', 16),
(12, '/uploads/gallery/photos/image-1752275939846-371910115.jpg', '', 'image/jpeg', '2025-07-12', 16),
(13, '/uploads/gallery/photos/image-1752275944701-697495289.jpg', '', 'image/jpeg', '2025-07-12', 16),
(14, '/uploads/gallery/photos/image-1752275948373-64776896.jpg', '', 'image/jpeg', '2025-07-12', 16),
(15, '/uploads/gallery/photos/image-1752275957910-173193521.jpg', '', 'image/jpeg', '2025-07-12', 16),
(16, '/uploads/gallery/photos/image-1752275968310-234621048.jpg', '', 'image/jpeg', '2025-07-12', 16),
(17, '/uploads/gallery/photos/image-1752275974044-578890505.jpg', '', 'image/jpeg', '2025-07-12', 16),
(18, '/uploads/gallery/photos/image-1752275979883-443990689.jpg', '', 'image/jpeg', '2025-07-12', 16),
(22, '/uploads/gallery/photos/image-1752282153588-772858973.jpg', 'we starting our day with coffe and love <3\r\n', 'image/jpeg', '2025-07-12', 16);

-- --------------------------------------------------------

--
-- Table structure for table `ingredient`
--

CREATE TABLE `ingredient` (
  `ingredient_id` int(11) NOT NULL,
  `ingredient_name` varchar(255) NOT NULL,
  `price` decimal(8,2) NOT NULL,
  `brand` varchar(255) DEFAULT NULL,
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
(1, 'cold', 0.00, '', 1, '0000-00-00', '', NULL, 1.00, 100.00, 1),
(2, 'hot', 0.00, '', 1, '0000-00-00', '', NULL, 1.00, 100.00, 1),
(3, 'warm', 1.00, '', 1, '0000-00-00', '', NULL, 0.00, 100.00, 1),
(4, 'big', 1.00, '', 1, '0000-00-00', '', NULL, 1.00, 100.00, 2),
(5, 'small', 1.00, NULL, 1, '0000-00-00', '', NULL, 1.00, 100.00, 2),
(6, 'Extra Shot', 2.00, 'Premium Coffee', 1, '2025-12-31', 'shot', NULL, 100.00, 10.00, 3),
(7, 'Caramel Syrup', 1.50, 'Monin', 1, '2025-12-31', 'ml', NULL, 500.00, 50.00, 4),
(8, 'Vanilla Syrup', 1.50, 'Monin', 1, '2025-12-31', 'ml', NULL, 500.00, 50.00, 4),
(9, 'Whipped Cream', 1.00, 'Fresh Dairy', 1, '2025-12-31', 'serving', NULL, 200.00, 20.00, 5),
(10, 'Chocolate Sauce', 1.00, 'Hershey', 1, '2025-12-31', 'ml', NULL, 300.00, 30.00, 4),
(11, 'Almond Milk', 2.00, 'Silk', 1, '2025-12-31', 'ml', NULL, 1000.00, 100.00, 6),
(12, 'Soy Milk', 1.80, 'Silk', 1, '2025-12-31', 'ml', NULL, 0.00, 100.00, 6),
(13, 'Oat Milk', 2.20, 'Oatly', 1, '2025-12-31', 'ml', NULL, 0.00, 80.00, 6);

-- --------------------------------------------------------

--
-- Table structure for table `ingredients_in_item`
--

CREATE TABLE `ingredients_in_item` (
  `ingredient_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity_required` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `ingredients_in_item`
--

INSERT INTO `ingredients_in_item` (`ingredient_id`, `item_id`, `quantity_required`) VALUES
(4, 5, 10.00),
(5, 2, 0.03),
(11, 2, 500.00),
(11, 3, 50.00),
(11, 4, 40.00),
(11, 5, 50.00),
(12, 4, 40.00),
(13, 4, 40.00);

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
(1, 'temperature', 1),
(2, 'size', 2),
(3, 'Coffee Additions', 3),
(4, 'Syrups', 4),
(5, 'Toppings', 5),
(6, 'Milk Alternatives', 6);

-- --------------------------------------------------------

--
-- Table structure for table `ingredient_type`
--

CREATE TABLE `ingredient_type` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `option_group` text NOT NULL,
  `is_physical` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `ingredient_type`
--

INSERT INTO `ingredient_type` (`id`, `name`, `option_group`, `is_physical`) VALUES
(1, 'temperature', 'choose temperature', 0),
(2, 'size', 'choose size', 1),
(3, 'Extra Shot', 'Coffee Additions', 1),
(4, 'Syrup', 'Syrups', 1),
(5, 'Topping', 'Toppings', 1),
(6, 'Milk Alternative', 'Milk Alternatives', 1);

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

--
-- Dumping data for table `item_option_type`
--

INSERT INTO `item_option_type` (`item_id`, `type_id`, `is_required`, `is_multiple`) VALUES
(3, 2, 1, 0),
(3, 6, 1, 0),
(4, 6, 1, 0),
(5, 2, 1, 0),
(5, 6, 1, 0),
(6, 1, 1, 0),
(6, 2, 1, 0),
(6, 6, 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `paypal_order_id` varchar(255) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) DEFAULT 0.00,
  `vat_amount` decimal(10,2) DEFAULT 0.00,
  `order_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','completed','failed','refunded','processing') NOT NULL,
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

INSERT INTO `orders` (`order_id`, `paypal_order_id`, `user_id`, `total_price`, `subtotal`, `vat_amount`, `order_date`, `status`, `rating`, `phone_number`, `order_type`, `created_at`, `updated_at`, `is_cart`) VALUES
(1, '70C78950VM5551054', NULL, 39.00, 39.00, 0.00, '2025-06-03 08:03:52', 'pending', 0, NULL, 'Dine In', '2025-06-03 08:03:52', '2025-06-03 11:03:52', 0),
(2, '2NU703855X541215K', NULL, 39.00, 39.00, 0.00, '2025-06-03 08:05:10', 'pending', 0, NULL, 'Dine In', '2025-06-03 08:05:10', '2025-06-03 11:05:10', 0),
(3, '1ET61850J5372533X', NULL, 65.00, 65.00, 0.00, '2025-06-03 08:07:01', 'completed', 0, NULL, 'Dine In', '2025-06-03 08:07:01', '2025-08-10 23:00:58', 0),
(18, '92N858329F657122N', 17, 103.00, 103.00, 0.00, '2025-06-07 13:05:39', 'completed', 4, NULL, 'Take Away', '2025-06-07 13:05:39', '2025-08-10 23:05:22', 0),
(19, '2B604811LT504811P', NULL, 26.00, 26.00, 0.00, '2025-06-08 17:56:49', 'completed', 0, NULL, 'Dine In', '2025-06-08 17:56:49', '2025-06-08 20:57:47', 0),
(20, '9NA93475LH905481X', NULL, 13.00, 13.00, 0.00, '2025-06-08 18:34:28', 'completed', 0, NULL, 'Dine In', '2025-06-08 18:34:28', '2025-06-08 21:35:21', 0),
(21, '8UP01057SB848751H', NULL, 13.00, 13.00, 0.00, '2025-06-08 18:47:16', 'completed', 0, NULL, 'Dine In', '2025-06-08 18:47:16', '2025-06-08 21:48:15', 0),
(22, '51P32874MV041581G', NULL, 13.00, 13.00, 0.00, '2025-06-08 18:52:34', 'pending', 0, NULL, 'Dine In', '2025-06-08 18:52:34', '2025-06-08 21:52:34', 0),
(23, '1A290307CV5463728', NULL, 13.00, 13.00, 0.00, '2025-06-08 18:52:49', 'pending', 0, NULL, 'Dine In', '2025-06-08 18:52:49', '2025-06-08 21:52:49', 0),
(24, '0DK87719RS4025219', NULL, 13.00, 13.00, 0.00, '2025-06-08 18:54:21', 'completed', 0, NULL, 'Dine In', '2025-06-08 18:54:21', '2025-06-08 21:55:21', 0),
(25, '7KE63609JR522000W', NULL, 13.00, 13.00, 0.00, '2025-06-08 18:58:46', 'completed', 0, NULL, 'Dine In', '2025-06-08 18:58:46', '2025-06-08 21:59:41', 0),
(26, '3NY073892H629521X', NULL, 52.00, 52.00, 0.00, '2025-06-08 19:02:51', 'completed', 0, NULL, 'Dine In', '2025-06-08 19:02:51', '2025-06-08 22:03:59', 0),
(27, '87329554AN9389155', NULL, 13.00, 13.00, 0.00, '2025-06-08 19:05:46', 'completed', 0, NULL, 'Dine In', '2025-06-08 19:05:46', '2025-06-08 22:06:32', 0),
(28, '4PG27800S1835694B', NULL, 13.00, 13.00, 0.00, '2025-06-08 19:39:57', 'pending', 0, NULL, 'Dine In', '2025-06-08 19:39:57', '2025-06-08 22:39:57', 0),
(29, '385588592S635043L', NULL, 13.00, 13.00, 0.00, '2025-06-08 19:40:43', 'pending', 0, NULL, 'Dine In', '2025-06-08 19:40:43', '2025-06-08 22:40:43', 0),
(30, '15J60042WE665223T', NULL, 13.00, 13.00, 0.00, '2025-06-08 19:41:45', 'pending', 0, NULL, 'Dine In', '2025-06-08 19:41:45', '2025-06-08 22:41:45', 0),
(31, '3RA17980JG015050H', NULL, 13.00, 13.00, 0.00, '2025-06-08 19:44:21', 'pending', 0, NULL, 'Dine In', '2025-06-08 19:44:21', '2025-06-08 22:44:21', 0),
(32, '01S681377N429721F', NULL, 13.00, 13.00, 0.00, '2025-06-08 19:44:45', 'pending', 0, NULL, 'Dine In', '2025-06-08 19:44:45', '2025-06-08 22:44:45', 0),
(33, '5KV74371U9917193S', NULL, 13.00, 13.00, 0.00, '2025-06-08 19:52:54', 'pending', 0, NULL, 'Dine In', '2025-06-08 19:52:54', '2025-06-08 22:52:54', 0),
(34, '1SU39328BM871610K', NULL, 13.00, 13.00, 0.00, '2025-06-08 20:00:56', 'pending', 0, NULL, 'Dine In', '2025-06-08 20:00:56', '2025-06-08 23:00:56', 0),
(35, '9L0624922E0828047', NULL, 13.00, 13.00, 0.00, '2025-06-08 20:06:38', 'pending', 0, NULL, 'Dine In', '2025-06-08 20:06:38', '2025-06-08 23:06:38', 0),
(36, '3HG705253L4773530', NULL, 13.00, 13.00, 0.00, '2025-06-08 21:17:24', 'pending', 0, NULL, 'Dine In', '2025-06-08 21:17:24', '2025-06-09 00:17:24', 0),
(37, '88D4273846412862T', NULL, 13.00, 13.00, 0.00, '2025-06-08 21:18:53', 'completed', 0, NULL, 'Dine In', '2025-06-08 21:18:53', '2025-06-09 00:19:41', 0),
(38, '0WV13643YX075861M', NULL, 13.00, 13.00, 0.00, '2025-06-08 21:45:37', 'pending', 0, NULL, 'Dine In', '2025-06-08 21:45:37', '2025-06-09 00:45:37', 0),
(39, '0C3869462D542925U', NULL, 13.00, 13.00, 0.00, '2025-06-08 21:46:29', 'pending', 0, NULL, 'Dine In', '2025-06-08 21:46:29', '2025-06-09 00:46:29', 0),
(40, '9RT08000M4200805A', NULL, 13.00, 13.00, 0.00, '2025-06-08 21:46:55', 'pending', 0, NULL, 'Dine In', '2025-06-08 21:46:55', '2025-06-09 00:46:55', 0),
(41, '4GV00359FT5605932', NULL, 13.00, 13.00, 0.00, '2025-06-08 21:47:01', 'completed', 0, NULL, 'Dine In', '2025-06-08 21:47:01', '2025-08-10 18:36:21', 0),
(42, '6WR39395NE101264D', NULL, 26.00, 26.00, 0.00, '2025-06-08 21:49:24', 'completed', 0, NULL, 'Dine In', '2025-06-08 21:49:24', '2025-08-10 18:36:23', 0),
(43, '01052486L4241103G', NULL, 13.00, 13.00, 0.00, '2025-06-08 21:54:36', 'completed', 0, NULL, 'Dine In', '2025-06-08 21:54:36', '2025-06-09 00:55:34', 0),
(44, '0XT00842FH020752M', NULL, 13.00, 13.00, 0.00, '2025-06-08 21:57:13', 'completed', 0, NULL, 'Dine In', '2025-06-08 21:57:13', '2025-06-09 00:57:52', 0),
(45, '0SY67607UC898711V', NULL, 39.00, 39.00, 0.00, '2025-06-08 22:15:26', 'completed', 4, NULL, 'Dine In', '2025-06-08 22:15:26', '2025-06-09 01:16:13', 0),
(46, '5SH67821EY488473C', 17, 13.00, 13.00, 0.00, '2025-06-09 20:46:44', 'pending', 0, NULL, 'Dine In', '2025-06-09 20:46:44', '2025-06-09 23:48:14', 0),
(47, '8FU28892SF156010G', 17, 51.00, 51.00, 0.00, '2025-06-09 20:48:48', 'completed', 3, NULL, 'Dine In', '2025-06-09 20:48:48', '2025-06-16 04:06:44', 0),
(48, '6K624214HR121534E', 16, 13.00, 0.00, 0.00, '2025-06-09 22:33:25', 'pending', 0, NULL, 'Dine In', '2025-06-09 22:33:25', '2025-07-24 16:41:57', 0),
(49, '5MW927578W325693P', NULL, 13.00, 13.00, 0.00, '2025-06-10 09:02:51', 'completed', 3, NULL, 'Dine In', '2025-06-10 09:02:51', '2025-06-10 12:03:35', 0),
(53, '0W135763UL915912S', NULL, 13.00, 13.00, 0.00, '2025-06-13 16:45:17', 'pending', 0, NULL, 'Dine In', '2025-06-13 16:45:17', '2025-06-13 19:45:17', 0),
(54, '2HX752017E612635D', NULL, 13.00, 13.00, 0.00, '2025-06-13 16:45:51', 'pending', 0, NULL, 'Dine In', '2025-06-13 16:45:51', '2025-06-13 19:45:51', 0),
(55, '23R616370X356940N', NULL, 13.00, 13.00, 0.00, '2025-06-13 16:46:07', 'completed', 0, NULL, 'Dine In', '2025-06-13 16:46:07', '2025-06-13 19:46:38', 0),
(56, '17B88817AX411980F', NULL, 13.00, 13.00, 0.00, '2025-06-13 16:48:14', 'completed', 0, NULL, 'Dine In', '2025-06-13 16:48:14', '2025-06-13 19:48:48', 0),
(57, '9EV9905249777553L', NULL, 17.00, 17.00, 0.00, '2025-06-15 23:40:21', 'completed', 0, NULL, 'Dine In', '2025-06-15 23:40:21', '2025-06-16 02:41:07', 0),
(58, '7P324473Y0763845T', NULL, 34.00, 34.00, 0.00, '2025-06-15 23:42:56', 'completed', 4, NULL, 'Dine In', '2025-06-15 23:42:56', '2025-06-16 02:43:31', 0),
(67, '6VU580419V167324A', NULL, 51.00, 51.00, 0.00, '2025-06-16 00:49:22', 'completed', 4, NULL, 'Dine In', '2025-06-16 00:49:22', '2025-06-16 03:50:00', 0),
(68, '01E11226YB8175636', 17, 30.00, 30.00, 0.00, '2025-06-16 01:09:11', 'completed', 3, NULL, 'Dine In', '2025-06-16 01:09:11', '2025-06-16 04:45:33', 0),
(69, '5PE19332UY085380B', 17, 30.00, 30.00, 0.00, '2025-06-16 01:47:02', 'completed', 1, NULL, 'Dine In', '2025-06-16 01:47:02', '2025-06-16 04:47:55', 0),
(73, '7LG78630W4850040Y', NULL, 17.00, 17.00, 0.00, '2025-06-18 00:55:51', 'completed', 4, NULL, 'Dine In', '2025-06-18 00:55:51', '2025-06-18 03:56:34', 0),
(74, '53R95705CA690281Y', NULL, 51.00, 51.00, 0.00, '2025-06-18 01:01:13', 'completed', 3, NULL, 'Dine In', '2025-06-18 01:01:13', '2025-06-18 04:01:51', 0),
(75, '99V187154V933732Y', NULL, 64.00, 64.00, 0.00, '2025-06-18 22:28:25', 'completed', 3, NULL, 'Dine In', '2025-06-18 22:28:25', '2025-06-19 01:29:03', 0),
(86, '7AC314165T622091S', NULL, 18.00, 18.00, 0.00, '2025-06-19 12:43:27', 'completed', 4, NULL, 'Dine In', '2025-06-19 12:43:27', '2025-06-19 15:44:03', 0),
(87, '2KU69651HG728360P', NULL, 18.00, 18.00, 0.00, '2025-06-19 13:41:27', 'pending', 0, NULL, 'Dine In', '2025-06-19 13:41:27', '2025-06-19 16:41:27', 0),
(88, '2YD878921N546900G', 17, 68.00, 68.00, 0.00, '2025-06-19 16:42:55', 'completed', 0, NULL, 'Dine In', '2025-06-19 16:42:55', '2025-06-24 14:25:10', 0),
(89, '74A22265HM764804G', NULL, 20.00, 20.00, 0.00, '2025-06-19 16:51:13', 'completed', 3, NULL, 'Dine In', '2025-06-19 16:51:13', '2025-06-19 19:53:06', 0),
(90, '1U301302ES1398507', NULL, 20.00, 20.00, 0.00, '2025-06-20 10:10:20', 'pending', 0, NULL, 'Dine In', '2025-06-20 10:10:20', '2025-06-20 13:10:20', 0),
(91, '6GE54651WE066340G', 17, 34.00, 34.00, 0.00, '2025-06-20 14:36:03', 'completed', 4, NULL, 'Dine In', '2025-06-20 14:36:03', '2025-06-20 18:26:30', 0),
(92, NULL, 18, 0.00, 0.00, 0.00, '2025-06-20 15:12:18', 'pending', 0, NULL, 'Dine In', '2025-06-20 15:12:18', '2025-06-20 18:12:18', 1),
(93, NULL, 17, 68.00, 68.00, 0.00, '2025-06-20 16:45:55', 'processing', 0, NULL, 'Dine In', '2025-06-20 16:45:55', '2025-06-22T23:28:13.021Z', 1),
(94, '55R62251UE057915W', NULL, 40.00, 40.00, 0.00, '2025-06-20 17:15:07', 'completed', 5, NULL, 'Dine In', '2025-06-20 17:15:07', '2025-06-20 20:15:41', 0),
(95, '17N43753917069706', NULL, 17.00, 17.00, 0.00, '2025-06-20 18:22:12', 'completed', 4, NULL, 'Dine In', '2025-06-20 18:22:12', '2025-06-20 21:22:49', 0),
(96, '9UL10606PT9556831', NULL, 30.00, 30.00, 0.00, '2025-06-20 18:26:45', 'completed', 0, NULL, 'Dine In', '2025-06-20 18:26:45', '2025-06-24 15:24:00', 0),
(97, '8PU596512L421983Y', NULL, 17.00, 17.00, 0.00, '2025-06-23 10:28:02', 'completed', 0, NULL, 'Dine In', '2025-06-23 10:28:02', '2025-06-24 15:23:57', 0),
(98, '16W45448RC738730W', 19, 34.00, 34.00, 0.00, '2025-06-23 10:44:05', 'completed', 4, NULL, 'Dine In', '2025-06-23 10:44:05', '2025-06-23 13:47:04', 0),
(99, '86N654425G892933N', 19, 77.00, 77.00, 0.00, '2025-06-23 10:52:25', 'completed', 3, NULL, 'Take Away', '2025-06-23 10:52:25', '2025-06-27 21:50:46', 0),
(100, '7PF5642093975784F', NULL, 34.00, 34.00, 0.00, '2025-06-24 12:40:22', 'pending', 0, NULL, 'Dine In', '2025-06-24 12:40:22', '2025-06-24 15:40:22', 0),
(101, '0K5696576K439314W', NULL, 51.00, 51.00, 0.00, '2025-06-24 12:42:59', 'completed', 3, NULL, 'Dine In', '2025-06-24 12:42:59', '2025-07-17 01:17:06', 0),
(102, '1GK74567US421833G', NULL, 51.00, 51.00, 0.00, '2025-06-24 14:01:19', 'completed', 3, NULL, 'Dine In', '2025-06-24 14:01:19', '2025-07-17 01:17:09', 0),
(103, '9JT27546KL793551E', NULL, 77.00, 77.00, 0.00, '2025-06-24 14:05:02', 'completed', 3, NULL, 'Dine In', '2025-06-24 14:05:02', '2025-06-27 21:50:53', 0),
(104, NULL, 22, 0.00, 0.00, 0.00, '2025-06-28 00:59:51', 'pending', 0, NULL, 'Dine In', '2025-06-28 00:59:51', '2025-06-28 03:59:51', 1),
(105, NULL, 24, 0.00, 0.00, 0.00, '2025-06-28 01:13:28', 'pending', 0, NULL, 'Dine In', '2025-06-28 01:13:28', '2025-06-28 04:13:28', 1),
(106, NULL, 25, 0.00, 0.00, 0.00, '2025-06-28 01:13:28', 'pending', 0, NULL, 'Dine In', '2025-06-28 01:13:28', '2025-06-28 04:13:28', 1),
(107, NULL, 26, 0.00, 0.00, 0.00, '2025-06-28 01:38:07', 'pending', 0, NULL, 'Dine In', '2025-06-28 01:38:07', '2025-06-28 04:38:07', 1),
(108, NULL, 27, 0.00, 0.00, 0.00, '2025-06-28 14:49:53', 'pending', 0, NULL, 'Dine In', '2025-06-28 14:49:53', '2025-06-28 17:49:53', 1),
(109, NULL, 28, 0.00, 0.00, 0.00, '2025-06-29 15:29:13', 'pending', 0, NULL, 'Dine In', '2025-06-29 15:29:13', '2025-06-29 18:29:13', 1),
(110, '4JC986711K069314K', 29, 17.00, 20.00, 0.00, '2025-06-29 16:08:41', 'pending', 0, NULL, 'Dine In', '2025-06-29 16:08:41', '2025-07-04 21:43:19', 0),
(111, '3VX62153XV359004C', NULL, 29.90, 26.00, 3.90, '2025-07-04 14:54:15', 'pending', 0, NULL, 'Dine In', '2025-07-04 14:54:15', '2025-07-04 17:54:15', 0),
(112, '4K789850NW5793234', NULL, 29.90, 26.00, 3.90, '2025-07-04 14:54:30', 'pending', 0, NULL, 'Dine In', '2025-07-04 14:54:30', '2025-07-04 17:54:30', 0),
(113, '11B18442WJ491924R', NULL, 19.55, 17.00, 2.55, '2025-07-04 15:26:34', 'completed', 3, NULL, 'Dine In', '2025-07-04 15:26:34', '2025-07-12 18:30:57', 0),
(114, '37Y74405PJ004215W', 29, 17.00, 0.00, 0.00, '2025-07-04 18:43:27', 'pending', 0, NULL, 'Dine In', '2025-07-04 18:43:27', '2025-07-09 19:09:10', 0),
(115, '6GT59427DF390305U', 29, 17.00, 0.00, 0.00, '2025-07-09 16:09:21', 'completed', 4, NULL, 'Dine In', '2025-07-09 16:09:21', '2025-07-12 03:44:37', 0),
(116, '2WD53675HU071302D', 29, 34.00, 0.00, 0.00, '2025-07-09 16:14:02', 'completed', 3, NULL, 'Take Away', '2025-07-09 16:14:02', '2025-07-12 03:44:40', 0),
(117, '5Y214213T6930505U', 29, 17.00, 0.00, 0.00, '2025-07-09 17:02:35', 'completed', 3, NULL, 'Dine In', '2025-07-09 17:02:35', '2025-07-17 03:13:02', 0),
(118, '9DA501260A740422A', 29, 102.00, 0.00, 0.00, '2025-07-09 17:08:12', 'pending', 0, NULL, 'Dine In', '2025-07-09 17:08:12', '2025-07-17 15:26:43', 0),
(119, '146025778T210963T', NULL, 14.95, 13.00, 1.95, '2025-07-16 23:52:29', 'completed', 3, NULL, 'Dine In', '2025-07-16 23:52:29', '2025-07-17 03:12:46', 0),
(120, '8F082660CT885484C', NULL, 14.95, 13.00, 1.95, '2025-07-17 00:01:03', 'completed', 4, NULL, 'Dine In', '2025-07-17 00:01:03', '2025-07-17 03:12:58', 0),
(121, '1CT36603EM837192N', NULL, 14.95, 13.00, 1.95, '2025-07-17 00:11:36', 'completed', 3, NULL, 'Dine In', '2025-07-17 00:11:36', '2025-07-19 15:33:16', 0),
(122, '2PN50010DP221983M', 29, 17.00, 0.00, 0.00, '2025-07-17 12:26:52', 'completed', 3, NULL, 'Dine In', '2025-07-17 12:26:52', '2025-07-19 15:27:07', 0),
(123, '3D560892G8288550R', 29, 17.00, 0.00, 0.00, '2025-07-17 12:26:52', 'completed', 4, NULL, 'Dine In', '2025-07-17 12:26:52', '2025-07-19 19:23:42', 0),
(124, '3EN06186MG889525U', NULL, 19.55, 17.00, 2.55, '2025-07-19 12:28:34', 'pending', 0, NULL, 'Dine In', '2025-07-19 12:28:34', '2025-07-19 15:28:34', 0),
(125, '6546673679230833A', NULL, 19.55, 17.00, 2.55, '2025-07-19 12:30:52', 'completed', 5, NULL, 'Dine In', '2025-07-19 12:30:52', '2025-07-19 15:32:55', 0),
(126, '0RC23374V71164934', NULL, 19.55, 17.00, 2.55, '2025-07-19 12:33:38', 'completed', 0, NULL, 'Dine In', '2025-07-19 12:33:38', '2025-07-19 15:38:42', 0),
(127, '0WE801074M723971Y', NULL, 58.65, 51.00, 7.65, '2025-07-19 12:39:55', 'completed', 5, NULL, 'Dine In', '2025-07-19 12:39:55', '2025-07-19 18:49:41', 0),
(128, '2DN24505AP5243159', NULL, 19.55, 17.00, 2.55, '2025-07-19 15:49:59', 'completed', 0, NULL, 'Dine In', '2025-07-19 15:49:59', '2025-07-19 19:23:40', 0),
(129, '70L35888J4775910M', NULL, 89.70, 78.00, 11.70, '2025-07-19 16:23:21', 'pending', 0, NULL, 'Dine In', '2025-07-19 16:23:21', '2025-07-19 19:23:21', 0),
(130, '11P36410DT233283J', NULL, 89.70, 78.00, 11.70, '2025-07-19 16:24:39', 'completed', 0, NULL, 'Dine In', '2025-07-19 16:24:39', '2025-07-19 19:27:54', 0),
(131, '1G929252D5526954L', NULL, 19.55, 17.00, 2.55, '2025-07-19 16:28:47', 'completed', 0, NULL, 'Dine In', '2025-07-19 16:28:47', '2025-07-21 22:31:43', 0),
(132, '97K04636NH024053H', NULL, 78.20, 68.00, 10.20, '2025-07-19 16:34:55', 'completed', 0, NULL, 'Dine In', '2025-07-19 16:34:55', '2025-07-21 22:31:36', 0),
(133, '75326166H2719135C', NULL, 58.65, 51.00, 7.65, '2025-07-19 16:38:05', 'completed', 0, NULL, 'Dine In', '2025-07-19 16:38:05', '2025-07-19 20:00:43', 0),
(134, '5KC66435T2724143C', NULL, 39.10, 34.00, 5.10, '2025-07-21 11:25:53', 'completed', 0, NULL, 'Dine In', '2025-07-21 11:25:53', '2025-08-09 16:20:58', 0),
(135, '80L1332672749393D', 29, 17.00, 0.00, 0.00, '2025-07-22 19:03:37', 'completed', 0, NULL, 'Dine In', '2025-07-22 19:03:37', '2025-08-08 20:00:07', 0),
(136, '2H863912T0553190V', 29, 34.00, 0.00, 0.00, '2025-07-22 19:15:58', 'completed', 0, NULL, 'Dine In', '2025-07-22 19:15:58', '2025-08-08 20:00:21', 0),
(137, '47S70778SJ464712P', NULL, 19.55, 17.00, 2.55, '2025-07-22 22:52:12', 'completed', 0, NULL, 'Dine In', '2025-07-22 22:52:12', '2025-07-26 03:46:02', 0),
(138, '11L19186H1531023B', NULL, 19.55, 17.00, 2.55, '2025-07-23 00:56:11', 'completed', 0, NULL, 'Dine In', '2025-07-23 00:56:11', '2025-07-26 03:45:59', 0),
(139, NULL, 16, 0.00, 0.00, 0.00, '2025-07-25 12:34:04', 'pending', 0, NULL, 'Dine In', '2025-07-25 12:34:04', '2025-07-25 15:34:04', 1),
(140, '9KS994819G682951C', 29, 34.00, 0.00, 0.00, '2025-07-25 13:32:59', 'completed', 0, NULL, 'Dine In', '2025-07-25 13:32:59', '2025-07-25 16:35:54', 0),
(141, '6X964306MK1691647', NULL, 14.95, 13.00, 1.95, '2025-07-25 13:43:15', 'pending', 0, NULL, 'Dine In', '2025-07-25 13:43:15', '2025-07-25 16:43:15', 0),
(142, '82B09076R8458244H', NULL, 39.10, 34.00, 5.10, '2025-07-25 13:43:57', 'completed', 0, NULL, 'Dine In', '2025-07-25 13:43:57', '2025-07-25 16:46:05', 0),
(143, '2M377264CC855145V', 29, 10.00, 0.00, 0.00, '2025-07-25 13:46:24', 'pending', 0, NULL, 'Dine In', '2025-07-25 13:46:24', '2025-07-25 16:56:14', 0),
(144, '5GN96889383588208', 29, 187.00, 0.00, 0.00, '2025-07-25 14:01:36', 'pending', 0, NULL, 'Dine In', '2025-07-25 14:01:36', '2025-07-27 18:37:01', 0),
(145, '8E890134MT369811C', 29, 17.00, 0.00, 0.00, '2025-07-27 15:37:05', 'completed', 5, NULL, 'Dine In', '2025-07-27 15:37:05', '2025-08-05 03:14:49', 0),
(146, '42M590259S8331904', NULL, 19.55, 17.00, 2.55, '2025-07-31 15:26:50', 'pending', 0, NULL, 'Dine In', '2025-07-31 15:26:50', '2025-07-31 18:26:50', 0),
(148, '54R7317719944393J', NULL, 19.55, 17.00, 2.55, '2025-07-31 15:31:57', 'completed', 0, NULL, 'Dine In', '2025-07-31 15:31:57', '2025-08-10 22:04:28', 0),
(149, NULL, 29, 0.00, 0.00, 0.00, '2025-08-01 18:06:43', 'pending', 0, NULL, 'Dine In', '2025-08-01 18:06:43', '2025-08-01 21:06:43', 1),
(150, '6HV2398827005591F', NULL, 19.55, 17.00, 2.55, '2025-08-05 08:47:03', 'completed', 4, NULL, 'Dine In', '2025-08-05 08:47:03', '2025-08-10 22:04:27', 0),
(151, '6X283891X86845932', NULL, 42.55, 37.00, 5.55, '2025-08-06 14:07:32', 'completed', 4, NULL, 'Dine In', '2025-08-06 14:07:32', '2025-08-11 13:11:01', 0),
(152, '53A811463G907352E', NULL, 100.05, 87.00, 13.05, '2025-08-08 16:48:41', 'completed', 4, NULL, 'Dine In', '2025-08-08 16:48:41', '2025-08-10 23:19:21', 0),
(153, '9L428162ED581135D', NULL, 11.50, 10.00, 1.50, '2025-08-08 18:29:21', 'pending', 0, NULL, 'Dine In', '2025-08-08 18:29:21', '2025-08-08 21:29:21', 0),
(154, NULL, 30, 0.00, 0.00, 0.00, '2025-08-10 13:10:08', 'pending', 0, NULL, 'Dine In', '2025-08-10 13:10:08', '2025-08-10 16:10:08', 1),
(155, '92L542607X081330Y', NULL, 14.95, 13.00, 1.95, '2025-08-12 00:04:32', 'pending', 0, NULL, 'Dine In', '2025-08-12 00:04:32', '2025-08-12 03:04:32', 0),
(156, NULL, 19, 0.00, 0.00, 0.00, '2025-08-12 13:59:58', 'pending', 0, NULL, 'Dine In', '2025-08-12 13:59:58', '2025-08-12 16:59:58', 1),
(157, '0CK80780H93249512', NULL, 17.25, 15.00, 2.25, '2025-08-14 14:23:17', 'completed', 0, NULL, 'Dine In', '2025-08-14 14:23:17', '2025-08-15 05:16:32', 0),
(158, '5A619684L2621982W', NULL, 17.25, 15.00, 2.25, '2025-08-14 14:29:19', 'pending', 0, NULL, 'Dine In', '2025-08-14 14:29:19', '2025-08-14 17:29:19', 0),
(159, '20S44954LU8062018', NULL, 17.25, 15.00, 2.25, '2025-08-14 14:30:26', 'completed', 4, NULL, 'Dine In', '2025-08-14 14:30:26', '2025-08-15 05:15:57', 0);

-- --------------------------------------------------------

--
-- Table structure for table `order_item`
--

CREATE TABLE `order_item` (
  `order_item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `order_item`
--

INSERT INTO `order_item` (`order_item_id`, `order_id`, `item_id`, `quantity`, `price`, `created_at`, `updated_at`) VALUES
(1, 157, 2, 1, 15.00, '2025-08-14 14:23:17', '2025-08-14 14:23:17'),
(6, 158, 2, 1, 15.00, '2025-08-14 14:29:19', '2025-08-14 14:29:19'),
(7, 159, 2, 1, 15.00, '2025-08-14 14:30:26', '2025-08-14 14:30:26');

-- --------------------------------------------------------

--
-- Table structure for table `order_item_ingredient`
--

CREATE TABLE `order_item_ingredient` (
  `order_item_ingredient_id` int(11) NOT NULL,
  `order_item_id` int(11) NOT NULL,
  `ingredient_id` int(11) NOT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

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
  `task_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `due_date` datetime DEFAULT NULL,
  `assigned_by` int(11) NOT NULL,
  `estimated_hours` decimal(5,2) DEFAULT NULL,
  `actual_hours` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`task_id`, `title`, `description`, `status`, `priority`, `due_date`, `assigned_by`, `estimated_hours`, `actual_hours`, `created_at`, `updated_at`) VALUES
(1, 'coffee equipments cleaning ', 'fucking clean', 'in_progress', 'high', '2025-06-26 04:37:00', 18, 0.00, NULL, '2025-06-24 19:37:55', '2025-07-09 16:05:41'),
(2, 'making 30 cappucino ', 'make in the morning , group of pupils are visiting ', 'completed', 'urgent', '2025-06-26 10:45:00', 18, 0.00, NULL, '2025-06-24 19:43:50', '2025-06-27 18:36:01'),
(3, 'clean', 'dsfdfd', 'completed', 'high', '2025-07-18 06:08:00', 18, 6.00, NULL, '2025-07-04 12:08:40', '2025-07-04 12:09:37'),
(4, 'test', '', 'in_progress', 'medium', NULL, 18, 1.00, NULL, '2025-07-17 15:13:02', '2025-08-04 22:01:49'),
(5, 'test', '', 'pending', 'medium', '0000-00-00 00:00:00', 18, 1.00, NULL, '2025-07-17 15:13:06', '2025-07-17 15:13:06'),
(6, 'test', 'dd', 'pending', 'medium', '0000-00-00 00:00:00', 18, 1.00, NULL, '2025-07-17 15:13:11', '2025-07-17 15:13:11'),
(7, 'test', 'dd', 'pending', 'medium', '0000-00-00 00:00:00', 18, 1.00, NULL, '2025-07-17 15:26:56', '2025-07-17 15:26:56'),
(8, 'test', 'hi ', 'pending', 'medium', '0000-00-00 00:00:00', 18, 0.00, NULL, '2025-07-17 15:30:39', '2025-07-17 15:30:39'),
(11, 'd', '', 'pending', 'medium', '0000-00-00 00:00:00', 18, 0.00, NULL, '2025-07-17 15:39:22', '2025-07-17 15:39:22'),
(12, 'ddfd', '', 'in_progress', 'medium', NULL, 18, 1.00, NULL, '2025-07-17 15:46:05', '2025-07-17 22:23:20'),
(13, 'kjk', 'kkj', 'pending', 'medium', '0000-00-00 00:00:00', 18, 0.00, NULL, '2025-07-17 22:20:09', '2025-07-17 22:20:09'),
(14, 'nn', '', 'pending', 'medium', '0000-00-00 00:00:00', 18, 1.50, NULL, '2025-07-17 22:36:10', '2025-07-17 22:36:10'),
(15, 'ddd', 'ddf', 'in_progress', 'medium', NULL, 18, 0.00, NULL, '2025-07-17 22:43:04', '2025-07-24 13:02:01'),
(16, 'just test', '', 'pending', 'high', '0000-00-00 00:00:00', 18, 3.50, NULL, '2025-07-17 22:50:55', '2025-07-17 22:50:55'),
(17, 'f', 'ggg', 'pending', 'medium', '0000-00-00 00:00:00', 18, 0.00, NULL, '2025-07-17 22:53:59', '2025-07-17 22:53:59'),
(20, 'vv', 'vv', 'pending', 'medium', '0000-00-00 00:00:00', 18, 0.00, NULL, '2025-07-17 23:37:49', '2025-07-17 23:37:49'),
(21, 'hfh', 'fgh', 'pending', 'medium', '0000-00-00 00:00:00', 18, 0.50, NULL, '2025-07-19 17:02:03', '2025-07-19 17:02:03'),
(22, 'dd', '', 'pending', 'medium', '0000-00-00 00:00:00', 18, 1.00, NULL, '2025-07-19 18:05:32', '2025-07-19 18:05:32'),
(23, 'stop testing ', 'hiii \n\nds\nd\nd\nds\n', 'pending', 'medium', '0000-00-00 00:00:00', 18, 0.00, NULL, '2025-07-19 18:13:39', '2025-07-19 18:13:39'),
(24, 'another test', 'ddc', 'pending', 'low', '0000-00-00 00:00:00', 18, 1.50, NULL, '2025-07-19 21:26:56', '2025-07-19 21:26:56'),
(25, 'gg', '', 'pending', 'medium', '0000-00-00 00:00:00', 18, 2.00, NULL, '2025-07-19 21:34:50', '2025-07-19 21:34:50'),
(26, 'yyy', 'yyy', 'pending', 'medium', '0000-00-00 00:00:00', 18, 1.00, NULL, '2025-08-04 22:01:13', '2025-08-04 22:01:13'),
(27, 'stam test ', 'sss', 'pending', 'low', '0000-00-00 00:00:00', 18, 0.50, NULL, '2025-08-04 22:15:17', '2025-08-04 22:15:17');

-- --------------------------------------------------------

--
-- Table structure for table `task_assignments`
--

CREATE TABLE `task_assignments` (
  `assignment_id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `assigned_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `task_assignments`
--

INSERT INTO `task_assignments` (`assignment_id`, `task_id`, `user_id`, `assigned_at`, `assigned_by`) VALUES
(1, 1, 16, '2025-06-24 19:37:55', 18),
(2, 2, 16, '2025-06-24 19:43:50', 18),
(3, 3, 16, '2025-07-04 12:08:40', 18),
(4, 4, 16, '2025-07-17 15:13:02', 18),
(5, 5, 16, '2025-07-17 15:13:06', 18),
(6, 6, 16, '2025-07-17 15:13:11', 18),
(7, 7, 16, '2025-07-17 15:26:56', 18),
(8, 8, 16, '2025-07-17 15:30:39', 18),
(13, 11, 16, '2025-07-17 15:39:22', 18),
(14, 12, 16, '2025-07-17 15:46:05', 18),
(15, 13, 16, '2025-07-17 22:20:09', 18),
(16, 14, 16, '2025-07-17 22:36:10', 18),
(17, 15, 16, '2025-07-17 22:43:04', 18),
(18, 16, 16, '2025-07-17 22:50:55', 18),
(19, 17, 16, '2025-07-17 22:53:59', 18),
(22, 20, 16, '2025-07-17 23:37:49', 18),
(23, 21, 16, '2025-07-19 17:02:03', 18),
(24, 22, 16, '2025-07-19 18:05:32', 18),
(25, 23, 16, '2025-07-19 18:13:39', 18),
(26, 24, 16, '2025-07-19 21:26:56', 18),
(27, 25, 16, '2025-07-19 21:34:50', 18),
(28, 26, 16, '2025-08-04 22:01:13', 18),
(29, 27, 16, '2025-08-04 22:15:17', 18);

-- --------------------------------------------------------

--
-- Table structure for table `task_comments`
--

CREATE TABLE `task_comments` (
  `comment_id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `comment` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `task_comments`
--

INSERT INTO `task_comments` (`comment_id`, `task_id`, `user_id`, `comment`, `created_at`) VALUES
(1, 1, 16, 'oh ok i do actually !', '2025-06-24 19:39:55'),
(2, 1, 16, 'XD', '2025-06-24 19:40:06'),
(3, 2, 16, 'ok sir !', '2025-06-24 19:45:03'),
(4, 3, 16, 'sdsdsds', '2025-07-04 12:09:18'),
(5, 16, 16, 'kkk', '2025-07-19 16:28:11'),
(6, 4, 16, 'klklk', '2025-08-05 09:01:07');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `phone_number` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `status` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `phone_number`, `username`, `email`, `password`, `role`, `email_verified`, `status`) VALUES
(16, 'salam', 'shibli', '', 'salam', 'shibli.salam30@gmail.com', '$2b$10$BBjbjNXqKz5m5DTaquK./.XZA11GQpdLe30Hw09EmfCVgizna3TES', 'staff', 1, 1),
(18, 'AJ', '', '', 'ddddd', 'bewhouaremate@outlook.com', '$2b$10$hi0tZ5t.R1R.Mpnj3.JBUuswUAG5g96pCmkIcwscPQG6EHivYNL7C', 'admin', 1, 1),
(19, 'Salam', 'Shibli', '0', 'raiz', '', '$2b$10$gbPkTJvSFXkfY/ciib8ac.lrl0QRetgkzEcBrXuvhJR1yJqb4/JGu', 'customer', 1, 0),
(29, 'salam', 'shibli', '+972052588178', 'bobk', 'shiblislam@gmail.com', '$2b$10$MSHM/qTlYhiOLlYkSL4.ueIoC6Rkeykv2b7PvBae8i/4JxFoNzhYC', 'customer', 1, 1),
(30, '', '', '+972525881614', 'tyrone', 'ss@gmail.com', '$2b$10$vHdAKsVfdCORQBYp4HufTeObVTqPAgz6DNUfBGRTyreQsFEzwBYka', 'staff', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `vat_config`
--

CREATE TABLE `vat_config` (
  `id` int(11) NOT NULL,
  `vat_rate` decimal(5,2) NOT NULL DEFAULT 15.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `vat_config`
--

INSERT INTO `vat_config` (`id`, `vat_rate`, `created_at`) VALUES
(1, 15.00, '2025-07-04 13:36:24');

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
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `gallery`
--
ALTER TABLE `gallery`
  ADD PRIMARY KEY (`post_id`),
  ADD KEY `fk_user` (`user_id`);

--
-- Indexes for table `ingredient`
--
ALTER TABLE `ingredient`
  ADD PRIMARY KEY (`ingredient_id`),
  ADD KEY `supplier_id` (`supplier_id`);

--
-- Indexes for table `ingredients_in_item`
--
ALTER TABLE `ingredients_in_item`
  ADD PRIMARY KEY (`ingredient_id`,`item_id`),
  ADD KEY `fk_ingredients_dish` (`item_id`);

--
-- Indexes for table `ingredient_category`
--
ALTER TABLE `ingredient_category`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ingredient_type`
--
ALTER TABLE `ingredient_type`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`) USING HASH;

--
-- Indexes for table `item_option_type`
--
ALTER TABLE `item_option_type`
  ADD PRIMARY KEY (`item_id`,`type_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD UNIQUE KEY `paypal_order_id` (`paypal_order_id`),
  ADD KEY `phone_number` (`phone_number`),
  ADD KEY `paypal_order_id_2` (`paypal_order_id`),
  ADD KEY `idx_status` (`status`) USING BTREE,
  ADD KEY `idx_is_cart` (`is_cart`) USING BTREE,
  ADD KEY `idx_user_cart` (`user_id`,`is_cart`);

--
-- Indexes for table `order_item`
--
ALTER TABLE `order_item`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `fk_order_item_dish` (`item_id`);

--
-- Indexes for table `order_item_ingredient`
--
ALTER TABLE `order_item_ingredient`
  ADD PRIMARY KEY (`order_item_ingredient_id`),
  ADD KEY `fk_order_item_ingredient_item` (`order_item_id`),
  ADD KEY `fk_order_item_ingredient_ingredient` (`ingredient_id`);

--
-- Indexes for table `product_order`
--
ALTER TABLE `product_order`
  ADD PRIMARY KEY (`order_id`);

--
-- Indexes for table `supplier`
--
ALTER TABLE `supplier`
  ADD PRIMARY KEY (`supplier_id`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`task_id`),
  ADD KEY `assigned_by` (`assigned_by`);

--
-- Indexes for table `task_assignments`
--
ALTER TABLE `task_assignments`
  ADD PRIMARY KEY (`assignment_id`),
  ADD UNIQUE KEY `unique_task_user` (`task_id`,`user_id`),
  ADD KEY `task_id` (`task_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `assigned_by` (`assigned_by`);

--
-- Indexes for table `task_comments`
--
ALTER TABLE `task_comments`
  ADD PRIMARY KEY (`comment_id`),
  ADD KEY `task_id` (`task_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `vat_config`
--
ALTER TABLE `vat_config`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `workschedule`
--
ALTER TABLE `workschedule`
  ADD PRIMARY KEY (`schedule_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `dish`
--
ALTER TABLE `dish`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `gallery`
--
ALTER TABLE `gallery`
  MODIFY `post_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `ingredient`
--
ALTER TABLE `ingredient`
  MODIFY `ingredient_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `ingredient_category`
--
ALTER TABLE `ingredient_category`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `ingredient_type`
--
ALTER TABLE `ingredient_type`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=160;

--
-- AUTO_INCREMENT for table `order_item`
--
ALTER TABLE `order_item`
  MODIFY `order_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `order_item_ingredient`
--
ALTER TABLE `order_item_ingredient`
  MODIFY `order_item_ingredient_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `task_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `task_assignments`
--
ALTER TABLE `task_assignments`
  MODIFY `assignment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `task_comments`
--
ALTER TABLE `task_comments`
  MODIFY `comment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `vat_config`
--
ALTER TABLE `vat_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `gallery`
--
ALTER TABLE `gallery`
  ADD CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ingredient`
--
ALTER TABLE `ingredient`
  ADD CONSTRAINT `ingredient_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`supplier_id`);

--
-- Constraints for table `ingredients_in_item`
--
ALTER TABLE `ingredients_in_item`
  ADD CONSTRAINT `fk_ingredients_dish` FOREIGN KEY (`item_id`) REFERENCES `dish` (`item_id`) ON DELETE CASCADE;

--
-- Constraints for table `order_item`
--
ALTER TABLE `order_item`
  ADD CONSTRAINT `fk_order_item_dish` FOREIGN KEY (`item_id`) REFERENCES `dish` (`item_id`) ON DELETE CASCADE;

--
-- Constraints for table `order_item_ingredient`
--
ALTER TABLE `order_item_ingredient`
  ADD CONSTRAINT `fk_order_item_ingredient_ingredient` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredient` (`ingredient_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_order_item_ingredient_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_item` (`order_item_id`) ON DELETE CASCADE;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_assignments`
--
ALTER TABLE `task_assignments`
  ADD CONSTRAINT `task_assignments_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_assignments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_assignments_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_comments`
--
ALTER TABLE `task_comments`
  ADD CONSTRAINT `task_comments_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
