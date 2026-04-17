@echo off
title SuperAgent AI Assistant
echo Starting SuperAgent AI Assistant...

if not exist "server\node_modules" (
    echo Installing server dependencies...
    cd server && npm install && cd ..
)

if not exist "client\node_modules" (
    echo Installing client dependencies...
    cd client && npm install && cd ..
)

if not exist "desktop\node_modules" (
    echo Installing desktop dependencies...
    cd desktop && npm install && cd ..
)

echo Building client...
cd client && npm run build && cd ..

echo Launching app...
set NODE_ENV=production
cd desktop && npm start
