import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common'

import { QuoteEngineService } from '../../quotes/services/quote-engine.service'
import { QuoteTemplateRepository } from '../../quote-template/repositories/quote-template.repository'
import { QuoteTemplateBlockRepository } from '../../quote-template-block/repositories/quote-template-block.repository'
import { ContentBlockRepository } from '../../content-block/repositories/content-block.repository'
import { QuoteTemplateBlock } from '../../quote-template-block/entities/quote-template-block.entity'
import { QuoteGeneratorRequestDto, QuoteGeneratorResponseDto } from '../dto'
import { QuoteBudgetDto, QuoteResponseDto, RoomTypeQuoteDto } from '../../quotes/dto'

/**
 * QuoteGeneratorService - Servicio de Dominio para generación de presupuestos formateados
 * 
 * RESPONSABILIDAD ÚNICA (SRP):
 * - Orquesta la generación de presupuestos usando plantillas y bloques de contenido
 * - NO maneja cálculo de precios (eso es responsabilidad del QuoteEngineService)
 * - NO maneja persistencia directa (usa repositorios inyectados)
 * 
 * DEPENDENCY INVERSION PRINCIPLE (DIP):
 * - Depende del QuoteEngineService para cálculo de precios
 * - Usa repositorios de TypeORM para acceso a datos
 * 
 * DOMAIN-DRIVEN DESIGN:
 * - Implementa el caso de uso de negocio: "Generar presupuesto formateado"
 * - Combina agregados (Quote, Template, ContentBlock) para crear valor de negocio
 */
@Injectable()
export class QuoteGeneratorService {
  constructor(
    private readonly quoteEngineService: QuoteEngineService,
    @Inject(QuoteTemplateRepository)
    private readonly quoteTemplateRepository: QuoteTemplateRepository,
    @Inject(QuoteTemplateBlockRepository)
    private readonly quoteTemplateBlockRepository: QuoteTemplateBlockRepository,
    @Inject(ContentBlockRepository)
    private readonly contentBlockRepository: ContentBlockRepository,
  ) {}

  /**
   * Genera un presupuesto formateado usando una plantilla específica
   * 
   * CASO DE USO DE DOMINIO:
   * 1. Calcula precios usando el QuoteEngineService
   * 2. Obtiene la plantilla y sus bloques de contenido ordenados
   * 3. Formatea la información dinámica (precios de habitaciones)
   * 4. Ensambla el texto final combinando bloques estáticos + contenido dinámico
   * 
   * PRINCIPIO ABIERTO/CERRADO (OCP):
   * - Extensible para nuevos formatos de contenido dinámico
   * - Cerrado para modificación de la lógica base
   * 
   * @param dto Datos de la solicitud (fechas, pax, templateId)
   * @returns Presupuesto formateado como texto completo
   * @throws BadRequestException Si la plantilla no existe o no tiene bloques
   * @throws NotFoundException Si no se encuentran precios para las fechas
   */
  async generateFormattedQuote(
    dto: QuoteGeneratorRequestDto
  ): Promise<QuoteGeneratorResponseDto> {
    const { templateId, ...quoteBudgetData } = dto

    // Paso 1: Calcular precios usando el servicio existente
    const quoteBudgetDto: QuoteBudgetDto = {
      pax: quoteBudgetData.pax,
      checkInDate: quoteBudgetData.checkInDate,
      checkOutDate: quoteBudgetData.checkOutDate
    }

    const quoteData = await this.quoteEngineService.calculateQuote(quoteBudgetDto)

    // Paso 2: Obtener la plantilla con sus bloques ordenados
    const template = await this.getTemplateWithBlocks(templateId)

    // Paso 3: Formatear contenido dinámico (precios)
    const dynamicContent = this.formatDynamicContent(quoteData)

    // Paso 4: Ensamblar texto final
    const formattedQuote = this.assembleFormattedQuote(template.quoteTemplateBlocks, dynamicContent)

    return {
      formattedQuote,
      templateName: template.name
    }
  }

  /**
   * Obtiene una plantilla con sus bloques de contenido ordenados por sortOrder
   * 
   * DOMAIN LOGIC:
   * - Carga la plantilla con sus relaciones (bloques y contenido)
   * - Ordena los bloques según su sortOrder para mantener la secuencia correcta
   * 
   * @param templateId ID de la plantilla a buscar
   * @returns Plantilla con bloques ordenados
   * @throws NotFoundException Si la plantilla no existe
   */
  private async getTemplateWithBlocks(templateId: string): Promise<any> {
    const template = await this.quoteTemplateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.quoteTemplateBlocks', 'blocks')
      .leftJoinAndSelect('blocks.contentBlock', 'content')
      .where('template.id = :templateId', { templateId })
      .getOne()

    if (!template) {
      throw new NotFoundException(`Plantilla con ID ${templateId} no encontrada`)
    }

    if (!template.quoteTemplateBlocks || template.quoteTemplateBlocks.length === 0) {
      throw new BadRequestException(`La plantilla "${template.name}" no tiene bloques de contenido configurados`)
    }

    // Ordenar bloques por sortOrder para mantener la secuencia correcta
    template.quoteTemplateBlocks.sort((a, b) => a.sortOrder - b.sortOrder)

    return template
  }

  /**
   * Formatea el contenido dinámico (precios de habitaciones) de forma sencilla
   * 
   * BUSINESS RULE:
   * - Formato simple: "Tipo de Habitación: $precio por noche"
   * - Muestra solo el precio total, no el desglose por segmentos
   * - Extensible para formatos más complejos en el futuro
   * 
   * @param quoteData Datos de cotización del QuoteEngineService
   * @returns Texto formateado con precios de habitaciones
   */
  private formatDynamicContent(quoteData: QuoteResponseDto): string {
    if (!quoteData.available || quoteData.available.length === 0) {
      return 'No hay habitaciones disponibles para las fechas seleccionadas.'
    }

    const formattedRooms = quoteData.available
      .map((roomTypeQuote: RoomTypeQuoteDto) => {
        const roomName = roomTypeQuote.roomType.name
        
        // Get the BAR rate plan or the first available rate plan
        const ratePlan = roomTypeQuote.ratePlans.find(rp => rp.ratePlan.code === 'BAR') || roomTypeQuote.ratePlans[0]
        
        if (!ratePlan) {
          return `${roomName}: No hay tarifas disponibles`
        }
        
        const totalPrice = ratePlan.totalPrice
        const totalNights = ratePlan.totalNights
        const pricePerNight = totalNights > 0 ? (totalPrice / totalNights).toFixed(2) : totalPrice.toFixed(2)
        
        return `${roomName}: $${pricePerNight} por noche (Total: $${totalPrice.toFixed(2)})`
      })
      .join('\n')

    return `Opciones disponibles del ${quoteData.checkInDate} al ${quoteData.checkOutDate} para ${quoteData.pax} huéspedes:\n\n${formattedRooms}`
  }

  /**
   * Ensambla el texto final combinando bloques estáticos con contenido dinámico
   * 
   * ASSEMBLY LOGIC:
   * - Inserta el contenido dinámico después del bloque con sortOrder <= 5
   * - Mantiene el orden de los bloques según su sortOrder
   * - Agrega saltos de línea entre secciones para legibilidad
   * 
   * @param templateBlocks Bloques de la plantilla ordenados por sortOrder
   * @param dynamicContent Contenido dinámico (precios formateados)
   * @returns Texto completo del presupuesto
   */
  private assembleFormattedQuote(
    templateBlocks: QuoteTemplateBlock[],
    dynamicContent: string
  ): string {
    let formattedText = ''
    let dynamicContentInserted = false

    for (const templateBlock of templateBlocks) {
      // Agregar el contenido del bloque
      formattedText += templateBlock.contentBlock.content + '\n\n'

      // Insertar contenido dinámico después de sortOrder <= 5 (después de saludo/servicios)
      if (!dynamicContentInserted && templateBlock.sortOrder <= 5) {
        formattedText += dynamicContent + '\n\n'
        dynamicContentInserted = true
      }
    }

    // Si no se insertó el contenido dinámico (caso edge), agregarlo al final
    if (!dynamicContentInserted) {
      formattedText += dynamicContent + '\n\n'
    }

    return formattedText.trim()
  }
}