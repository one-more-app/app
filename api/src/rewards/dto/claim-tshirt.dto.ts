import {
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TshirtRewardType } from '../entities/tshirt-reward-type.enum.js';
import { TshirtGender } from '../entities/tshirt-gender.enum.js';

export const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
export type TshirtSize = (typeof TSHIRT_SIZES)[number];

export const TSHIRT_GENDERS = Object.values(TshirtGender);
export type TshirtGenderValue = `${TshirtGender}`;

export class ClaimTshirtDto {
  @IsIn(Object.values(TshirtRewardType))
  rewardType!: TshirtRewardType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  street!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  postalCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  country!: string;

  @IsIn(TSHIRT_SIZES)
  size!: TshirtSize;

  @IsIn(TSHIRT_GENDERS)
  gender!: TshirtGenderValue;
}
