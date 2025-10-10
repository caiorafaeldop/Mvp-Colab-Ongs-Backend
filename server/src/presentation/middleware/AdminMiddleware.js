/**
 * CHAIN OF RESPONSIBILITY PATTERN - Admin Middleware
 * Middleware para verificar se o usuário é um administrador
 * Só permite acesso a endpoints administrativos
 */

const adminMiddleware = () => {
  return (req, res, next) => {
    try {
      console.log('=== [ADMIN MIDDLEWARE] VERIFICAÇÃO DE ADMIN ===');
      console.log('[ADMIN MIDDLEWARE] URL:', req.url);
      console.log('[ADMIN MIDDLEWARE] Method:', req.method);
      console.log('[ADMIN MIDDLEWARE] User completo:', JSON.stringify(req.user, null, 2));

      // Verifica se o usuário está autenticado
      if (!req.user) {
        console.error('[ADMIN MIDDLEWARE] ❌ Usuário não autenticado (req.user vazio)');
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      console.log('[ADMIN MIDDLEWARE] ✓ Usuário autenticado');
      console.log('[ADMIN MIDDLEWARE] User ID:', req.user.id || req.user.userId);
      console.log('[ADMIN MIDDLEWARE] User Type:', req.user.userType);
      console.log('[ADMIN MIDDLEWARE] User Email:', req.user.email);

      // Verifica se o usuário é admin
      if (req.user.userType !== 'admin') {
        console.error('[ADMIN MIDDLEWARE] ❌ Acesso negado - não é admin');
        console.error('[ADMIN MIDDLEWARE] userType atual:', req.user.userType);
        console.error('[ADMIN MIDDLEWARE] userType esperado: admin');
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.',
        });
      }

      console.log('[ADMIN MIDDLEWARE] ✓✓✓ Acesso admin autorizado!');
      console.log('=== [ADMIN MIDDLEWARE] FIM DA VERIFICAÇÃO (SUCESSO) ===');
      next(); // CHAIN OF RESPONSIBILITY: Continua a cadeia se autorizado
    } catch (error) {
      console.error('=== [ADMIN MIDDLEWARE] ERRO NA VERIFICAÇÃO ===');
      console.error('[ADMIN MIDDLEWARE] Tipo do erro:', error.constructor.name);
      console.error('[ADMIN MIDDLEWARE] Mensagem:', error.message);
      console.error('[ADMIN MIDDLEWARE] Stack:', error.stack);
      console.error('=== [ADMIN MIDDLEWARE] FIM DO ERRO ===');
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};

module.exports = {
  adminMiddleware,
};
