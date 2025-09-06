import { Controller, Logger, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { OrdersPaginationDto } from './dtos/orders-pagination.dto';
import { CreateOrderDto } from './dtos';
import { OrderStatus } from 'generated/prisma';

@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern({ cmd: 'create_order' })
  create(@Payload() createOrderDto: CreateOrderDto) {
    this.logger.log(`[create] - Body: ${JSON.stringify(createOrderDto)}`);
    return this.ordersService.create(createOrderDto);
  }

  @MessagePattern({ cmd: 'find_all_orders' })
  findAll(@Payload() paginationDto: OrdersPaginationDto) {
    this.logger.log(
      `[findAll] - Page: ${paginationDto.page}, Limit: ${paginationDto.limit}`,
    );
    return this.ordersService.findAll(paginationDto);
  }

  @MessagePattern({ cmd: 'find_one_order' })
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    this.logger.log(`[findOne] - ID: ${id}`);
    return this.ordersService.findOne(id);
  }

  @MessagePattern({ cmd: 'change_order_status' })
  changeOrderStatus(@Payload() data: { id: string; status: OrderStatus }) {
    this.logger.log(
      `[changeOrderStatus] - ID: ${data.id}, Status: ${data.status}`,
    );
    const { id, status } = data;
    return this.ordersService.changeOrderStatus(id, status);
  }
}
