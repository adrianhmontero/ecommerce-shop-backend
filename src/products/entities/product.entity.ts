import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * El decorador Column nos permite crear columnas para nuestras entidades.
   * El primer parámetro es el tipo de dato que contendrá dicha columna.
   * Es importante revisar que el tipo de dato que se haya pasado sea compatible
   * con TypeOrm.
   * El segundo parámetro nos permite definir reglas para la creación de nuestros
   * registros.
   */
  @Column('text', {
    unique: true,
  })
  title: string;
}
