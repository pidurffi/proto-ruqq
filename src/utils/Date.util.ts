import { HttpException } from '@nestjs/common'
import { Request } from 'express'

export class DateUtils {
  static format(date: Date | string | number) {
    const userTimezoneOffset = new Date(date).getTimezoneOffset() * 60000
    const noOffset = new Date(date).getTime() - userTimezoneOffset
    return new Date(noOffset).toISOString().replace(/T/, ' ').replace(/\..+/, '')
  }

  static formatToDate(date: Date | string | number) {
    const userTimezoneOffset = new Date(date).getTimezoneOffset() * 60000
    const noOffset = new Date(date).getTime() - userTimezoneOffset
    return new Date(noOffset).toISOString().split('T')[0]
  }

  static utcDate(date: Date) {
    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
    )
  }

  static diffDays(startDate: Date, endDate: Date) {
    const diff = endDate.getTime() - startDate.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    return days
  }

  static diffWeeks(startDate: Date, endDate: Date) {
    const diff = endDate.getTime() - startDate.getTime()
    if (diff < 0) throw new HttpException('The endDate must be greater than the startDate.', 500)
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days > 7) return days / 7
    return 1
  }

  /**
   * numberActualWeekDay must be greater than numberNextWeekDay
   *
   * @param actualDate
   * @param numberActualWeekDay
   * @param numberNextWeekDay
   * @returns Next weekday requested.
   */
  static nextDayFromNumberDayOffWeek(actualDate: Date, numberActualWeekDay: number, numberNextWeekDay: number) {
    const date = new Date(actualDate)
    if (numberActualWeekDay > numberNextWeekDay)
      date.setDate(date.getDate() + 7 - (numberActualWeekDay - numberNextWeekDay))
    else {
      date.setDate(date.getDate() + (numberNextWeekDay - numberActualWeekDay))
    }
    return date
  }

  static validateUTCFormat(dateString: string) {
    return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(dateString)
  }

  static getHoursBetweenDates(fromDate: Date, toDate: Date) {
    return Math.floor((toDate.getTime() - fromDate.getTime()) / 3600000)
  }

  static getFullMonth(month: number) {
    return month < 10 ? `0${month}` : month
  }

  /**
   * Receive number like minute, month or hour, and return with 0 if less than 10
   * @param month
   */
  static getFullNumber(month: number) {
    return month < 10 ? `0${month}` : month
  }

  /**
   * @deprecated This function is deprecated. Get offset from general config or by user in session
   * @param req Request
   */
  static getUTCOffsetFromRequestInHours(req: Request) {
    const offset = req.headers && req.headers['utc-offset'] ? +req.headers['utc-offset'] : 0
    return -offset / 60
  }

  static normalizeDate(value: Date | string | number) {
    const date = new Date(value)
    const hour = date.getUTCHours()
    const minutes = date.getUTCMinutes()
    const seconds = date.getUTCSeconds() !== 59 ? 0 : date.getUTCSeconds()
    const milliseconds = date.getUTCMilliseconds() !== 999 ? 0 : date.getUTCMilliseconds()
    const normalizedDate = date.setUTCHours(hour, minutes, seconds, milliseconds)
    return new Date(normalizedDate)
  }

  static formatToString(fecha: Date): string {
    const año = fecha.getFullYear()
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0')
    const dia = fecha.getDate().toString().padStart(2, '0')
    return `${año}-${mes}-${dia}`
  }
}
