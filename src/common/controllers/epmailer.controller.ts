import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { EpmailerService } from '../services/epmailer.service'
import { SendMailDto } from '../dto/sendmail.dto'
import { EpxlsService } from '../services/epxls.service'
/* import { tigXlsConfig } from 'src/engine/controls/config/tig.config'; */

@ApiTags('Mailer')
@Controller('mailer')
export class EpmailerController {
  constructor(private readonly mailerService: EpmailerService, private readonly xlsservice: EpxlsService) {}

  @Post('send')
  async create(@Body() body: SendMailDto) {
    try {
      /* const configService = new ConfigService();
      const fileToDataToRead = tigXlsConfig

      //console.log(fileToDataToRead)
      const data = await this.xlsservice.read(fileToDataToRead)
      return data; */
      /* this.xlsservice.write({
        filename: `nuevo_gaston.xlsx`,
        folder: 'nuevos',
        creator: 'Gaston Rodriguez',
        worksheets: [
          { 
            name: 'hoja1',
            columns: [
              { key: 'firstname', header: 'Columna 1' },
              { key: 'lastname', header: 'Columna 2' },
              { key: 'othername', header: 'Columna 3' },
            ],
            rows: [
                { firstname: 'Gaston Eduardo', lastname: 'Rodriguez', othername: 'gato' },
                { firstname: 'Gaston Eduardo2', lastname: 'Rodriguez1', othername: 'gato1' },
                { firstname: 'Gaston Eduardo3', lastname: 'Rodriguez3', othername: 'gato2' },
                { firstname: 'Gaston Eduardo4', lastname: 'Rodriguez4', othername: 'gato3' },
            ], 
          },
          { 
            name: 'hola2', 
            columns: [
              { key: 'firstname', header: 'hola2 A' },
              { key: 'lastname', header: 'hola2 B' },
              { key: 'othername', header: 'hola2 C' },
            ],
            rows: [
                { firstname: 'Gaston hola2 o', lastname: 'Rodriguez', othername: 'gato' },
                { firstname: 'Gaston hola2 2', lastname: 'Rodriguez1', othername: 'gato1' },
                { firstname: 'Gaston hola2 3', lastname: 'Rodriguez3', othername: 'gato2' },
                { firstname: 'Gaston hola2 4', lastname: 'Rodriguez4', othername: 'gato3' },
            ],
          },
          { 
            name: 'hola3', 
            columns: [
              { key: 'firstname', header: 'hola3 A' },
              { key: 'lastname', header: 'hola3 B' },
              { key: 'othername', header: 'hola3 C' },
            ],
            rows: [
                { firstname: 'Gaston hola3 1', lastname: 'Rodriguez', othername: 'gato' },
                { firstname: 'Gaston hola3 1q', lastname: 'Rodriguez1', othername: 'gato1' },
                { firstname: 'Gaston hola3 1e', lastname: 'Rodriguez3', othername: 'gato2' },
                { firstname: 'Gaston hola3 13', lastname: 'Rodriguez4', othername: 'gato3' },
            ],
          },
        ],
        
      }) */

      return this.mailerService.enviar(body)
    } catch (error) {
      return false
    }
  }
}
