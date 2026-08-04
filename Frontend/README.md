# Convention Frontend

Interfaz administrativa premium para gestión de eventos universitarios.

## Desarrollo

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura

```
src/
├── app/(dashboard)/     # Páginas del panel admin
├── components/
│   ├── ui/              # shadcn/ui
│   ├── layout/          # Sidebar, Navbar
│   ├── dashboard/       # Stat cards
│   ├── students/        # Tabla y formulario
│   ├── tickets/         # Vista VIP
│   ├── cycles/          # Cards por ciclo
│   └── reports/         # Gráficos Recharts
├── data/                # Mock data
├── lib/                 # API, utils, constants
└── types/
```
