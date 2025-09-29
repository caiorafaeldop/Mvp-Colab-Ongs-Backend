# Script para gerar tree do projeto
$excludeDirs = @("node_modules", ".git", "dist", "build", ".next", "coverage")

function Show-Tree($path = ".", $prefix = "") {
    $items = Get-ChildItem -Path $path | Where-Object { 
        if ($_.PSIsContainer) {
            $_.Name -notin $excludeDirs
        } else {
            $true
        }
    } | Sort-Object PSIsContainer, Name
    
    for ($i = 0; $i -lt $items.Count; $i++) {
        $item = $items[$i]
        $isLast = ($i -eq ($items.Count - 1))
        
        if ($isLast) {
            Write-Host "$prefix└── $($item.Name)"
            if ($item.PSIsContainer) {
                Show-Tree -path $item.FullName -prefix "$prefix    "
            }
        } else {
            Write-Host "$prefix├── $($item.Name)"
            if ($item.PSIsContainer) {
                Show-Tree -path $item.FullName -prefix "$prefix│   "
            }
        }
    }
}

Write-Host "Estrutura do Projeto"
Write-Host "===================="
Show-Tree
