# BeanToMug - מדריך ויזואלי למערכת
## צילומי מסך ודיאגרמות מפורטות

---

## 1. דיאגרמת ארכיטקטורה כללית

```mermaid
graph TB
    subgraph "Frontend Layer - React App"
        A[React 19.1.0] --> B[Components]
        B --> C[Pages]
        B --> D[Layouts]
        B --> E[Services]
        B --> F[Context]
    end
    
    subgraph "Backend Layer - Node.js"
        G[Express 5.1.0] --> H[Routes]
        H --> I[Controllers]
        I --> J[Services]
        J --> K[Database Layer]
    end
    
    subgraph "Real-time Layer"
        L[Socket.io] --> M[WebSocket Service]
        M --> N[Notification System]
        M --> O[Room Management]
    end
    
    subgraph "External Services"
        P[PayPal API]
        Q[Email Service]
        R[File Upload]
        S[MySQL Database]
    end
    
    subgraph "Security Layer"
        T[JWT Authentication]
        U[bcrypt Encryption]
        V[Role-based Access]
    end
    
    A --> G
    A --> L
    G --> P
    G --> Q
    G --> R
    J --> S
    G --> T
    G --> U
    G --> V
```

---

## 2. דיאגרמת זרימת נתונים

```mermaid
sequenceDiagram
    participant C as Client
    participant F as Frontend
    participant B as Backend
    participant D as Database
    participant S as Socket.io
    participant P as PayPal
    
    Note over C,P: תהליך הזמנה מלא
    
    C->>F: בחירת פריט
    F->>B: POST /cart/add
    B->>D: שמירת עגלה
    D-->>B: אישור שמירה
    B-->>F: עדכון עגלה
    F-->>C: הצגת עגלה מעודכנת
    
    C->>F: מעבר לתשלום
    F->>B: POST /paypal/create-order
    B->>P: יצירת הזמנה
    P-->>B: PayPal Order ID
    B-->>F: פרטי תשלום
    F-->>C: הפניה ל-PayPal
    
    C->>P: אישור תשלום
    P->>B: Webhook - תשלום הצליח
    B->>D: יצירת הזמנה
    B->>S: התראה על הזמנה חדשה
    S-->>F: עדכון בזמן אמת
    F-->>C: אישור הזמנה
```

---

## 3. דיאגרמת מבנה מסד נתונים

```mermaid
erDiagram
    USERS {
        int user_id PK
        string username
        string email
        string password_hash
        string role
        boolean email_verified
        datetime created_at
    }
    
    ORDERS {
        int order_id PK
        int user_id FK
        decimal total_price
        string status
        string order_type
        boolean is_cart
        datetime created_at
    }
    
    DISHES {
        int item_id PK
        string item_name
        decimal price
        int category_id FK
        boolean is_available
        string description
    }
    
    INGREDIENTS {
        int ingredient_id PK
        string name
        decimal price
        int stock_quantity
        string unit
        boolean is_available
    }
    
    ORDER_ITEM {
        int order_item_id PK
        int order_id FK
        int item_id FK
        int quantity
        decimal price
    }
    
    ORDER_ITEM_INGREDIENT {
        int order_item_ingredient_id PK
        int order_item_id FK
        int ingredient_id FK
        int quantity
    }
    
    TASKS {
        int task_id PK
        string title
        text description
        string priority
        string status
        int assigned_to FK
        int assigned_by FK
        datetime created_at
    }
    
    USERS ||--o{ ORDERS : places
    USERS ||--o{ TASKS : assigned_to
    USERS ||--o{ TASKS : assigned_by
    ORDERS ||--o{ ORDER_ITEM : contains
    DISHES ||--o{ ORDER_ITEM : ordered
    ORDER_ITEM ||--o{ ORDER_ITEM_INGREDIENT : contains
    INGREDIENTS ||--o{ ORDER_ITEM_INGREDIENT : used_in
```

---

## 4. דיאגרמת תהליך חישוב מחירים

```mermaid
flowchart TD
    A[התחלת חישוב מחיר] --> B[קבלת מחיר בסיס]
    B --> C{יש רכיבים אופציונליים?}
    C -->|כן| D[חישוב עלות רכיבים]
    C -->|לא| E[מחיר בסיס בלבד]
    D --> F[חישוב השפעות רכיבים]
    F --> G[חישוב מע"מ]
    E --> G
    G --> H[חישוב סופי]
    H --> I[אימות תוצאות]
    I --> J{תוצאה תקינה?}
    J -->|כן| K[החזרת מחיר]
    J -->|לא| L[שגיאה]
    
    style A fill:#e1f5fe
    style K fill:#c8e6c9
    style L fill:#ffcdd2
```

---

## 5. דיאגרמת מערכת WebSocket

```mermaid
graph LR
    subgraph "Client Side"
        A[React App] --> B[Socket Service]
        B --> C[Event Listeners]
    end
    
    subgraph "Server Side"
        D[Express Server] --> E[Socket.io Server]
        E --> F[Room Management]
        E --> G[User Authentication]
        E --> H[Event Handlers]
    end
    
    subgraph "Real-time Events"
        I[New Order]
        J[Order Update]
        K[Low Stock Alert]
        L[Task Assignment]
    end
    
    A <--> E
    C --> I
    C --> J
    C --> K
    C --> L
    
    H --> I
    H --> J
    H --> K
    H --> L
```

---

## 6. דיאגרמת זרימת משתמש - לקוח

```mermaid
journey
    title חוויית לקוח - תהליך הזמנה
    section גילוי
      כניסה לאתר: 5: Client
      עיון בתפריט: 4: Client
      בחירת קטגוריה: 3: Client
    section הזמנה
      בחירת פריט: 5: Client
      התאמות אישיות: 4: Client
      הוספה לעגלה: 5: Client
      מעבר לעגלה: 4: Client
    section תשלום
      בדיקת פרטים: 3: Client
      מעבר ל-PayPal: 4: Client
      אישור תשלום: 5: Client
    section סיום
      קבלת אישור: 5: Client
      מעקב הזמנה: 4: Client
```

---

## 7. דיאגרמת זרימת משתמש - מנהל

```mermaid
journey
    title חוויית מנהל - ניהול מערכת
    section כניסה
      התחברות: 5: Admin
      דשבורד ראשי: 5: Admin
    section ניהול
      עיון ב-KPIs: 5: Admin
      ניהול תפריט: 4: Admin
      ניהול מלאי: 4: Admin
      מעקב הזמנות: 5: Admin
    section אנליטיקה
      דוחות פיננסיים: 5: Admin
      ניתוח מכירות: 4: Admin
      ניהול משתמשים: 3: Admin
    section התראות
      התראות בזמן אמת: 5: Admin
      ניהול משימות: 4: Admin
```

---

## 8. דיאגרמת זרימת משתמש - עובד

```mermaid
journey
    title חוויית עובד - ביצוע משימות
    section כניסה
      התחברות: 5: Staff
      דשבורד עובד: 4: Staff
    section משימות
      עיון במשימות: 5: Staff
      ביצוע משימות: 4: Staff
      עדכון סטטוס: 5: Staff
    section הזמנות
      עיבוד הזמנות: 5: Staff
      עדכון סטטוס הזמנות: 4: Staff
    section מלאי
      עדכון מלאי: 3: Staff
      דיווח מלאי נמוך: 4: Staff
```

---

## 9. דיאגרמת תכונות טכניות מתקדמות

```mermaid
mindmap
  root((BeanToMug<br/>Advanced Features))
    Performance
      Caching Strategy
        Map-based caching
        Query result caching
        Session caching
      Bulk Operations
        Stock updates
        Order processing
        Data migration
      Connection Pooling
        Database connections
        Socket connections
        API connections
    Security
      Authentication
        JWT tokens
        Session management
        Password encryption
      Authorization
        Role-based access
        Permission system
        Route protection
      Data Protection
        Input validation
        SQL injection prevention
        XSS protection
    Real-time
      WebSocket
        Live notifications
        Order updates
        Stock alerts
      Event System
        Order events
        Task events
        User events
    Analytics
      Financial KPIs
        Revenue tracking
        Profit margins
        Cost analysis
      Business Intelligence
        Sales analytics
        Customer behavior
        Inventory optimization
```

---

## 10. דיאגרמת תהליך ניהול מלאי

```mermaid
flowchart TD
    A[הזמנה הושלמה] --> B[קבלת פריטי הזמנה]
    B --> C[חישוב השפעות רכיבים]
    C --> D[עדכון מלאי]
    D --> E{מלאי נמוך?}
    E -->|כן| F[יצירת התראה]
    E -->|לא| G[רישום פעולה]
    F --> H[שליחת התראה למנהל]
    G --> I[סיום תהליך]
    H --> I
    
    style A fill:#e3f2fd
    style F fill:#fff3e0
    style H fill:#ffebee
    style I fill:#e8f5e8
```

---

## 11. דיאגרמת מערכת תשלומים

```mermaid
sequenceDiagram
    participant C as Customer
    participant F as Frontend
    participant B as Backend
    participant P as PayPal
    participant D as Database
    
    Note over C,D: תהליך תשלום PayPal
    
    C->>F: לחיצה על "שלם"
    F->>B: POST /paypal/create-order
    B->>D: שמירת הזמנה זמנית
    B->>P: יצירת PayPal Order
    P-->>B: PayPal Order ID
    B-->>F: פרטי תשלום
    F-->>C: הפניה ל-PayPal
    
    C->>P: אישור תשלום
    P->>B: Webhook - תשלום הצליח
    B->>D: עדכון סטטוס הזמנה
    B->>D: עדכון מלאי
    B-->>F: אישור תשלום
    F-->>C: הודעת הצלחה
    
    Note over C,D: במקרה של ביטול
    C->>P: ביטול תשלום
    P->>B: Webhook - תשלום בוטל
    B->>D: עדכון סטטוס הזמנה
    B-->>F: הודעת ביטול
    F-->>C: הפניה לעגלה
```

---

## 12. דיאגרמת מערכת הרשאות

```mermaid
graph TD
    A[משתמש] --> B{אימות}
    B -->|הצלחה| C[קבלת JWT Token]
    B -->|כישלון| D[דחיית גישה]
    
    C --> E{בדיקת תפקיד}
    E -->|Admin| F[גישה מלאה]
    E -->|Staff| G[גישה מוגבלת]
    E -->|Customer| H[גישה בסיסית]
    
    F --> I[כל הפונקציות]
    G --> J[פונקציות עובד]
    H --> K[פונקציות לקוח]
    
    I --> L[ניהול מערכת]
    J --> M[ביצוע משימות]
    K --> N[הזמנות ופרופיל]
    
    style A fill:#e1f5fe
    style F fill:#c8e6c9
    style G fill:#fff3e0
    style H fill:#f3e5f5
```

---

## 13. דיאגרמת ביצועים ואופטימיזציה

```mermaid
graph LR
    subgraph "Frontend Optimization"
        A[Lazy Loading] --> B[Code Splitting]
        B --> C[Bundle Optimization]
        C --> D[Image Optimization]
    end
    
    subgraph "Backend Optimization"
        E[Connection Pooling] --> F[Query Optimization]
        F --> G[Caching Strategy]
        G --> H[Database Indexing]
    end
    
    subgraph "Real-time Optimization"
        I[Socket Room Management] --> J[Event Debouncing]
        J --> K[Selective Broadcasting]
        K --> L[Connection Monitoring]
    end
    
    A --> E
    E --> I
    
    style A fill:#e8f5e8
    style E fill:#e3f2fd
    style I fill:#fff3e0
```

---

## 14. דיאגרמת תכונות עתידיות

```mermaid
mindmap
  root((Future<br/>Enhancements))
    AI & ML
      Recommendation System
        Customer preferences
        Popular items
        Seasonal suggestions
      Predictive Analytics
        Demand forecasting
        Inventory optimization
        Price optimization
    Mobile
      Progressive Web App
        Offline functionality
        Push notifications
        App-like experience
      Native Mobile App
        iOS app
        Android app
        Cross-platform
    Integration
      Third-party Services
        Delivery platforms
        Social media
        Marketing tools
      API Ecosystem
        Public API
        Webhook system
        SDK development
    Advanced Features
      Loyalty Program
        Points system
        Rewards
        Customer retention
      Multi-location
        Chain management
        Centralized control
        Location-specific settings
```

---

## סיכום ויזואלי

הדיאגרמות המוצגות כאן מדגימות את המורכבות והתחכום של מערכת BeanToMug:

1. **ארכיטקטורה מודולרית** - הפרדה ברורה בין שכבות
2. **תקשורת בזמן אמת** - WebSocket מתקדם
3. **אבטחה רב-שכבתית** - אימות והרשאות מתקדמות
4. **ביצועים מותאמים** - אופטימיזציה בכל שכבה
5. **חוויית משתמש מעולה** - זרימות אינטואיטיביות
6. **ניהול נתונים מתקדם** - מסד נתונים מתוכנן היטב

המערכת מציגה שימוש מתקדם בטכנולוגיות web מודרניות ומספקת פתרון מקיף לניהול מסעדה מודרנית.

---

*מדריך ויזואלי זה נוצר עבור פרויקט BeanToMug*
*כל הדיאגרמות מבוססות על הקוד והארכיטקטורה האמיתית של המערכת*
