import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Product } from '../domain/product';

@Injectable()
export class PrismaProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(product: Product): Promise<void> {
    const data = product.propsSnapshot;
    await this.prisma.product.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        name: data.name,
        description: data.description,
        brand: data.brand,
        category: data.category,
        photoUrl: data.photoUrl,
        active: data.active,
      },
      update: {
        name: data.name,
        description: data.description,
        brand: data.brand,
        category: data.category,
        photoUrl: data.photoUrl,
        active: data.active,
      },
    });
  }

  async findById(id: string): Promise<Product | null> {
    const record = await this.prisma.product.findUnique({ where: { id } });
    if (!record) return null;
    return Product.restore({
      id: record.id,
      name: record.name,
      description: record.description,
      brand: record.brand,
      category: record.category,
      photoUrl: record.photoUrl,
      active: record.active,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async findAllActive(): Promise<Product[]> {
    const records = await this.prisma.product.findMany({ where: { active: true } });
    return records.map((record) =>
      Product.restore({
        id: record.id,
        name: record.name,
        description: record.description,
        brand: record.brand,
        category: record.category,
        photoUrl: record.photoUrl,
        active: record.active,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      })
    );
  }

  async findAll(): Promise<Product[]> {
    const records = await this.prisma.product.findMany();
    return records.map((record) =>
      Product.restore({
        id: record.id,
        name: record.name,
        description: record.description,
        brand: record.brand,
        category: record.category,
        photoUrl: record.photoUrl,
        active: record.active,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      })
    );
  }
}
