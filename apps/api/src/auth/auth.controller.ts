import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "./guards";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  
  constructor(private readonly authService: AuthService) {}
@Get("me")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
async me(@Req() req: any) {
  const m = await this.authService.getMe(req.user?.sub);
  return { usuario: req.user?.usuario, ...m };
}


  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.usuario, dto.password);
  }
}
