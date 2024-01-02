import * as fs from 'fs'
import { ConfigService } from '@nestjs/config'
import { Injectable } from '@nestjs/common'
import * as Excel from 'exceljs'

import { WorksheetsDto, WorksheetsReadDto, XlsDto, InjectInfoDto, SheetToInject, CellsToInject } from '../dto'
import { BaseService } from './base.service'
import { EploggerService } from './eplogger.service'
import { ColumnsDto, rowsToInject } from '../dto/xls.dto'

@Injectable()
export class EpxlsService extends BaseService {
  private context = 'xlsService'

  constructor(
    private configService: ConfigService,
    private excel: Excel.Workbook,
    protected readonly logger: EploggerService,
  ) {
    super(logger)
  }

  async read(fileInformation: XlsDto, from = 1, to = 100): Promise<WorksheetsReadDto[]> {
    const { filename, worksheets, folder } = fileInformation

    try {
      await this.excel.xlsx.readFile(
        `${this.configService.get('XLS_FOLDER')}/${folder! ? folder + '/' : ''}${filename}`,
      )

      const wss: (Excel.Worksheet | undefined)[] = this.getWorksheets(worksheets)
      const data = await wss.map(ws => {
        const wsorigenactual: WorksheetsDto[] = worksheets.filter(wsoriginal => wsoriginal.name === ws!.name)
        const columns = wsorigenactual[0].columns
        const rowsToExclude = wsorigenactual[0].rowsToExclude ?? []

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows: any[] = []
        const totalRows = ws!.lastRow!.number

        ws!.eachRow((row: Excel.Row, rowNumber) => {
          if (rowNumber >= from && rowNumber <= to) {
            if (!rowsToExclude.includes(rowNumber)) {
              const rowValues = columns.map((c: ColumnsDto, key: number) => {
                let fila: { [key: string]: Excel.CellValue } = {}

                // Verificar si row.values es un arreglo o un objeto
                if (Array.isArray(row.values)) {
                  fila[c.key] = row.values[key]
                } else {
                  fila = row.values
                }

                return fila
              })

              rows.push(rowValues)
            }
          }
        })

        return {
          name: ws!.name,
          columns,
          rows,
          totalRows,
        }
      })
      return data
    } catch (error) {
      this.logger.error({
        context: this.context,
        message: error,
      })
      const ret: WorksheetsReadDto[] = []
      return ret
    }
  }

  private getWorksheets(worksheetsDtos: WorksheetsDto[]): (Excel.Worksheet | undefined)[] | [] {
    return worksheetsDtos.map(ws => this.excel.getWorksheet(ws.name)).filter(ws => ws!)
  }

  async write(fileInformation: XlsDto): Promise<void> {
    const { filename, folder, worksheets, creator, updatedBy, createdAt, updateddAt } = fileInformation

    const workbook1 = new Excel.Workbook()
    workbook1.creator = creator || 'Me'
    workbook1.lastModifiedBy = updatedBy || 'Me'
    workbook1.created = createdAt! ? new Date(createdAt) : new Date()
    workbook1.modified = updateddAt! ? new Date(updateddAt) : new Date()

    worksheets.map(ws => {
      const sheet = workbook1.addWorksheet(ws.name)
      sheet.columns = ws.columns
      if (ws.rows!.length > 0) sheet.addRows(ws.rows!)
    })

    /* 
        const sheet1 = workbook1.addWorksheet('Sheet2');
        worksheet.addRow({id: 1, name: 'John Doe', dob: new Date(1970,1,1)});
        worksheet.addRow({id: 2, name: 'Jane Doe', dob: new Date(1965,1,7)});
        // Add a row by contiguous Array (assign to columns A, B & C)
        worksheet.addRow([3, 'Sam', new Date()]); */
    try {
      const filepath = `${__dirname}/../../../${this.configService.get('XLS_FOLDER')}/${
        folder! ? folder + '/' : ''
      }${filename}`
      workbook1.xlsx.writeFile(filepath).then(() => {
        this.logger.debug({
          context: this.context,
          message: `xls generated ${filepath}`,
        })
      })
    } catch (error) {
      this.logger.error({
        context: this.context,
        message: error,
      })
    }
  }

  async injectInfoToATemplate(infoToInject: InjectInfoDto) {
    const { fileTemplate, fileToExport, sheets, folderTemplate, folderToExport } = infoToInject

    const sourceFilePath = `${__dirname}/../../../${this.configService.get('XLS_FOLDER')}/${
      folderTemplate! ? folderTemplate + '/' : ''
    }${fileTemplate}`

    const targetFilePath = `${__dirname}/../../../${this.configService.get('XLS_FOLDER')}/${
      folderToExport! ? folderToExport + '/' : ''
    }${fileToExport}`

    try {
      fs.copyFileSync(sourceFilePath, targetFilePath)

      await this.excel.xlsx.readFile(targetFilePath)

      await sheets.map(async (sheet: SheetToInject) => {
        const ws: Excel.Worksheet = this.excel.worksheets[sheet.name as number]
        await sheet.rows.map(async (row: rowsToInject) => {
          if (!!row.add) {
            const newRowData: string[] = [] //inserte la fila vacia
            ws.spliceRows(row.number, 0, newRowData)

            if (!!row.copyStyles) {
              const newRow = ws.getRow(row.number)
              const previousValueRow = ws.getRow(row.number + 1) //la fila que sigue se movio hacia abajo

              previousValueRow.eachCell((cell, colNumber) => {
                const actualCell = cell.address.replace(cell.row.toString(), row.number.toString())
                newRow.getCell(colNumber).value = ''
                newRow.getCell(colNumber).fill = cell.fill
                ws.getCell(actualCell).style = ws.getCell(cell.address).style
              })
              ws.addRow(newRow)
            }
          }

          row.cells.map((newCell: CellsToInject) => {
            const cell = ws.getCell(newCell.cell)
            cell.value = newCell.value
          })
        })
      })

      await this.excel.xlsx.writeFile(targetFilePath)
    } catch (error) {
      this.logger.error({
        context: this.context,
        message: error,
      })
      throw new Error('Error al Injectar informacion en excel')
    }
  }
}
