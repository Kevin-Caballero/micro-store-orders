# Orders Service - Micro Store

📦 **Orders Service** es el microservicio responsable del procesamiento completo de órdenes en el sistema Micro Store. Gestiona el ciclo de vida completo desde la creación hasta la entrega.

## 🎯 Propósito

El Orders Service es responsable de:

- **Gestión de órdenes**: CRUD completo de órdenes
- **Procesamiento de pagos**: Integración con sistemas de pago
- **Gestión de estados**: Control del flujo de estados de orden
- **Validación de productos**: Coordinación con Products Service
- **Tracking y notificaciones**: Seguimiento de órdenes
- **Reportes**: Analíticas de ventas y órdenes

## 🏗️ Arquitectura

```
Gateway → NATS → Orders Service → PostgreSQL Database
                       ↓              ↓
               Products Service   Order Items
```

### Componentes Principales

- **Orders Controller**: Maneja mensajes NATS
- **Orders Service**: Lógica de negocio de órdenes
- **Prisma Service**: Acceso a datos PostgreSQL
- **Health Module**: Monitoreo de salud del servicio

## 📊 Modelo de Datos

### Order Entity

```typescript
model Order {
  id          String      @id @default(uuid())
  total       Float
  status      OrderStatus @default(PENDING)
  paid        Boolean     @default(false)
  paidAt      DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // Relaciones
  orderItems  OrderItem[]
}
```

### OrderItem Entity

```typescript
model OrderItem {
  id        String @id @default(uuid())
  productId String
  quantity  Int
  price     Float

  // Relaciones
  order     Order  @relation(fields: [orderId], references: [id])
  orderId   String
}
```

### Order Status Enum

```typescript
enum OrderStatus {
  PENDING
  PAID
  DELIVERED
  CANCELLED
}
```

## 📡 Message Patterns (NATS)

### Patrones de Entrada

| Patrón              | Descripción               | Payload                               |
| ------------------- | ------------------------- | ------------------------------------- |
| `findAllOrders`     | Obtener todas las órdenes | `{}`                                  |
| `findOneOrder`      | Obtener orden por ID      | `{ id: string }`                      |
| `createOrder`       | Crear nueva orden         | `CreateOrderDto`                      |
| `updateOrderStatus` | Actualizar estado         | `{ id: string, status: OrderStatus }` |
| `changeOrderStatus` | Cambiar estado de orden   | `ChangeOrderStatusDto`                |

### Patrones de Salida

| Patrón                 | Descripción     | Cuando se emite         |
| ---------------------- | --------------- | ----------------------- |
| `order.created`        | Orden creada    | Después de crear orden  |
| `order.status.changed` | Estado cambiado | Cuando cambia el estado |
| `order.paid`           | Orden pagada    | Cuando se confirma pago |
| `order.cancelled`      | Orden cancelada | Al cancelar orden       |

### Integración con Products Service

| Patrón Enviado         | Descripción                        | Respuesta Esperada                       |
| ---------------------- | ---------------------------------- | ---------------------------------------- |
| `validateProductStock` | Validar stock antes de crear orden | `stock.validated` / `stock.insufficient` |

## 🔧 Configuración

### Variables de Entorno

```env
PORT=3002
NATS_SERVERS=nats://nats-server:4222
DATABASE_URL=postgresql://postgres:password@orders-db:5432/ordersdb
BASE_URL=http://orders:3002
```

### Dependencias Principales

- **@nestjs/microservices**: Cliente NATS
- **@prisma/client**: ORM para PostgreSQL
- **class-validator**: Validación de DTOs
- **shared**: DTOs compartidas del proyecto

## 🗄️ Base de Datos

### PostgreSQL Configuration

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Health Checks

```yaml
# Docker Compose Health Check
healthcheck:
  test: ['CMD-SHELL', 'pg_isready -U postgres -d ordersdb']
  interval: 10s
  timeout: 5s
  retries: 5
```

### Migraciones

```bash
# Generar migración
npx prisma migrate dev --name add_orders

# Aplicar migraciones en producción
npx prisma migrate deploy

# Resetear base de datos (solo desarrollo)
npx prisma migrate reset

# Ver base de datos
npx prisma studio
```

## 🚀 Desarrollo

### Instalación

```bash
npm install
```

### Comandos Disponibles

```bash
# Desarrollo con hot reload
npm run start:dev

# Producción
npm run start:prod

# Build
npm run build

# Tests
npm run test
npm run test:e2e

# Base de datos
npx prisma studio
npx prisma migrate dev
```

### Desarrollo Local

Para desarrollo local necesitas:

1. **PostgreSQL**: Base de datos (puerto 5432)
2. **NATS Server**: Servidor de mensajes (puerto 4222)
3. **Products Service**: Para validación de productos

```bash
# Opción 1: Solo el servicio (requiere deps externas)
npm run start:dev

# Opción 2: Usar Docker Compose (desde la raíz del proyecto)
cd ../..
npm start
```

## 📝 DTOs y Validación

### CreateOrderDto

```typescript
export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
```

### CreateOrderItemDto

```typescript
export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsPositive()
  price: number;
}
```

### ChangeOrderStatusDto

```typescript
export class ChangeOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsEnum(OrderStatus)
  status: OrderStatus;
}
```

## 🔄 Flujo de Procesos

### Creación de Orden

1. **Recibir petición** de crear orden
2. **Validar productos** con Products Service
3. **Calcular total** de la orden
4. **Crear orden** en base de datos
5. **Crear items** de la orden
6. **Emitir evento** `order.created`
7. **Responder** con orden creada

### Cambio de Estado

1. **Recibir petición** de cambio de estado
2. **Validar transición** de estado
3. **Actualizar orden** en base de datos
4. **Emitir evento** de cambio de estado
5. **Responder** con orden actualizada

## 🛡️ Validaciones de Negocio

### Estados Válidos

```typescript
const validTransitions = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [], // Estado final
  CANCELLED: [], // Estado final
};
```

### Reglas de Negocio

- Una orden no puede ser modificada después de ser entregada
- Solo se puede cancelar si no ha sido entregada
- El total se calcula automáticamente
- Los productos deben existir y tener stock

## 📊 Monitoreo

### Health Check

```typescript
@Get('health')
async health() {
  return {
    status: 'ok',
    database: await this.prisma.$queryRaw`SELECT 1`,
    orders_count: await this.prisma.order.count(),
    timestamp: new Date().toISOString()
  };
}
```

### Métricas

- Número de órdenes por estado
- Tiempo promedio de procesamiento
- Valor total de órdenes
- Tasa de órdenes canceladas

## 🔍 Funcionalidades Avanzadas

### Filtros y Búsquedas

```typescript
// Buscar órdenes por estado
findByStatus(status: OrderStatus)

// Buscar órdenes por fecha
findByDateRange(startDate: Date, endDate: Date)

// Buscar órdenes por cliente
findByCustomer(customerId: string)
```

### Reportes

- Ventas por período
- Productos más vendidos
- Análisis de órdenes canceladas
- Tiempo promedio de entrega

## 🔗 Enlaces Relacionados

- [Gateway Service](../gateway/README.md)
- [Products Service](../products/README.md)
- [Shared DTOs](../../shared/README.md)
- [Prisma Documentation](https://www.prisma.io/docs/)

---

**Puerto por defecto**: 3002  
**Base de datos**: PostgreSQL  
**ORM**: Prisma  
**Framework**: NestJS + TypeScript  
**Autor**: Kevin Caballero
