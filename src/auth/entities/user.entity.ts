import { ApiProperty } from '@nestjs/swagger';
import { Product } from 'src/products/entities';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @ApiProperty({
    example: '0173c516-bc0e-44cd-a852-032571fdc932',
    description: 'User ID',
    uniqueItems: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'user_email@gmail.com',
    description: 'User email',
    uniqueItems: true,
  })
  @Column('text', {
    unique: true,
  })
  email: string;

  @ApiProperty({
    example: 's0M3_pAsSuuoRdd!',
    description: 'User password',
  })
  @Column('text', {
    // Select como falso significa que no va a devolvernos este valor en caso de consultar los registros de esta entidad.
    select: false,
  })
  password: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
  })
  @Column('text')
  fullName: string;

  @ApiProperty({
    example: true,
    description: 'User status',
    default: true,
  })
  @Column('bool', { default: true })
  isActive: boolean;

  @ApiProperty({
    example: ['user'],
    description: 'User roles',
    default: ['user'],
  })
  @Column({ type: 'text', array: true, default: ['user'] })
  roles: string[];

  @OneToMany(() => Product, (product) => product.user)
  product: Product;

  @BeforeInsert()
  checkFields() {
    this.email = this.email.toLowerCase().trim();
  }

  @BeforeUpdate()
  checkFieldsBeforeUpdate() {
    this.checkFields();
  }
}
