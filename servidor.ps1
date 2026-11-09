# Servidor local simples para o CifraMix (sem instalar nada). Usado por Iniciar-CifraMix.bat
$port = 8080
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$mime = @{ '.html'='text/html; charset=utf-8'; '.css'='text/css'; '.js'='text/javascript'; '.json'='application/json'; '.webmanifest'='application/manifest+json'; '.png'='image/png'; '.svg'='image/svg+xml'; '.ico'='image/x-icon' }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$port/")
try { $l.Start() } catch { Write-Host "Nao foi possivel usar a porta $port. Feche outros programas e tente de novo."; exit 1 }
Start-Process "http://localhost:$port/"
Write-Host "CifraMix rodando em http://localhost:$port/"
while ($l.IsListening) {
  $c = $l.GetContext()
  $p = [Uri]::UnescapeDataString($c.Request.Url.LocalPath)
  if ($p -eq '/') { $p = '/index.html' }
  $full = [IO.Path]::GetFullPath((Join-Path $root ($p.TrimStart('/') -replace '/', '\')))
  if ($full.StartsWith($root) -and (Test-Path -LiteralPath $full -PathType Leaf)) {
    $bytes = [IO.File]::ReadAllBytes($full)
    $ext = [IO.Path]::GetExtension($full).ToLower()
    $c.Response.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' })
    $c.Response.ContentLength64 = $bytes.Length
    $c.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else { $c.Response.StatusCode = 404 }
  $c.Response.Close()
}
