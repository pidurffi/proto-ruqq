import { BadRequestException } from '@nestjs/common'

import { DateUtils } from './date.utils'

/**
 * DateUtils es la pieza más silenciosamente peligrosa del sistema: un error de
 * un día no lanza excepción, sólo cobra la tarifa equivocada.
 *
 * El riesgo concreto es la zona horaria. Argentina es GMT-3, así que
 * `new Date('2025-03-02')` se interpreta como UTC medianoche, que en hora local
 * es el 1 de marzo. DateUtils construye las fechas al mediodía para neutralizar
 * eso, y estos tests fijan ese comportamiento.
 */
describe('DateUtils', () => {
  describe('isValidDateString', () => {
    it.each(['2025-01-01', '2024-02-29', '2025-12-31'])('acepta %s', fecha => {
      expect(DateUtils.isValidDateString(fecha)).toBe(true)
    })

    it.each([
      ['formato con barras', '25/09/2025'],
      ['mes inexistente', '2025-13-01'],
      ['día inexistente', '2025-04-31'],
      ['29 de febrero en año no bisiesto', '2025-02-29'],
      ['sin ceros a la izquierda', '2025-1-1'],
      ['con hora', '2025-01-01T00:00:00'],
      ['vacío', ''],
    ])('rechaza %s', (_caso, fecha) => {
      expect(DateUtils.isValidDateString(fecha)).toBe(false)
    })

    it('rechaza valores que no son string', () => {
      expect(DateUtils.isValidDateString(null as unknown as string)).toBe(false)
      expect(DateUtils.isValidDateString(undefined as unknown as string)).toBe(false)
    })
  })

  describe('calculateNights — el check-out es exclusivo', () => {
    it.each([
      ['una noche', '2025-09-25', '2025-09-26', 1],
      ['cinco noches', '2025-09-25', '2025-09-30', 5],
      ['cruzando fin de mes', '2025-09-29', '2025-10-02', 3],
      ['cruzando fin de año', '2025-12-30', '2026-01-02', 3],
      ['año bisiesto sobre el 29 de febrero', '2024-02-28', '2024-03-01', 2],
      ['año no bisiesto sobre el 28 de febrero', '2025-02-27', '2025-03-01', 2],
      ['un año completo', '2025-01-01', '2026-01-01', 365],
    ])('%s', (_caso, checkIn, checkOut, esperado) => {
      expect(DateUtils.calculateNights(checkIn, checkOut)).toBe(esperado)
    })

    it('rechaza check-out anterior al check-in', () => {
      expect(() => DateUtils.calculateNights('2025-09-30', '2025-09-25')).toThrow(BadRequestException)
    })

    it('rechaza check-in igual al check-out: cero noches no es una estadía', () => {
      expect(() => DateUtils.calculateNights('2025-09-25', '2025-09-25')).toThrow(BadRequestException)
    })

    it('rechaza fechas con formato inválido', () => {
      expect(() => DateUtils.calculateNights('25/09/2025', '2025-09-30')).toThrow(BadRequestException)
    })
  })

  describe('addDays', () => {
    it.each([
      ['suma dentro del mes', '2025-09-25', 5, '2025-09-30'],
      ['resta dentro del mes', '2025-09-25', -1, '2025-09-24'],
      ['cruza a fin de mes', '2025-09-30', 1, '2025-10-01'],
      ['cruza hacia atrás a mes anterior', '2025-10-01', -1, '2025-09-30'],
      ['cruza fin de año', '2025-12-31', 1, '2026-01-01'],
      ['entra al 29 de febrero en año bisiesto', '2024-02-28', 1, '2024-02-29'],
      ['saltea el 29 de febrero en año no bisiesto', '2025-02-28', 1, '2025-03-01'],
      ['sumar cero devuelve la misma fecha', '2025-09-25', 0, '2025-09-25'],
    ])('%s', (_caso, fecha, dias, esperado) => {
      expect(DateUtils.addDays(fecha, dias)).toBe(esperado)
    })

    it('mantiene el formato con ceros a la izquierda', () => {
      expect(DateUtils.addDays('2025-01-08', 1)).toBe('2025-01-09')
      expect(DateUtils.addDays('2025-08-31', 1)).toBe('2025-09-01')
    })
  })

  describe('getDateRange — inicio inclusivo, fin exclusivo', () => {
    it('devuelve una fecha por noche', () => {
      expect(DateUtils.getDateRange('2025-09-25', '2025-09-28')).toEqual([
        '2025-09-25',
        '2025-09-26',
        '2025-09-27',
      ])
    })

    it('devuelve un solo día para una noche', () => {
      expect(DateUtils.getDateRange('2025-09-25', '2025-09-26')).toEqual(['2025-09-25'])
    })

    it('devuelve vacío si el inicio no es anterior al fin', () => {
      expect(DateUtils.getDateRange('2025-09-25', '2025-09-25')).toEqual([])
      expect(DateUtils.getDateRange('2025-09-26', '2025-09-25')).toEqual([])
    })

    it('cruza el cambio de año sin perder días', () => {
      expect(DateUtils.getDateRange('2025-12-30', '2026-01-02')).toEqual([
        '2025-12-30',
        '2025-12-31',
        '2026-01-01',
      ])
    })

    it('coincide en cantidad con calculateNights', () => {
      const checkIn = '2025-07-15'
      const checkOut = '2025-08-03'

      expect(DateUtils.getDateRange(checkIn, checkOut)).toHaveLength(
        DateUtils.calculateNights(checkIn, checkOut),
      )
    })
  })

  describe('compareDateStrings', () => {
    it.each([
      ['anterior', '2025-09-25', '2025-09-26', -1],
      ['iguales', '2025-09-25', '2025-09-25', 0],
      ['posterior', '2025-09-26', '2025-09-25', 1],
      ['cruzando el año', '2025-12-31', '2026-01-01', -1],
    ])('%s', (_caso, a, b, esperado) => {
      expect(DateUtils.compareDateStrings(a, b)).toBe(esperado)
    })

    it('rechaza fechas inválidas', () => {
      expect(() => DateUtils.compareDateStrings('2025-13-01', '2025-09-25')).toThrow(BadRequestException)
    })
  })

  describe('getTodayAsString', () => {
    it('devuelve la fecha local, no la UTC', () => {
      // El caso que motivó el diseño: a las 22:00 en Argentina (GMT-3) ya es el
      // día siguiente en UTC. La fecha de negocio tiene que ser la local.
      const hoy = DateUtils.getTodayAsString()
      const ahora = new Date()
      const esperado = [
        ahora.getFullYear(),
        String(ahora.getMonth() + 1).padStart(2, '0'),
        String(ahora.getDate()).padStart(2, '0'),
      ].join('-')

      expect(hoy).toBe(esperado)
      expect(DateUtils.isValidDateString(hoy)).toBe(true)
    })
  })

  describe('validateDateRange', () => {
    const hoy = DateUtils.getTodayAsString()
    const manana = DateUtils.addDays(hoy, 1)

    it('acepta una estadía futura válida', () => {
      expect(() => DateUtils.validateDateRange(manana, DateUtils.addDays(manana, 3))).not.toThrow()
    })

    it('acepta hoy como check-in por defecto', () => {
      expect(() => DateUtils.validateDateRange(hoy, manana)).not.toThrow()
    })

    it('rechaza hoy si allowToday es false', () => {
      expect(() => DateUtils.validateDateRange(hoy, manana, { allowToday: false })).toThrow(
        BadRequestException,
      )
    })

    it('rechaza check-in en el pasado', () => {
      const ayer = DateUtils.addDays(hoy, -1)

      expect(() => DateUtils.validateDateRange(ayer, manana)).toThrow(BadRequestException)
    })

    it('rechaza estadías por debajo del mínimo de noches', () => {
      expect(() =>
        DateUtils.validateDateRange(manana, DateUtils.addDays(manana, 1), { minNights: 2 }),
      ).toThrow(BadRequestException)
    })

    it('rechaza estadías por encima del máximo de noches', () => {
      expect(() =>
        DateUtils.validateDateRange(manana, DateUtils.addDays(manana, 366)),
      ).toThrow(BadRequestException)
    })

    it('acepta exactamente el máximo de noches', () => {
      expect(() =>
        DateUtils.validateDateRange(manana, DateUtils.addDays(manana, 365)),
      ).not.toThrow()
    })
  })

  describe('formatForDisplay', () => {
    it.each([
      ['2025-09-25', '25/09'],
      ['2025-12-01', '01/12'],
      ['2025-01-09', '09/01'],
    ])('formatea %s como %s', (fecha, esperado) => {
      expect(DateUtils.formatForDisplay(fecha)).toBe(esperado)
    })

    it('rechaza fechas inválidas', () => {
      expect(() => DateUtils.formatForDisplay('25/09/2025')).toThrow(BadRequestException)
    })
  })

  describe('estabilidad frente a zonas horarias', () => {
    // Las fechas se construyen al mediodía justamente para que ningún offset
    // ni cambio de horario mueva el día. Estos casos son los que fallaban con
    // la implementación anterior, que usaba UTC medianoche.
    it.each([
      '2025-01-01',
      '2025-03-02',
      '2025-06-15',
      '2025-10-19',
      '2025-11-02',
      '2025-12-31',
    ])('addDays con ida y vuelta devuelve la fecha original: %s', fecha => {
      expect(DateUtils.addDays(DateUtils.addDays(fecha, 1), -1)).toBe(fecha)
    })

    it('sumar días de a uno equivale a sumarlos de una vez', () => {
      let acumulado = '2025-02-25'
      for (let i = 0; i < 10; i++) {
        acumulado = DateUtils.addDays(acumulado, 1)
      }

      expect(acumulado).toBe(DateUtils.addDays('2025-02-25', 10))
      expect(acumulado).toBe('2025-03-07')
    })
  })
})
