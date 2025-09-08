/**
 * Seeder para Datos Iniciales - Room Types y Tarifas Diarias
 *
 * PROPÓSITO:
 * Crea los datos iniciales completos del hotel:
 * 1. Tipos de habitaciones con inventario y capacidad
 * 2. Tarifas diarias para cada room type desde hoy hasta 30/04/2026
 *
 * FUNCIONAMIENTO:
 * 1. Verifica qué room types ya existen (por código)
 * 2. Crea solo los que no existen
 * 3. Genera tarifas diarias para todo el período
 * 4. Es idempotente (puede ejecutarse múltiples veces)
 *
 * ROOM TYPES CREADOS:
 * - Luxury (LUX): 3 habitaciones, 2-6 personas, $500/noche
 * - Premium (PRE): 6 habitaciones, 2-6 personas, $400/noche
 * - Superior (SUP): 3 habitaciones, 2-5 personas, $300/noche
 * - Estudio Loft (EST): 3 habitaciones, 2-2 personas, $200/noche
 * - Suite (SUI): 1 habitación, 2-2 personas, $100/noche
 *
 * PERÍODO DE TARIFAS: Desde hoy hasta 30/04/2026
 *
 * DEPENDENCIAS:
 * - Entidad RoomType funcional
 * - Entidad DailyRoomRate funcional
 * - Sistema multi-tenant activo
 *
 * ORDEN DE EJECUCIÓN: 3° (después de SuperAdmin y Tenants)
 */

import { DataSource } from 'typeorm'
import { RoomType } from '../../../resources/room-type/entities/room-type.entity'
import { DailyRoomRate } from '../../../resources/daily-room-rates/entities/daily-room-rate.entity'
import { User } from '../../auth/entities/user.entity'

interface RoomTypeData {
  name: string
  code: string
  totalInventory: number
  baseCapacity: number
  maxCapacity: number
  basePrice: number
}

export class InitialDataSeeder {
  constructor(private dataSource: DataSource) {}

  /**
   * Datos iniciales de room types con precios base
   * 
   * Formato: [name, code, totalInventory, baseCapacity, maxCapacity, basePrice]
   */
  private readonly roomTypesData: RoomTypeData[] = [
    {
      name: 'Luxury',
      code: 'LUX',
      totalInventory: 3,
      baseCapacity: 2,
      maxCapacity: 6,
      basePrice: 500
    },
    {
      name: 'Premium',
      code: 'PRE',
      totalInventory: 6,
      baseCapacity: 2,
      maxCapacity: 6,
      basePrice: 400
    },
    {
      name: 'Superior',
      code: 'SUP',
      totalInventory: 3,
      baseCapacity: 2,
      maxCapacity: 5,
      basePrice: 300
    },
    {
      name: 'Estudio Loft',
      code: 'EST',
      totalInventory: 3,
      baseCapacity: 2,
      maxCapacity: 2,
      basePrice: 200
    },
    {
      name: 'Suite',
      code: 'SUI',
      totalInventory: 1,
      baseCapacity: 2,
      maxCapacity: 2,
      basePrice: 100
    }
  ]

  /**
   * Verifica si un room type ya existe por código
   * 
   * @param roomTypeRepo Repositorio de RoomType
   * @param code Código del room type
   * @returns Promise<boolean>
   */
  private async roomTypeExists(roomTypeRepo: any, code: string): Promise<boolean> {
    const existing = await roomTypeRepo.findOne({ where: { code } })
    return !!existing
  }

  /**
   * Crea un room type si no existe
   * 
   * @param roomTypeRepo Repositorio de RoomType
   * @param roomTypeData Datos del room type
   * @param superAdminUid UID del SuperAdmin para auditoría
   * @returns Promise<RoomType | null> El room type creado o null si ya existía
   */
  private async createRoomTypeIfNotExists(roomTypeRepo: any, roomTypeData: RoomTypeData, superAdminUid: string): Promise<any | null> {
    const exists = await this.roomTypeExists(roomTypeRepo, roomTypeData.code)
    
    if (exists) {
      console.log(`   ✅ Room Type '${roomTypeData.code}' (${roomTypeData.name}) ya existe`)
      return await roomTypeRepo.findOne({ where: { code: roomTypeData.code } })
    }

    try {
      const roomType = roomTypeRepo.create({
        name: roomTypeData.name,
        code: roomTypeData.code,
        totalInventory: roomTypeData.totalInventory,
        baseCapacity: roomTypeData.baseCapacity,
        maxCapacity: roomTypeData.maxCapacity,
        uid: superAdminUid,
      })

      const savedRoomType = await roomTypeRepo.save(roomType)
      console.log(`   ✅ Room Type '${roomTypeData.code}' (${roomTypeData.name}) creado - Inventario: ${roomTypeData.totalInventory}, Capacidad: ${roomTypeData.baseCapacity}-${roomTypeData.maxCapacity}, Precio: $${roomTypeData.basePrice}`)
      return savedRoomType
    } catch (error) {
      console.error(`   ❌ Error creando room type '${roomTypeData.code}':`, error)
      throw error
    }
  }

  /**
   * Genera fechas desde hoy hasta la fecha final
   * 
   * @param startDate Fecha de inicio
   * @param endDate Fecha de fin
   * @returns Array de fechas como strings
   */
  private generateDateRange(startDate: Date, endDate: Date): string[] {
    const dates: string[] = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
  }

  /**
   * Crea tarifas diarias para un room type
   * 
   * @param dailyRateRepo Repositorio de DailyRoomRate
   * @param roomType Room Type para el que crear tarifas
   * @param basePrice Precio base por noche
   * @param superAdminUid UID del SuperAdmin para auditoría
   * @param startDate Fecha de inicio
   * @param endDate Fecha de fin
   */
  private async createDailyRatesForRoomType(
    dailyRateRepo: any,
    roomType: any,
    basePrice: number,
    superAdminUid: string,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    console.log(`   💰 Creando tarifas para ${roomType.code} ($${basePrice}/noche)...`)

    const dates = this.generateDateRange(startDate, endDate)
    let createdCount = 0
    let existingCount = 0

    for (const dateString of dates) {
      // Verificar si ya existe tarifa para esta fecha y room type
      const existingRate = await dailyRateRepo.findOne({
        where: {
          roomType: { id: roomType.id },
          date: new Date(dateString)
        }
      })

      if (existingRate) {
        existingCount++
        continue
      }

      try {
        const dailyRate = dailyRateRepo.create({
          date: new Date(dateString),
          baseRate: basePrice,
          roomType: roomType,
          uid: superAdminUid,
        })

        await dailyRateRepo.save(dailyRate)
        createdCount++
      } catch (error) {
        console.error(`   ❌ Error creando tarifa para ${roomType.code} en ${dateString}:`, error)
        throw error
      }
    }

    console.log(`   ✅ ${roomType.code}: ${createdCount} tarifas creadas, ${existingCount} ya existían`)
  }

  /**
   * Ejecuta la creación de datos iniciales completos
   * 
   * DATOS CREADOS:
   * 1. Room Types con inventario y capacidad
   * 2. Tarifas diarias para cada room type desde hoy hasta 30/04/2026
   */
  async run(): Promise<void> {
    console.log('   🏨 Configurando datos iniciales del hotel...\n')

    try {
      const roomTypeRepo = this.dataSource.getRepository(RoomType)
      const dailyRateRepo = this.dataSource.getRepository(DailyRoomRate)
      const userRepo = this.dataSource.getRepository(User)

      // Obtener SuperAdmin para auditoría (uid)
      const superAdmin = await userRepo.findOne({ where: { email: 'admin@ruqq.com' } })
      if (!superAdmin) {
        console.error('   ❌ SuperAdmin no encontrado. Ejecutar seeder de SuperAdmin primero.')
        throw new Error('SuperAdmin requerido para crear datos iniciales')
      }

      console.log(`   👤 Usando SuperAdmin (${superAdmin.email}) para auditoría`)

      // PASO 1: CREAR ROOM TYPES
      console.log('   📋 PASO 1: Creando tipos de habitaciones...\n')

      const existingRoomTypes = await roomTypeRepo.find()
      console.log(`   📊 Room types existentes: ${existingRoomTypes.length}`)
      if (existingRoomTypes.length > 0) {
        existingRoomTypes.forEach(rt => {
          console.log(`   📍 ${rt.code} - ${rt.name} (${rt.totalInventory} unidades)`)
        })
        console.log('')
      }

      // Crear room types y mantener referencia para tarifas
      const roomTypesForRates: Array<{ roomType: any, basePrice: number }> = []
      for (const roomTypeData of this.roomTypesData) {
        const roomType = await this.createRoomTypeIfNotExists(roomTypeRepo, roomTypeData, superAdmin.id)
        if (roomType) {
          roomTypesForRates.push({ roomType, basePrice: roomTypeData.basePrice })
        }
      }

      // PASO 2: CREAR TARIFAS DIARIAS
      console.log('\n   📋 PASO 2: Creando tarifas diarias...\n')

      // Definir período de tarifas: desde hoy hasta 30/04/2026
      const startDate = new Date()
      const endDate = new Date('2026-04-30')
      
      console.log(`   📅 Período de tarifas: ${startDate.toISOString().split('T')[0]} hasta ${endDate.toISOString().split('T')[0]}`)
      
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      console.log(`   📊 Total de días: ${totalDays}`)
      console.log('')

      // Obtener todos los room types (existentes + recién creados)
      const allRoomTypes = await roomTypeRepo.find({ order: { code: 'ASC' } })
      
      for (const roomTypeData of this.roomTypesData) {
        const roomType = allRoomTypes.find(rt => rt.code === roomTypeData.code)
        if (roomType) {
          await this.createDailyRatesForRoomType(
            dailyRateRepo,
            roomType,
            roomTypeData.basePrice,
            superAdmin.id,
            startDate,
            endDate
          )
        }
      }

      // MOSTRAR RESUMEN FINAL
      console.log('\n   📋 RESUMEN FINAL:\n')
      
      const finalRoomTypes = await roomTypeRepo.find({ order: { code: 'ASC' } })
      console.log(`   ✅ Total de room types: ${finalRoomTypes.length}`)
      
      console.log('\n📋 CONFIGURACIÓN COMPLETA:')
      console.log('   ╭─────────────────────────────────────────────────────╮')
      console.log('   │            HOTEL DATOS INICIALES                    │')
      console.log('   ├─────────────────────────────────────────────────────┤')
      
      let totalInventory = 0
      for (const roomType of finalRoomTypes) {
        const priceData = this.roomTypesData.find(rt => rt.code === roomType.code)
        const price = priceData ? `$${priceData.basePrice}` : 'N/A'
        const inventoryInfo = `${roomType.totalInventory} unid.`
        const capacityInfo = `${roomType.baseCapacity}-${roomType.maxCapacity} pax`
        
        console.log(`   │ ${roomType.code.padEnd(3)} │ ${roomType.name.padEnd(15)} │ ${inventoryInfo.padEnd(7)} │ ${capacityInfo.padEnd(7)} │ ${price.padEnd(4)} │`)
        totalInventory += roomType.totalInventory
      }
      
      console.log('   │                                                     │')
      console.log(`   │ 📊 Total: ${totalInventory} habitaciones disponibles                │`)
      console.log(`   │ 📅 Tarifas: hasta 30/04/2026 (${totalDays} días)            │`)
      console.log('   │ 💡 Sistema listo para cotizaciones                  │')
      console.log('   ╰─────────────────────────────────────────────────────╯')
      console.log('')

    } catch (error) {
      console.error('❌ Error configurando datos iniciales:', error)
      console.error('💡 Tip: Verificar que las migraciones estén ejecutadas')
      throw error
    }
  }
}