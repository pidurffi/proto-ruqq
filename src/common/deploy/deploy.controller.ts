// deploy-controller.ts
import { Controller, Post, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { exec } from 'child_process'
import { promisify } from 'util'
import { AuthGuard } from '@nestjs/passport'
import { ConfigService } from '@nestjs/config'

import { RoleProtected } from '../../engine/auth/decorators/role-protected.decorator'
import { ValidRoles } from '../../engine/auth/interfaces/valid-roles'
import { UserRoleGuard } from '../../engine/auth/guards/user-role.guard'
const execAsync = promisify(exec)

@ApiTags('Deploy')
@Controller('/deploy')
@RoleProtected(ValidRoles.SUPER_ADMIN)
@UseGuards(AuthGuard(), UserRoleGuard)
export class DeployController {
  constructor(private readonly configService: ConfigService) {}

  @Post('build-frontend')
  async buildFrontend() {
    const distPath = this.configService.get<string>('DIST_PATH')
    const frontendPath = this.configService.get<string>('FRONTEND_PATH')
    const nvmDir = '/home/ubuntu/.nvm'
    const nodeVersion = 'v22.0.0'

    console.log('distPath', distPath)
    console.log('frontendPath', frontendPath)

    try {
      // Borrar la carpeta dist
      await execAsync(`rm -rf ${distPath}`)

      // Preparar el comando de build con la configuración del entorno
      const buildCommand = `
      export NVM_DIR="${nvmDir}" &&
      . $NVM_DIR/nvm.sh &&
      export PATH="${nvmDir}/versions/node/${nodeVersion}/bin:$PATH" &&
      cd ${frontendPath} &&
      npm run build
    `

      // Ejecutar el comando de build
      const { stdout, stderr } = await execAsync(buildCommand, {
        shell: '/bin/bash',
        env: {
          ...process.env,
          NVM_DIR: nvmDir,
          PATH: `${nvmDir}/versions/node/${nodeVersion}/bin:${process.env.PATH}`,
        },
      })

      console.log('Build output:', stdout)
      if (stderr) console.log('Build errors:', stderr)

      return { message: 'Frontend built successfully' }
    } catch (error) {
      console.log('Build error:', error)
      return {
        message: 'Error during build',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: error as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stdout: (error as any).stdout,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stderr: (error as any).stderr,
      }
    }
  }
}
