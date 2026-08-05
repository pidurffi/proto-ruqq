import { ConfigService } from '@nestjs/config'

import { TenantService } from './tenant.service'
import { ITenantContext } from '../interfaces/tenant.interface'

/**
 * Aislamiento del contexto de tenant.
 *
 * Estos tests existen por un bug real: `TenantService` es un provider singleton
 * y guardaba el tenant activo en un campo mutable de instancia. Dos requests
 * concurrentes de hoteles distintos se pisaban el contexto entre sí, y una
 * terminaba consultando el schema de la otra.
 *
 * El test central es `mantiene el contexto aislado entre ejecuciones
 * concurrentes`: reproduce esa condición de carrera. Si alguien vuelve a
 * introducir estado compartido en el servicio, ese test falla.
 */
describe('TenantService — aislamiento de contexto', () => {
  let service: TenantService

  const config = {
    get: (clave: string, porDefecto: string) => porDefecto,
  } as unknown as ConfigService

  const contexto = (tenantId: string): ITenantContext => ({
    tenantId,
    schema: tenantId === 'default' ? 'public' : `tenant_${tenantId}`,
  })

  beforeEach(() => {
    service = new TenantService(config)
  })

  describe('fuera de una request', () => {
    it('no hay tenant actual', () => {
      expect(service.getCurrentTenant()).toBeNull()
    })

    it('el tenant activo cae al de por defecto', () => {
      expect(service.getActiveTenant()).toEqual({ tenantId: 'default', schema: 'public' })
    })
  })

  describe('dentro de runWithTenant', () => {
    it('expone el tenant de la ejecución en curso', () => {
      service.runWithTenant(contexto('cliente1'), () => {
        expect(service.getActiveTenant().schema).toBe('tenant_cliente1')
      })
    })

    it('devuelve el valor del callback', () => {
      const resultado = service.runWithTenant(contexto('cliente1'), () => 42)

      expect(resultado).toBe(42)
    })

    it('libera el contexto al terminar, sin limpieza manual', () => {
      service.runWithTenant(contexto('cliente1'), () => undefined)

      expect(service.getCurrentTenant()).toBeNull()
    })

    it('propaga el contexto a través de la cadena de await', async () => {
      await service.runWithTenant(contexto('cliente1'), async () => {
        await new Promise(resolve => setTimeout(resolve, 10))

        // El contexto sobrevive al await: es lo que un repositorio necesita,
        // porque lee el tenant recién al ejecutar la consulta.
        expect(service.getActiveTenant().schema).toBe('tenant_cliente1')
      })
    })

    it('anida contextos sin filtrar el interno hacia afuera', () => {
      service.runWithTenant(contexto('cliente1'), () => {
        service.runWithTenant(contexto('cliente2'), () => {
          expect(service.getActiveTenant().schema).toBe('tenant_cliente2')
        })

        expect(service.getActiveTenant().schema).toBe('tenant_cliente1')
      })
    })
  })

  describe('concurrencia — la regresión que motivó el fix', () => {
    it('mantiene el contexto aislado entre ejecuciones concurrentes', async () => {
      // Simula el pipeline de una request: lee el tenant, espera la base de
      // datos, y vuelve a leerlo al momento de ejecutar la consulta.
      const request = async (tenantId: string, esperaMs: number) => {
        return service.runWithTenant(contexto(tenantId), async () => {
          const alEntrar = service.getActiveTenant().schema

          await new Promise(resolve => setTimeout(resolve, esperaMs))

          const alConsultar = service.getActiveTenant().schema

          return { alEntrar, alConsultar }
        })
      }

      // La request lenta arranca primero; la rápida la atraviesa por completo.
      // Con estado compartido en el servicio, la lenta despertaba viendo el
      // tenant de la rápida.
      const [lenta, rapida] = await Promise.all([
        request('hotelA', 50),
        request('hotelB', 5),
      ])

      expect(lenta).toEqual({ alEntrar: 'tenant_hotelA', alConsultar: 'tenant_hotelA' })
      expect(rapida).toEqual({ alEntrar: 'tenant_hotelB', alConsultar: 'tenant_hotelB' })
    })

    it('resiste muchas requests entrelazadas', async () => {
      const request = async (indice: number) => {
        const tenantId = `hotel${indice}`

        return service.runWithTenant(contexto(tenantId), async () => {
          // Esperas descendentes: cada request termina en orden inverso al de
          // arranque, maximizando el entrelazado.
          await new Promise(resolve => setTimeout(resolve, (20 - indice) * 2))

          return service.getActiveTenant().schema
        })
      }

      const indices = Array.from({ length: 20 }, (_, i) => i)
      const schemas = await Promise.all(indices.map(request))

      expect(schemas).toEqual(indices.map(i => `tenant_hotel${i}`))
    })

    it('una request que falla no contamina a las demás', async () => {
      const fallida = service.runWithTenant(contexto('hotelA'), async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        throw new Error('consulta fallida')
      })

      const exitosa = service.runWithTenant(contexto('hotelB'), async () => {
        await new Promise(resolve => setTimeout(resolve, 20))
        return service.getActiveTenant().schema
      })

      await expect(fallida).rejects.toThrow('consulta fallida')
      await expect(exitosa).resolves.toBe('tenant_hotelB')
      expect(service.getCurrentTenant()).toBeNull()
    })
  })

  describe('resolución de schema', () => {
    it('agrega el prefijo tenant_ cuando falta', () => {
      expect(service.tenantToSchema('cliente1')).toBe('tenant_cliente1')
    })

    it('no duplica el prefijo si ya está', () => {
      expect(service.tenantToSchema('tenant_cliente1')).toBe('tenant_cliente1')
    })

    it('mapea el tenant por defecto al schema public', () => {
      expect(service.tenantToSchema('default')).toBe('public')
    })
  })

  describe('validación de tenant id', () => {
    it.each([
      ['vacío', ''],
      ['con espacios', 'cliente 1'],
      ['con punto y coma', 'cliente1; DROP TABLE users'],
      ['con barra', 'cliente1/../public'],
    ])('rechaza un id %s', (_caso, valor) => {
      expect(service.validateTenantId(valor).valid).toBe(false)
    })

    it('acepta letras, números, guiones y guiones bajos', () => {
      expect(service.validateTenantId('tenant_cliente-1').valid).toBe(true)
    })

    it('rechaza ids de más de 50 caracteres', () => {
      expect(service.validateTenantId('a'.repeat(51)).valid).toBe(false)
    })
  })
})
