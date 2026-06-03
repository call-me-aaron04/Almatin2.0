@echo off
echo ========================================
echo   SHIELDPLAN — Setup & Launch
echo ========================================
echo.

:: Check for Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Download from: https://nodejs.org/
    pause
    exit /b 1
)

:: ===== Backend Setup =====
echo [1/5] Installing backend dependencies...
cd /d "%~dp0backend"
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Backend npm install failed.
    pause
    exit /b 1
)

echo [2/5] Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] Prisma generate failed.
    pause
    exit /b 1
)

echo [3/5] Creating database...
call npx prisma db push
if %errorlevel% neq 0 (
    echo [ERROR] Database push failed.
    pause
    exit /b 1
)

echo [4/5] Seeding database...
call npx tsx src/seed.ts
if %errorlevel% neq 0 (
    echo [WARNING] Seed may have partially failed, continuing...
)

:: ===== Frontend Setup =====
echo [5/5] Installing frontend dependencies...
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Frontend npm install failed.
    pause
    exit /b 1
)

:: ===== Start Both Servers =====
echo.
echo ========================================
echo   Starting servers...
echo ========================================
echo.

:: Start backend in a new window
start "SHIELDPLAN Backend" cmd /c "cd /d "%~dp0backend" && npm run dev"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend in a new window
start "SHIELDPLAN Frontend" cmd /c "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================
echo   Servers starting!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo ========================================
echo.
echo   Close this window to stop both servers.
pause
