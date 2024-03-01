import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './';

@Entity()
export class ProductImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  url: string;

  // Muchas imágenes pueden tener relacionadas un solo producto
  @ManyToOne(() => Product, (product) => product.images)
  product: Product;
}
