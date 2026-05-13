Set-Location 'C:\Users\Administrator\Documents\GitHub\build-and-deploy-webdev-asap'
$prompt = Get-Content -Raw 'continue-prompt.txt'
& 'C:\Users\Administrator\.local\bin\claude.exe' --dangerously-skip-permissions $prompt
