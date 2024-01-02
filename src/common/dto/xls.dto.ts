import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsDateString, IsInt, IsOptional, IsString } from 'class-validator'

export class XlsDto {
  @ApiProperty({
    description: 'Creador',
    required: false,
  })
  @IsString()
  @IsOptional()
  creator?: string

  @ApiProperty({
    description: 'Ultima modif',
    required: false,
  })
  @IsOptional()
  @IsString()
  updatedBy?: string

  @ApiProperty({
    description: 'File to read',
    required: true,
  })
  @IsString()
  filename: string

  @ApiProperty({
    description: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  createdAt?: string

  @ApiProperty({
    description: 'updatedAt',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  updateddAt?: string

  @ApiProperty({
    description: 'Optional Alternative Folder',
    required: false,
  })
  @IsOptional()
  @IsString()
  folder?: string

  @ApiProperty({
    description: `Worksheets`,
    isArray: true,
    required: true,
  })
  @IsArray()
  worksheets: WorksheetsDto[]
}

//todo: seguro que se agregan caract del worksheet aqui
//const worksheet = workbook.addWorksheet('sheet', {properties:{tabColor:{argb:'FF00FF00'}}});
export class WorksheetsDto {
  @ApiProperty({
    description: `Worksheets`,
  })
  @IsString()
  name: string

  @ApiProperty({
    description: `Columns`,
    isArray: true,
    required: true,
  })
  @IsArray()
  columns: ColumnsDto[]

  @ApiProperty({
    description: `rows of excel`,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  rows?: object[]

  @ApiProperty({
    description: `rows of excel`,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  rowsToExclude?: number[]
}

export class ColumnsDto {
  @ApiProperty({
    description: `Header of Columns`,
  })
  @IsString()
  header: string

  @ApiProperty({
    description: `Key of Columns`,
  })
  @IsString()
  key: string
}

export class WorksheetsReadDto extends WorksheetsDto {
  totalRows: number
}

export class InjectInfoDto {
  @ApiProperty({
    description: `Name of template file`,
  })
  @IsString()
  fileTemplate: string

  @ApiProperty({
    description: 'Optional Alternative Folder for template',
    required: false,
  })
  @IsOptional()
  @IsString()
  folderTemplate?: string

  @ApiProperty({
    description: `Name of destination file`,
  })
  @IsString()
  fileToExport: string

  @ApiProperty({
    description: 'Optional Alternative Folder for destination',
    required: false,
  })
  @IsOptional()
  @IsString()
  folderToExport?: string

  @ApiProperty({
    description: `List of sheet to be inject`,
  })
  @IsArray()
  sheets: SheetToInject[]
}

export class SheetToInject {
  @ApiProperty({
    description: `Name OR Number destination sheet`,
  })
  name: string | number

  @ApiProperty({
    description: `Rows to inject`,
  })
  @IsArray()
  rows: rowsToInject[]
}

export class rowsToInject {
  @ApiProperty({
    description: `Row number`,
  })
  @IsInt()
  number: number

  @ApiProperty({
    description: `Debe desplazar las filas hacia abajo`,
  })
  @IsArray()
  @IsOptional()
  add?: boolean

  @ApiProperty({
    description: `Should copy the styles from previous line?`,
  })
  @IsArray()
  @IsOptional()
  copyStyles?: boolean

  @ApiProperty({
    description: `Cells to inject`,
  })
  @IsArray()
  cells: CellsToInject[]
}

export class CellsToInject {
  @ApiProperty({
    description: `Cell location. EJ "B2" , "C3"`,
  })
  cell: string

  @ApiProperty({
    description: `New value of the cell`,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
}
