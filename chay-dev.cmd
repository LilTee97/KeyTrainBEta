@echo off
rem Chay dev server KeyTrain doc lap voi phien Claude Code.
rem Nhay doi file nay la mo localhost:5173; dong cua so nay la tat server.
cd /d "%~dp0"
title KeyTrain dev — localhost:5173
echo.
echo   KeyTrain dev server
echo   Local:   http://localhost:5173/
echo   Dien thoai cung wifi: http://192.168.1.150:5173/
echo.
echo   Dong cua so nay de tat server.
echo.
npm run dev
pause
