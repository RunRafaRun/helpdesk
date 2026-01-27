import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  

async getMe(agenteId: string) {
  const agente = await this.prisma.agente.findUnique({
    where: { id: agenteId },
    select: { id: true, usuario: true, nombre: true, role: true },
  });
  if (!agente) return null;

  const roles = await this.prisma.agenteRoleAssignment.findMany({
    where: { agenteId },
    include: { role: { include: { permisos: { include: { permission: true } } } } },
  });

  const roleCodigos = roles.map((r) => r.role.codigo);
  const permisos = Array.from(
    new Set(
      roles.flatMap((r) => r.role.permisos.map((rp) => rp.permission.codigo))
    )
  );

  return { 
    id: agente.id, 
    usuario: agente.usuario, 
    nombre: agente.nombre,
    role: agente.role,
    roles: roleCodigos, 
    permisos 
  };
}

async login(usuario: string, password: string) {
    const agente = await this.prisma.agente.findUnique({ where: { usuario } });
    if (!agente) throw new UnauthorizedException("Credenciales inválidas");

    const ok = await bcrypt.compare(password, agente.password);
    if (!ok) throw new UnauthorizedException("Credenciales inválidas");

    const payload = { sub: agente.id, usuario: agente.usuario, role: agente.role };
    const accessToken = await this.jwt.signAsync(payload);
    return { accessToken };
  }
}
