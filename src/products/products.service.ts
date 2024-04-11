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
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';
import { ProductImage, Product } from './entities';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductService');
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    // COn esto podemos crear instancias de ProductImage fácilmente
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    /* El Query Runner debe ser un objeto que conozca la cadena de conexión que estamos usando en la DB.
    El DataSource sabe esa cadena de conexión y también sabe el usuario de la DB con el que estamos
    autenticados. */
    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto, user: User) {
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
        user,
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

  async update(id: string, updateProductDto: UpdateProductDto, user: User) {
    const { images, ...toUpdate } = updateProductDto;

    const product = await this.productRepository.preload({
      id,
      ...toUpdate,
    });

    if (!product)
      throw new NotFoundException(`Product with id ${id} not found`);

    // Create Query Runner
    /* El queryRunner no va a impactar la base de datos hasta que nosotros se lo indiquemos por medio de un commit. */
    const queryRunner = this.dataSource.createQueryRunner();
    // Nos conectamos a la DB para hacer transacciones.
    await queryRunner.connect();
    // Comenzamos la transacción
    await queryRunner.startTransaction();

    try {
      if (images) {
        /*  Esta linea dice que vamos a eliminar todas los registros de Product image que en product.id sean iguales al id recibido
        en la petición */
        await queryRunner.manager.delete(ProductImage, { product: { id } });
        product.images = images.map((img) =>
          this.productImageRepository.create({ url: img }),
        );
      } else {
      }
      // await this.productRepository.save(product);
      product.user = user;
      /* Esta linea guarda el nuevo producto pero sin impactar la DB aún. */
      await queryRunner.manager.save(product);
      /* Si todo sale bien, la siguiente linea manda todas las transacciones generadas para que impacten la DB. */
      await queryRunner.commitTransaction();
      // Esta linea termina el queryRunner
      await queryRunner.release();

      return this.findOnePlain(id);
    } catch (error) {
      /* Esta linea evita impactar la base de datos si algo falla. */
      await queryRunner.rollbackTransaction();
      // Esta linea termina el queryRunner
      await queryRunner.release();
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

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query.delete().where({}).execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
}
