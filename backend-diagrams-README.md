# BeanToMug Backend Class Diagrams

This repository contains two complementary class diagrams for the BeanToMug backend architecture:

## 📋 Overview Diagram (`backend-class-diagram-overview.mmd`)

**Purpose**: High-level architectural overview
**Audience**: Stakeholders, new developers, system architects
**Content**:
- Main application components
- Core infrastructure (Database, Middleware)
- Grouped routers (Business, Management, Admin, Auth)
- Essential services
- Core entities
- Basic relationships

**Key Features**:
- Simplified view with grouped components
- Focus on main architectural layers
- Easy to understand for non-technical stakeholders
- Shows the "big picture" of the system

## 🔍 Detailed Diagram (`backend-class-diagram.mmd`)

**Purpose**: Comprehensive technical documentation
**Audience**: Developers, technical leads, system maintainers
**Content**:
- All individual classes and their methods
- Complete relationship types (Association, Dependency, Navigation, Aggregation)
- All routers, services, utilities, and entities
- Detailed method signatures
- Comprehensive relationship mappings

**Key Features**:
- Complete technical specification
- All relationship types from UML notation guide
- Detailed method signatures
- Full dependency mapping
- Navigation and aggregation relationships

## 🎯 When to Use Which Diagram

### Use Overview Diagram When:
- Presenting to stakeholders
- Onboarding new team members
- Understanding system architecture at a high level
- Planning system changes
- Documentation for non-technical audiences

### Use Detailed Diagram When:
- Implementing new features
- Debugging system issues
- Understanding specific class interactions
- Code reviews and technical discussions
- System maintenance and refactoring

## 📊 Relationship Types Used

Both diagrams use the following UML relationship notations:

- **Association (———)**: General relationships between classes
- **Dependency (- - - >)**: One class depends on another
- **Navigation (———>)**: Directional access between classes
- **Aggregation (———◇)**: Whole-part relationships

## 🔄 How to View

1. **Mermaid Live Editor**: Copy the content and paste into [mermaid.live](https://mermaid.live)
2. **VS Code**: Install Mermaid Preview extension
3. **GitHub**: Both files will render automatically in GitHub
4. **Documentation Tools**: Most modern documentation tools support Mermaid

## 📝 Maintenance

- Update overview diagram when adding new major components
- Update detailed diagram when adding new classes or relationships
- Keep both diagrams synchronized for major architectural changes
- Use consistent naming conventions across both diagrams

