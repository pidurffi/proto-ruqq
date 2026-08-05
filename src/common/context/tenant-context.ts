import { AsyncLocalStorage } from 'node:async_hooks';

import { ITenantContext } from '../interfaces/tenant.interface';

/**
 * Almacenamiento del contexto de tenant, aislado por request.
 *
 * POR QUÉ AsyncLocalStorage Y NO UN CAMPO DE INSTANCIA:
 *
 * `TenantService` es un provider singleton: existe una sola instancia para toda
 * la aplicación. Guardar el tenant activo en un campo de esa instancia significa
 * que todas las requests comparten la misma variable, y Node.js las atiende de
 * forma concurrente sobre el mismo event loop:
 *
 *   t0  Request A (hotelA) escribe el contexto
 *   t1  Request A hace await de una consulta
 *   t2  Request B (hotelB) escribe el contexto  ← pisa el de A
 *   t3  Request A reanuda y lee hotelB          ← consulta el schema equivocado
 *
 * En un sistema multi-tenant eso es una fuga de datos entre clientes.
 *
 * AsyncLocalStorage mantiene un store propio por cadena de ejecución asincrónica:
 * todo lo que ocurra dentro del `run()` —incluidos los `await` encadenados— ve su
 * propio contexto, sin importar cuántas requests haya en vuelo al mismo tiempo.
 *
 * Se usa `run()` y no `enterWith()` de forma deliberada: `run()` acota el
 * contexto al callback y lo libera solo cuando la cadena termina, sin necesidad
 * de limpieza manual.
 */
export const tenantStorage = new AsyncLocalStorage<ITenantContext>();
