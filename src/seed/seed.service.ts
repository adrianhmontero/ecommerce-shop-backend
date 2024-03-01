import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class SeedService {
  constructor(private readonly productsService: ProductsService) {}
  async runSeed() {
    await this.instertNewProducts();
    return `SEED EXECUTED`;
  }

  private async instertNewProducts() {
    await this.productsService.deleteAllProducts();
    return true;
  }
}
