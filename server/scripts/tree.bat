@echo off
echo Estrutura do Projeto (sem node_modules)
echo =====================================
echo.

:: Gerar tree excluindo node_modules e outras pastas
for /f "delims=" %%i in ('dir /b /ad ^| findstr /v /i "node_modules .git dist build coverage"') do (
    echo [PASTA] %%i
    tree "%%i" /F /A | findstr /v /i "node_modules .git dist build coverage"
    echo.
)

:: Mostrar arquivos na raiz
echo [ARQUIVOS RAIZ]
dir /b /a-d

echo.
echo =====================================
echo Tree gerado com sucesso!
