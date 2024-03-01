import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './';

@Entity()
export class ProductImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  url: string;

  // Muchas imágenes pueden tener relacionadas un solo producto
  @ManyToOne(() => Product, (product) => product.images, {
    /* Esto significa que, cuando queramos eliminar un producto, vamos a eliminar todos los registros de imagenes relacionadas a ese producto */
    onDelete: 'CASCADE',
  })
  product: Product;
}
