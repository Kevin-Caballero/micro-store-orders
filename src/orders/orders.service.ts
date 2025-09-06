import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { envs, NATS_SERVICE } from 'src/config';
import { OrderStatus } from 'generated/prisma';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrdersPaginationDto } from './dtos/orders-pagination.dto';
import { CreateOrderDto } from './dtos';
import { PaginationHelper } from 'src/common';
import { lastValueFrom } from 'rxjs';
import { Product } from 'src/common/entities/product.entity';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
  ) {}

  changeOrderStatus(id: string, status: OrderStatus) {
    try {
      return this.prisma.order.update({
        where: { id },
        data: { status },
      });
    } catch (error) {
      this.logger.error(
        `Failed to change status for order with id ${id}`,
        error,
      );
      throw new RpcException({
        message: `Failed to change status for order with id ${id}`,
        service: 'ORDERS',
      });
    }
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      const products = await lastValueFrom<Product[]>(
        this.client.send(
          { cmd: 'validate_product_ids' },
          createOrderDto.items.map((item) => item.productId),
        ),
      );
      const totalAmount = createOrderDto.items.reduce(
        (sum, item) =>
          sum +
          (products.find((p) => p.id === item.productId)?.price || 0) *
            item.quantity,
        0,
      );
      const totalItems = createOrderDto.items.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      const order = await this.prisma.order.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((item) => ({
                productId: String(item.productId),
                quantity: item.quantity,
                price:
                  products.find((p) => p.id === item.productId)?.price || 0,
              })),
            },
          },
        },
        include: {
          OrderItem: {
            select: {
              productId: true,
              quantity: true,
              price: true,
            },
          },
        },
      });

      const { OrderItem, ...orderWithoutOrderItem } = order;
      const orderToReturn = {
        ...orderWithoutOrderItem,
        orderItems: OrderItem.map((item) => ({
          productId: item.productId,
          productName:
            products.find((p) => String(p.id) === item.productId)?.name || '',
          quantity: item.quantity,
          price: item.price,
        })),
      };
      return orderToReturn;
    } catch (error) {
      this.logger.error(`Failed to create order`, JSON.stringify(error));
      if (error.response?.service === 'PRODUCTS') throw new RpcException(error);
      throw new RpcException({
        message: 'Failed to create order: ' + error.message,
        service: 'ORDERS',
      });
    }
  }

  async findAll(paginationDto: OrdersPaginationDto) {
    const { limit, page } = paginationDto;
    const totalItems = await this.prisma.order.count();
    const baseUrl = `${envs.baseUrl}:${envs.port}/orders`;
    const meta = await PaginationHelper.buildMeta(
      limit,
      page,
      totalItems,
      baseUrl,
    );
    return {
      data: await this.prisma.order.findMany({
        where: paginationDto.status
          ? { status: paginationDto.status as OrderStatus }
          : {},
        skip: (page - 1) * limit,
        take: limit,
      }),
      meta: meta,
    };
  }

  async findOne(id: string) {
    try {
      const { OrderItem, ...orderWithoutOrderItem } =
        await this.prisma.order.findUniqueOrThrow({
          where: { id },
          include: { OrderItem: true },
        });
      const productIds = OrderItem.map((item) => Number(item.productId));
      const products = await lastValueFrom<Product[]>(
        this.client.send({ cmd: 'validate_product_ids' }, productIds),
      );
      const orderToReturn = {
        ...orderWithoutOrderItem,
        orderItems: OrderItem.map((item) => ({
          productId: item.productId,
          productName:
            products.find((p) => String(p.id) === item.productId)?.name || '',
          quantity: item.quantity,
          price: item.price,
        })),
      };
      return orderToReturn;
    } catch (error) {
      this.logger.error(`Failed to find order with id ${id}`, error);
      throw new RpcException(
        new NotFoundException({
          message: `Order with id ${id} not found`,
          service: 'ORDERS',
        }),
      );
    }
  }
}
