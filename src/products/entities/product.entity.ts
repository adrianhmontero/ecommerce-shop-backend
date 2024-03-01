import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductImage } from './';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * El decorador Column nos permite crear columnas para nuestras entidades.
   * El primer parámetro es el tipo de dato que contendrá dicha columna.
   * Es importante revisar que el tipo de dato que se haya pasado sea compatible
   * con postgres.
   * El segundo parámetro nos permite definir reglas para la creación de nuestros
   * registros.
   */
  @Column('text', {
    unique: true,
  })
  title: string;

  @Column('float', { default: 0 })
  price: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string;

  @Column({
    unique: true,
    type: 'text',
  })
  slug: string;

  @Column('int', {
    default: 0,
  })
  stock: number;

  @Column({ type: 'text', array: true })
  sizes: string[];

  @Column('text')
  gender: string;

  @Column({
    type: 'text',
    array: true,
    default: [],
  })
  tags: string[];

  @OneToMany(() => ProductImage, (productImage) => productImage.product, {
    cascade: true,
    /* Lo que hace el eager es cargar todas las relaciones cuando ejecutemos un método find* */
    eager: true,
  })
  images?: ProductImage[];

  @BeforeInsert()
  checkSlugInsert() {
    if (!this.slug) {
      this.slug = this.title;
    }
    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }

  @BeforeUpdate()
  checkSlugUpdate() {
    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }
}
