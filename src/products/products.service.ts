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
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';
import { ProductImage, Product } from './entities';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductService');
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    // COn esto podemos crear instancias de ProductImage fácilmente
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const { images = [], ...productDetails } = createProductDto;
      /**
       * Lo siguiente es muy interesante: Nosotros estamos creando un producto donde estamos a su vez creando n instancias
       * de imágenes (product-image). Cada instancia de imagen exige añadir la propiedad product. En este punto, nosotros apenas
       * estamos creando el producto, así que como tal no podemos añadir el valor exacto de esa propiedad porque aún no existe
       * nuestro producto en la DB, pero lo que pasa es que TypeORM infiere lo ya mencionado. Es decir, TyopeORM detecta que
       * estamos creando instancias de imagenes dentro de la creación de un producto. Por lo tanto, cada instancia de imagen dentro
       * de este producto tendrá relacionado dicho producto.
       */
      const product = this.productRepository.create({
        ...productDetails,
        images: images.map((img) =>
          this.productImageRepository.create({ url: img }),
        ),
      });
      await this.productRepository.save(product);

      return { ...product, images };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      /* Con esta propiedad le estamos diciendo a TypeORM que me traiga todas las relaciones de imagen que tenga cada producto. */
      relations: { images: true },
    });

    return products.map((p) => ({
      ...p,
      images: p.images.map((img) => img.url),
    }));
  }

  async findOne(term: string) {
    let product: Product;

    if (isUUID(term))
      product = await this.productRepository.findOneBy({ id: term });
    else {
      const queryBuilder = this.productRepository.createQueryBuilder('product');
      product = await queryBuilder
        /**
         * El where del queryBuilder en teoría hace lo mismo que una query en DB:
         * Select * from Products where slug='xxx' or title='xxx' */
        .where('UPPER(title) =:title or slug =:slug', {
          title: term.toUpperCase(),
          slug: term,
        })
        /* Una ventaja de usar leftJoinAndSelect es que devuelve un arreglo vacío si no encuentra ningún registro relacionado. */
        .leftJoinAndSelect('product.images', 'productImage')
        .getOne();

      // product = await this.productRepository.findOneBy({ slug: term });
    }

    if (!product)
      throw new NotFoundException(`Product with ${term} not found.`);

    return product;
  }

  async findOnePlain(term: string) {
    const { images = [], ...product } = await this.findOne(term);
    return {
      ...product,
      images: images.map((img) => img.url),
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.preload({
      id,
      ...updateProductDto,
      images: [],
    });
    if (!product)
      throw new NotFoundException(`Product with id ${id} not found`);

    try {
      await this.productRepository.save(product);
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
