@echo off
title CifraMix
echo Iniciando o CifraMix em http://localhost:8080 ...
echo Deixe esta janela aberta enquanto usa o app. Feche-a para encerrar.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor.ps1"
pause
