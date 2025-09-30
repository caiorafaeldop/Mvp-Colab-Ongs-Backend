// CHAIN OF RESPONSIBILITY PATTERN: Este middleware implementa o padrão
// Cada middleware é um handler na cadeia de responsabilidade
// Se a validação passa, chama next() para o próximo handler na cadeia
const authMiddleware = (authService) => {
  return async (req, res, next) => {
    console.log('[AUTH MIDDLEWARE] Headers Authorization:', req.headers.authorization);
    console.log(
      '[AUTH MIDDLEWARE] JWT_SECRET usado:',
      process.env.JWT_SECRET ? 'DEFINIDO' : 'UNDEFINED'
    );
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('[AUTH MIDDLEWARE] Token ausente ou formato inválido');
        return res.status(401).json({
          success: false,
          message: 'Access token required',
        });
      }

      const token = authHeader.split(' ')[1];
      console.log('[AUTH MIDDLEWARE] Token extraído:', token);
      console.log('[AUTH MIDDLEWARE] Tamanho do token:', token ? token.length : 0);

      if (!token) {
        console.log('[AUTH MIDDLEWARE] Token vazio após extração');
        return res.status(401).json({
          success: false,
          message: 'Access token required',
        });
      }

      console.log('[AUTH MIDDLEWARE] Tentando verificar token com authService.verifyToken');
      const decoded = await authService.verifyToken(token);
      console.log('[AUTH MIDDLEWARE] Token decodificado com sucesso:', decoded);
      req.user = decoded;
      next(); // CHAIN OF RESPONSIBILITY: Passa para o próximo handler na cadeia
    } catch (error) {
      console.error('[AUTH MIDDLEWARE] Erro detalhado na verificação do token:');
      console.error('[AUTH MIDDLEWARE] Erro message:', error.message);
      console.error('[AUTH MIDDLEWARE] Erro stack:', error.stack);
      console.error(
        '[AUTH MIDDLEWARE] JWT_SECRET disponível:',
        process.env.JWT_SECRET ? 'SIM' : 'NÃO'
      );
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  };
};

// CHAIN OF RESPONSIBILITY PATTERN: Segundo handler na cadeia de autorização
// Este middleware só executa se o authMiddleware passou a requisição adiante
const organizationMiddleware = () => {
  return (req, res, next) => {
    if (req.user.userType !== 'organization') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only organizations can perform this action.',
      });
    }
    next(); // CHAIN OF RESPONSIBILITY: Continua a cadeia se autorizado
  };
};

module.exports = {
  authMiddleware,
  organizationMiddleware,
};
