# BeanToMug Backend - Compact Class Diagrams

This repository contains two compact, clear class diagrams for the BeanToMug backend architecture, designed for maximum clarity and essential information.

## 📊 Diagram Overview

### 🎯 **Compact Overview** (`backend-class-diagram-compact-overview.mmd`)
**Purpose**: Essential architectural understanding
**Audience**: Quick reference, presentations, onboarding
**Content**:
- **Essential Classes Only**: Core application, infrastructure, middleware, key routers, main services, utilities, entities
- **Core Relationships**: Only the most important associations and dependencies
- **Clean Structure**: Easy to understand at a glance
- **Minimal Complexity**: Focus on essential components

### 🔍 **Compact Detailed** (`backend-class-diagram-compact-detailed.mmd`)
**Purpose**: Complete technical reference
**Audience**: Developers, technical implementation
**Content**:
- **All Classes**: Every router, service, utility, and entity
- **Complete Methods**: All method signatures with parameters
- **Comprehensive Relationships**: All UML relationship types
- **Full Implementation**: Complete technical specification

## 🏗️ **Architectural Structure**

### **Compact Overview - Essential Classes (15 classes)**
1. **Application**: `App`
2. **Infrastructure**: `DatabaseSingleton`
3. **Middleware**: `AuthMiddleware`, `RoleMiddleware`
4. **Routers**: `AuthRouter`, `AdminRouter`, `CartRouter`, `OrdersRouter`
5. **Services**: `FinancialService`, `OrderAnalyticsService`, `CartService`, `StockService`
6. **Utilities**: `PriceCalculator`, `TokenUtil`
7. **Entities**: `Users`, `Orders`, `Dishes`, `Ingredients`

### **Compact Detailed - All Classes (35+ classes)**
1. **Application Layer**: `App`
2. **Infrastructure Layer**: `DatabaseSingleton`, `DatabaseConfig`
3. **Middleware Layer**: `AuthMiddleware`, `RoleMiddleware`, `CartMiddleware`
4. **Router Layer**: 13 individual routers with complete endpoints
5. **Service Layer**: 8 core services with full method signatures
6. **Utility Layer**: 6 utility classes with all functions
7. **Entity Layer**: 5 database tables with complete fields

## 🔗 **UML Relationship Types Used**

Both diagrams use proper UML notation as specified:

### **Association (———)**
- **Meaning**: "this class is associated with this class"
- **Usage**: General relationships between classes
- **Example**: `Users -- Orders` (users place orders)

### **Dependency (- - - >)**
- **Meaning**: "this class is dependent upon this class"
- **Usage**: One class uses or depends on another
- **Example**: `AuthRouter ..> TokenUtil` (AuthRouter uses TokenUtil)

### **Navigation (———>)**
- **Meaning**: "you can navigate from this class to this class"
- **Usage**: Directional access between classes
- **Example**: `DatabaseSingleton --> Users` (database accesses users)

### **Aggregation (———◇)**
- **Meaning**: "these classes compose without belonging to this class"
- **Usage**: Whole-part relationships where parts can exist independently
- **Example**: `App ◇ AuthRouter` (App contains AuthRouter)

## 📋 **Key Features**

### **Compact Overview Features:**
✅ **Essential Only**: Only the most important classes
✅ **Core Relationships**: Key associations and dependencies
✅ **Quick Understanding**: Perfect for quick reference
✅ **Clean Layout**: Easy to read and present
✅ **Minimal Complexity**: Focus on essentials

### **Compact Detailed Features:**
✅ **Complete Coverage**: All classes and methods
✅ **Full Method Signatures**: All parameters and return types
✅ **All Relationship Types**: Comprehensive UML notation
✅ **Real Implementation**: Based on actual codebase
✅ **Developer Ready**: Complete technical reference

## 🎯 **When to Use Which Diagram**

### **Use Compact Overview When:**
- Quick system understanding needed
- Presenting to stakeholders
- Onboarding new team members
- High-level architecture discussions
- Quick reference during development

### **Use Compact Detailed When:**
- Implementing new features
- Debugging system issues
- Understanding specific implementations
- Code reviews and technical discussions
- Complete system documentation

## 🚀 **How to View**

### **Online Viewing:**
1. **Mermaid Live Editor**: [mermaid.live](https://mermaid.live)
2. **GitHub**: Automatic rendering in repositories
3. **VS Code**: Mermaid Preview extension

### **Local Viewing:**
1. **VS Code**: Install Mermaid Preview extension
2. **Documentation Tools**: Most modern tools support Mermaid
3. **CLI Tools**: Use Mermaid CLI for image generation

## 📝 **Maintenance Guidelines**

### **Compact Overview Updates:**
- Update when adding new essential components
- Keep it simple and focused
- Update core relationships only
- Maintain minimal complexity

### **Compact Detailed Updates:**
- Update when adding any new classes
- Update when changing method signatures
- Update all relationships as needed
- Keep it comprehensive and accurate

## 🔧 **Technical Implementation**

### **Based on Real Codebase:**
- All method signatures from actual implementation
- All class names match the real codebase
- All relationships reflect actual dependencies
- All utility functions documented

### **UML Compliance:**
- Follows standard UML class diagram notation
- Uses proper relationship types
- Includes visibility modifiers (+ public, - private)
- Shows method parameters and return types

## 📚 **Relationship Examples**

### **Association Examples:**
- `Users -- Orders`: Users place orders
- `Orders -- Dishes`: Orders contain dishes
- `Dishes -- Ingredients`: Dishes are made from ingredients

### **Dependency Examples:**
- `AuthRouter ..> TokenUtil`: AuthRouter uses TokenUtil
- `FinancialService ..> DatabaseSingleton`: FinancialService depends on database
- `PriceCalculator ..> VATUtils`: PriceCalculator uses VATUtils

### **Navigation Examples:**
- `DatabaseSingleton --> Users`: Database can access users
- `DatabaseSingleton --> Orders`: Database can access orders
- `DatabaseSingleton --> Dishes`: Database can access dishes

### **Aggregation Examples:**
- `App ◇ AuthRouter`: App contains AuthRouter
- `App ◇ DatabaseSingleton`: App contains DatabaseSingleton
- `App ◇ FinancialService`: App contains FinancialService

---

**Note**: These compact diagrams provide the perfect balance between simplicity and completeness, making them ideal for both quick reference and detailed technical work.

