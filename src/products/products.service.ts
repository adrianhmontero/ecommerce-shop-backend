import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { isValidObjectId } from 'mongoose';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductService');
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRepository.create(createProductDto);
      await this.productRepository.save(product);

      return product;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll() {
    return this.productRepository.find();
  }

  async findOne(term: string) {
    let product: Product;

    if (!product && isValidObjectId(term))
      product = await this.productRepository.findOneBy({ id: term });
    else product = await this.productRepository.findOneBy({ slug: term });

    if (!product)
      throw new NotFoundException(`Product with id or slug ${term} not found.`);

    return product;
  }

  async update(term: string, updateProductDto: UpdateProductDto) {
    const productToUpdate = await this.findOne(term);

    if (!productToUpdate)
      throw new NotFoundException(`Product with id or slug ${term} not found.`);

    try {
      const { id } = productToUpdate;
      const productUpdated = { ...productToUpdate, ...updateProductDto, id };

      const product = this.productRepository.save(productUpdated);

      return product;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    const productToDelete = await this.findOne(id);
    await this.productRepository.remove(productToDelete);

    return;
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error. Check server logs.',
    );
  }

  private handleExceptions(error: any, method: string = 'GET') {
    const methods = {
      PATCH: 'update',
      GET: 'get',
      POST: 'create',
    };
    /**
     * Este código 11000 indica que ya existe un registro en DB que coincide con ese valor.  */
    if (error.code === 11000)
      throw new BadRequestException(
        `Product exists in DB ${JSON.stringify(error.keyValue)}`,
      );
    /**
     * Si no es error 11000, tenemos que revisar qué salió mal, y para indicar esto al frontend necesitamos usar el siguiente Exception Filter
     */
    throw new InternalServerErrorException(
      `Can not ${methods[method]} Product - Check server logs`,
    );
  }
}
