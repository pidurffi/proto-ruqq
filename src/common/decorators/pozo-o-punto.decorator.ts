/*
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator'

export function IsPozoOrPtoMuestreo(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsPozoOrPtoMuestreo',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const { pozo_id, pto_muestreo_id } = args.object
          // Si ambos son nulos o ambos tienen valor, retorna falso
          if ((pozo_id && pto_muestreo_id) || (!pozo_id && !pto_muestreo_id)) {
            return false
          }
          // Si solo uno tiene valor, retorna verdadero
          return true
        },
        defaultMessage(args: ValidationArguments) {
          return 'Debe proporcionar pozo_id o pto_muestreo_id, pero no ambos ni ninguno.'
        },
      },
    })
  }
}
*/
