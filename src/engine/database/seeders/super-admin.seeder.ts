import { DataSource } from 'typeorm'
import { User } from '../../auth/entities/user.entity'
import * as bcrypt from 'bcrypt'
import * as readline from 'readline'

/**
 * Seeder para SuperAdmin - Versión mínima para Ruqq
 *
 * PROPÓSITO:
 * Crea un usuario SuperAdmin básico con acceso completo al sistema.
 * Esta es la versión inicial que se puede expandir según las necesidades.
 *
 * CARACTERÍSTICAS DEL SUPER_ADMIN:
 * - Rol 'super-admin' en el array de roles
 * - Usuario de sistema para administración
 * - Credenciales por defecto para desarrollo
 *
 * FUNCIONAMIENTO:
 * 1. Verifica si ya existe el usuario SuperAdmin
 * 2. Si no existe, lo crea con credenciales predeterminadas
 * 3. Hashea la contraseña de forma segura
 * 4. Asigna rol de super-admin
 *
 * SEGURIDAD:
 * - Contraseña hasheada con bcrypt
 * - Solo UNA cuenta con este rol
 * - Cambiar credenciales en producción
 *
 * DEPENDENCIAS:
 * - Entidad User funcional
 * - Módulo bcrypt para hash de contraseña
 *
 * ORDEN DE EJECUCIÓN: 1° (único por ahora)
 */
export class SuperAdminSeeder {
  constructor(private dataSource: DataSource) {}

  /**
   * Solicita contraseña por consola
   * 
   * SEGURIDAD:
   * - No queda guardada en logs o archivos
   * - Valida longitud mínima
   * - Solo se muestra en consola durante el input
   * 
   * @returns Promise<string> Contraseña ingresada
   */
  private async promptPassword(): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    return new Promise((resolve) => {
      console.log('   🔐 Configuración de contraseña para SuperAdmin:')
      console.log('   💡 Mínimo 8 caracteres, se recomienda usar caracteres especiales')
      console.log('   ⚠️  La contraseña será visible durante el tipeo (por compatibilidad)')
      
      rl.question('   Password: ', (password) => {
        console.log('') // Línea en blanco para limpiar
        
        if (password.length < 8) {
          console.log('   ❌ La contraseña debe tener al menos 8 caracteres')
          rl.close()
          process.exit(1)
        }
        
        rl.close()
        resolve(password)
      })
    })
  }

  /**
   * Crea el usuario SuperAdmin si no existe
   *
   * PROCESO:
   * 1. Busca usuario existente por email
   * 2. Si no existe, crea nuevo usuario SuperAdmin
   * 3. Hashea contraseña de forma segura
   * 4. Asigna roles y configuración inicial
   * 5. Muestra credenciales para desarrollo
   *
   * @throws Error si falla la creación del usuario
   */
  async run(): Promise<void> {
    const userRepo = this.dataSource.getRepository(User)

    // Email del SuperAdmin - cambiar en producción
    const superAdminEmail = 'admin@ruqq.com'

    // Verificar si ya existe el SuperAdmin
    const existingUser = await userRepo.findOne({
      where: { email: superAdminEmail },
    })

    if (existingUser) {
      console.log('   ✅ SuperAdmin ya existe, saltando creación...')
      console.log(`   📧 Email: ${existingUser.email}`)
      console.log(`   👤 Nombre: ${existingUser.fullName}`)
      console.log(`   🎭 Roles: ${existingUser.roles.join(', ')}`)
      return
    }

    console.log('   👑 Creando usuario SuperAdmin...')

    // Solicitar contraseña de forma segura por consola
    const password = await this.promptPassword()
    console.log('   ✅ Contraseña ingresada correctamente')
    
    // Generar hash seguro de la contraseña
    console.log('   🔒 Generando hash seguro...')
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear nuevo usuario SuperAdmin
    const superAdmin = userRepo.create({
      email: superAdminEmail,
      password: hashedPassword,
      fullName: 'Super Administrador',
      isActive: true,
      roles: ['super-admin'], // Rol especial para acceso completo
      uid: '00000000-0000-0000-0000-000000000000', // UID del sistema
    })

    // Guardar en base de datos
    await userRepo.save(superAdmin)

    console.log('   ✅ SuperAdmin creado exitosamente')
    console.log(`   📧 Email: ${superAdmin.email}`)
    console.log(`   👤 Nombre: ${superAdmin.fullName}`)
    console.log(`   🎭 Roles: ${superAdmin.roles.join(', ')}`)
    console.log(`   🆔 ID: ${superAdmin.id}`)

    // Mostrar información de login (sin contraseña por seguridad)
    console.log('\n📋 USUARIO SUPERADMIN CREADO:')
    console.log('   ╭─────────────────────────────────╮')
    console.log('   │        SUPER ADMIN              │')
    console.log('   ├─────────────────────────────────┤')
    console.log(`   │ Email: ${superAdminEmail.padEnd(20)} │`)
    console.log('   │ Pass:  [INGRESADA POR CONSOLA]  │')
    console.log('   │ Tipo:  Super Administrador      │')
    console.log('   │                                 │')
    console.log('   │ 🔐 CONTRASEÑA SEGURA            │')
    console.log('   ╰─────────────────────────────────╯')
    console.log('')
  }
}
