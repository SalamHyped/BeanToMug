# BeanToMug Backend - Clear Class Diagrams

This repository contains two comprehensive class diagrams for the BeanToMug backend architecture, designed for maximum clarity and understanding.

## 📊 Diagram Overview

### 🎯 **Overview Diagram** (`backend-class-diagram-overview-clear.mmd`)
**Purpose**: High-level architectural understanding
**Audience**: Stakeholders, new developers, system architects, project managers
**Content**:
- **5 Main Layers**: Application, Infrastructure, Middleware, Router, Service, Utility, Entity
- **Grouped Components**: Routers grouped by functionality (Auth, Admin, Business, Management)
- **Core Relationships**: Essential associations and dependencies
- **Clean Structure**: Easy to understand at a glance

### 🔍 **Detailed Diagram** (`backend-class-diagram-detailed-clear.mmd`)
**Purpose**: Complete technical implementation reference
**Audience**: Developers, technical leads, system maintainers, code reviewers
**Content**:
- **All Individual Classes**: Every router, service, utility, and entity
- **Complete Method Signatures**: All public and private methods with parameters
- **Comprehensive Relationships**: All relationship types with proper UML notation
- **Implementation Details**: Actual method names from the codebase

## 🏗️ **Architectural Layers**

### 1. **Application Layer**
- `App`: Main application orchestrator
- Handles initialization, middleware setup, and server startup

### 2. **Infrastructure Layer**
- `DatabaseSingleton`: Database connection management
- `DatabaseConfig`: Configuration management

### 3. **Middleware Layer**
- `AuthMiddleware`: Token-based authentication
- `RoleMiddleware`: Role-based access control
- `CartMiddleware`: Session cart migration

### 4. **Router Layer** (13 Individual Routers)
- **Authentication**: `AuthRouter`
- **Administration**: `AdminRouter`
- **Business Operations**: `MenuRouter`, `CartRouter`, `OrdersRouter`, `PayPalRouter`, `RatingsRouter`
- **Management**: `TasksRouter`, `InventoryRouter`, `DishesRouter`, `IngredientsRouter`, `SuppliersRouter`, `ProductOrdersRouter`, `WorkScheduleRouter`, `GalleryRouter`, `UploadRouter`

### 5. **Service Layer** (8 Core Services)
- **Analytics & Finance**: `FinancialService`, `OrderAnalyticsService`, `SalesAnalyticsService`
- **Business Operations**: `CartService`, `DishService`, `StockService`, `SupplierService`, `PayPalService`, `SocketService`

### 6. **Utility Layer** (6 Utility Classes)
- **Calculations**: `PriceCalculator`, `VATUtils`, `OrderUtils`
- **Authentication & Communication**: `TokenUtil`, `Mailer`, `VonageService`

### 7. **Entity Layer** (5 Core Database Tables)
- `Users`, `Orders`, `Tasks`, `Dishes`, `Ingredients`

## 🔗 **Relationship Types Used**

Both diagrams use comprehensive UML relationship notations:

### **Association (———)**
- General relationships between classes
- Shows that classes are related in some way
- Example: `Users -- Orders` (users place orders)

### **Dependency (- - - >)**
- One class depends on another for functionality
- Shows usage relationships
- Example: `AuthRouter ..> TokenUtil` (AuthRouter uses TokenUtil)

### **Navigation (———>)**
- Directional access between classes
- Shows data flow direction
- Example: `DatabaseSingleton --> Users` (database accesses users)

### **Aggregation (———◇)**
- Whole-part relationships where parts can exist independently
- Shows composition without strong ownership
- Example: `App ◇ AuthRouter` (App contains AuthRouter)

## 📋 **Key Features of the Clear Diagrams**

### **Overview Diagram Features:**
✅ **Layered Architecture**: Clear separation of concerns
✅ **Grouped Components**: Logical grouping of related routers
✅ **Essential Relationships**: Only the most important connections
✅ **Clean Layout**: Easy to read and understand
✅ **Stakeholder-Friendly**: Perfect for presentations

### **Detailed Diagram Features:**
✅ **Complete Method Signatures**: All methods with parameters
✅ **Private Methods**: Internal implementation details
✅ **All Relationship Types**: Comprehensive UML notation
✅ **Real Implementation**: Based on actual codebase
✅ **Developer-Ready**: Complete technical reference

## 🎯 **When to Use Which Diagram**

### **Use Overview Diagram When:**
- Presenting to stakeholders or management
- Onboarding new team members
- Understanding system architecture at a high level
- Planning system changes or migrations
- Creating documentation for non-technical audiences
- Getting a quick understanding of the system

### **Use Detailed Diagram When:**
- Implementing new features
- Debugging system issues
- Understanding specific class interactions
- Code reviews and technical discussions
- System maintenance and refactoring
- Creating detailed technical documentation

## 🚀 **How to View the Diagrams**

### **Online Viewing:**
1. **Mermaid Live Editor**: Copy content to [mermaid.live](https://mermaid.live)
2. **GitHub**: Files render automatically in GitHub repositories
3. **VS Code**: Install Mermaid Preview extension

### **Local Viewing:**
1. **VS Code**: Install Mermaid Preview extension
2. **Documentation Tools**: Most modern tools support Mermaid
3. **CLI Tools**: Use Mermaid CLI for image generation

## 📝 **Maintenance Guidelines**

### **Overview Diagram Updates:**
- Update when adding new major components
- Update when changing architectural layers
- Update when modifying core relationships
- Keep it simple and high-level

### **Detailed Diagram Updates:**
- Update when adding new classes or methods
- Update when changing method signatures
- Update when modifying relationships
- Keep it comprehensive and accurate

### **Synchronization:**
- Keep both diagrams synchronized for major changes
- Update overview first, then detailed diagram
- Use consistent naming conventions
- Document changes in commit messages

## 🔧 **Technical Implementation Notes**

### **Based on Real Codebase:**
- All method signatures are from actual implementation
- All class names match the real codebase
- All relationships reflect actual dependencies
- All utility functions are documented

### **UML Compliance:**
- Follows standard UML class diagram notation
- Uses proper relationship types
- Includes visibility modifiers (+ public, - private)
- Shows method parameters and return types

### **Scalability:**
- Designed to accommodate future growth
- Easy to add new classes and relationships
- Maintains clear separation of concerns
- Supports modular development

## 📚 **Additional Resources**

- **Mermaid Documentation**: [mermaid-js.github.io](https://mermaid-js.github.io)
- **UML Class Diagrams**: [uml-diagrams.org](https://www.uml-diagrams.org)
- **Node.js Best Practices**: [github.com/goldbergyoni/nodebestpractices](https://github.com/goldbergyoni/nodebestpractices)

---

**Note**: These diagrams are living documents that should be updated as the system evolves. They serve as both documentation and design tools for the BeanToMug backend architecture.

