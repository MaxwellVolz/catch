$outputFile = 'all_scripts.md'
$directories = @(
    '.\game-client\src\components\',
    '.\game-client\src\',
    '.\game-client\src\core\',
    '.\game-client\src\utils\',
    '.\game-client\src\handlers\',
    '.\game-server\src\'
)

# Clear the output file if it exists
Clear-Content $outputFile -ErrorAction SilentlyContinue

foreach ($dir in $directories) {
    Get-ChildItem -Path $dir -Filter *.js | ForEach-Object {
        $fileContent = Get-Content -Path $_.FullName
        Add-Content -Path $outputFile -Value "`n'$($_.FullName)'`n"
        Add-Content -Path $outputFile -Value "``````js"
        Add-Content -Path $outputFile -Value $fileContent
        Add-Content -Path $outputFile -Value "``````"
    }
}
