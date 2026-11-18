import { Controller, Get, Post, Patch, Body, Param, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaProductRepository } from './prisma-product.repository';
import { Product } from '../domain/product';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Controller('admin/products')
export class AdminProductsController {
  constructor(
    private readonly productRepo: PrismaProductRepository,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  async listProducts() {
    const products = await this.productRepo.findAll();
    return products.map((p) => p.propsSnapshot);
  }

  @Post()
  async createProduct(@Body() body: { name: string; description?: string; brand?: string; category?: string; photoUrl?: string; active?: boolean }) {
    try {
      const product = Product.create({
        name: body.name,
        description: body.description,
        brand: body.brand,
        category: body.category,
        photoUrl: body.photoUrl,
        active: body.active,
      });
      await this.productRepo.save(product);
      return product.propsSnapshot;
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  @Patch(':id')
  async updateProduct(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; brand?: string; category?: string; photoUrl?: string; active?: boolean }
  ) {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundException('Product not found');
    try {
      product.update(body);
      await this.productRepo.save(product);
      return product.propsSnapshot;
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  @Post(':id/variants')
  async createVariant(
    @Param('id') productId: string,
    @Body() body: { name: string; sku: string; price: number; active?: boolean }
  ) {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    const variant = await this.prisma.productVariant.create({
      data: {
        productId,
        name: body.name,
        sku: body.sku,
        price: body.price,
        active: body.active ?? true,
      },
    });
    return variant;
  }

  @Patch('variants/:variantId/stock/:locationId')
  async updateStock(
    @Param('variantId') variantId: string,
    @Param('locationId') locationId: string,
    @Body() body: { quantity: number }
  ) {
    const stockItem = await this.prisma.stockItem.upsert({
      where: {
        variantId_locationId: { variantId, locationId },
      },
      create: {
        variantId,
        locationId,
        quantity: body.quantity,
      },
      update: {
        quantity: body.quantity,
      },
    });
    return stockItem;
  }
}
