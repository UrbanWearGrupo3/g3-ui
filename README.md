app/
│
├── pages/
│   │
│   ├── auth/
│   │   ├── login/
│   │   └── register/
│   │
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── products/
│   │   │   ├── list/
│   │   │   ├── create/
│   │   │   └── edit/
│   │   │
│   │   └── users/
│   │       ├── list/
│   │       ├── create/
│   │       └── edit/
│   │
│   └── shop/
│       ├── home/
│       ├── products/
│       ├── product-detail/
│       ├── cart/
│       ├── checkout/
│       └── profile/
│
├── shared/
│   ├── components/
│   │   ├── navbar/
│   │   ├── sidebar/
│   │   ├── product-card/
│   │   ├── cart-item/
│   │   ├── button/
│   │   └── modal/
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── product.service.ts
│   │   ├── user.service.ts
│   │   ├── cart.service.ts
│   │   └── order.service.ts
│   │
│   └── interfaces/
│
├── core/
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── admin.guard.ts
│   │
│   └── interceptors/
│
└── app.routes.ts