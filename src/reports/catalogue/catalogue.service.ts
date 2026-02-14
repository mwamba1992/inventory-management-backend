import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Item } from '../../items/item/entities/item.entity';
import { CatalogueFilterDto } from '../dto/catalogue-filter.dto';

interface CatalogueProduct {
  rowNumber: number;
  name: string;
  code: string;
  description: string;
  brandName: string;
  condition: string;
  conditionClass: string;
  sellingPrice: string;
  stockStatus: string;
  stockClass: string;
}

interface CategoryGroup {
  categoryName: string;
  productCount: number;
  products: CatalogueProduct[];
}

@Injectable()
export class CatalogueService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
  ) {}

  async generateCataloguePdf(filter?: CatalogueFilterDto): Promise<Buffer> {
    const items = await this.queryItems(filter);
    const categories = this.groupByCategory(items);

    const totalInStock = items.filter((item) => {
      const qty = item.stock?.reduce((sum, s) => sum + s.quantity, 0) || 0;
      return qty > 0;
    }).length;

    // Get business info from the first item that has it
    const business = items.find((i) => i.business)?.business;

    const templateData = {
      businessName: business?.name || 'Product Catalogue',
      businessPhone: business?.phone || '',
      businessEmail: business?.email || '',
      businessWebsite: business?.website || '',
      generatedDate: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      totalProducts: items.length,
      totalCategories: categories.length,
      totalInStock,
      categories,
    };

    const html = this.compileTemplate(templateData);
    return this.generatePdf(html);
  }

  private async queryItems(filter?: CatalogueFilterDto): Promise<Item[]> {
    const qb = this.itemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.brand', 'brand')
      .leftJoinAndSelect('item.business', 'business')
      .leftJoinAndSelect('item.prices', 'prices', 'prices.isActive = :active', {
        active: true,
      })
      .leftJoinAndSelect('item.stock', 'stock')
      .orderBy('category.description', 'ASC')
      .addOrderBy('item.name', 'ASC');

    if (filter?.categoryId) {
      qb.andWhere('category.id = :categoryId', {
        categoryId: filter.categoryId,
      });
    }

    if (filter?.inStockOnly) {
      qb.andWhere('stock.quantity > 0');
    }

    return qb.getMany();
  }

  private groupByCategory(items: Item[]): CategoryGroup[] {
    const map = new Map<string, Item[]>();

    for (const item of items) {
      const name = item.category?.description || 'Uncategorized';
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(item);
    }

    return Array.from(map.entries()).map(([categoryName, categoryItems]) => ({
      categoryName,
      productCount: categoryItems.length,
      products: categoryItems.map((item, idx) => {
        const totalStock =
          item.stock?.reduce((sum, s) => sum + s.quantity, 0) || 0;
        const reorderPoint = item.stock?.[0]?.reorderPoint || 0;

        let stockStatus = 'Out of Stock';
        let stockClass = 'out-of-stock';
        if (totalStock > reorderPoint) {
          stockStatus = 'In Stock';
          stockClass = 'in-stock';
        } else if (totalStock > 0) {
          stockStatus = 'Low Stock';
          stockClass = 'low-stock';
        }

        const activePrice = item.prices?.find((p) => p.isActive);
        const price = activePrice?.sellingPrice || 0;

        return {
          rowNumber: idx + 1,
          name: item.name,
          code: item.code || '-',
          description: item.desc || '',
          brandName: item.brand?.name || '-',
          condition: item.condition === 'new' ? 'New' : 'Used',
          conditionClass:
            item.condition === 'new' ? 'condition-new' : 'condition-used',
          sellingPrice: Number(price).toLocaleString('en-US'),
          stockStatus,
          stockClass,
        };
      }),
    }));
  }

  private compileTemplate(data: Record<string, any>): string {
    const templatePath = join(__dirname, '..', 'templates', 'catalogue.hbs');
    const source = readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(source);
    return template(data);
  }

  private async generatePdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '12mm', bottom: '15mm', left: '12mm' },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
